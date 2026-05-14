import type { PluginFunction } from '@graphql-codegen/plugin-helpers';
import {
  Kind,
  type DirectiveNode,
  type GraphQLEnumType,
  type GraphQLEnumValue,
  type GraphQLSchema,
  type ObjectValueNode,
} from 'graphql';
import { camelCase } from 'case-anything';

import type { SharedPluginConfig } from './shared.js';
import {
  escapeString,
  validateSharedConfig,
  filterSkippedEnumTypes,
  getEnumTypes,
  assertNoCamelCaseCollisions,
  quoteLiteral,
  lcFirst,
} from './shared.js';

export type SmartEnumPluginConfig = SharedPluginConfig & {
  enumClassSuffix?: string;
  emitDescriptionsAsDisplay?: boolean;
  serializeAs?: 'value' | 'wrapped';
  /**
   * Map of GraphQL enum type name → relative import path. Each key must appear
   * in `skipEnums` and must exist in the schema. Imports populate `enumRegistry`
   * for `patchSchemaEnumSerializers` without re-exporting the symbols.
   */
  externalEnums?: Record<string, string>;
};

const PLUGIN_PREFIX = '[graphql-codegen-smart-enum]';

const GRAPHQL_NAME_PATTERN = /^[_A-Za-z][_0-9A-Za-z]*$/;

const validateExternalEnumsConfig = (
  schema: GraphQLSchema,
  config: SmartEnumPluginConfig,
): void => {
  if (config.externalEnums === undefined) {
    return;
  }

  const externalEnums = config.externalEnums;

  if (
    typeof externalEnums !== 'object' ||
    externalEnums === null ||
    Array.isArray(externalEnums)
  ) {
    throw new TypeError(
      `${PLUGIN_PREFIX} Config \`externalEnums\` must be a plain object when provided.`,
    );
  }

  const keys = Object.keys(externalEnums);
  const skipSet = new Set(config.skipEnums ?? []);

  for (const key of keys) {
    if (typeof key !== 'string' || key.length === 0) {
      throw new TypeError(
        `${PLUGIN_PREFIX} Config \`externalEnums\` keys must be non-empty strings.`,
      );
    }

    if (!GRAPHQL_NAME_PATTERN.test(key)) {
      throw new TypeError(
        `${PLUGIN_PREFIX} Config \`externalEnums\` keys must be valid GraphQL type names. Invalid key: '${key}'.`,
      );
    }

    const importPath = externalEnums[key];
    if (typeof importPath !== 'string' || importPath.trim().length === 0) {
      throw new TypeError(
        `${PLUGIN_PREFIX} Config \`externalEnums['${key}']\` must be a non-empty import path string.`,
      );
    }
  }

  const notInSkipEnums = keys.filter(name => !skipSet.has(name));
  if (notInSkipEnums.length > 0) {
    throw new TypeError(
      `${PLUGIN_PREFIX} Config \`externalEnums\` must only reference enums that also appear in \`skipEnums\`. Missing from \`skipEnums\`: ${notInSkipEnums
        .map(n => `'${n}'`)
        .join(', ')}.`,
    );
  }

  const allEnumNames = new Set(
    getEnumTypes(schema).map(enumType => enumType.name),
  );
  const unknown = keys.filter(name => !allEnumNames.has(name));
  if (unknown.length > 0) {
    throw new Error(
      `${PLUGIN_PREFIX} Config \`externalEnums\` contains names that don't correspond to enum types in the schema: ${unknown
        .map(n => `'${n}'`)
        .join(', ')}. Available enum types: ${
        [...allEnumNames]
          .sort()
          .map(n => `'${n}'`)
          .join(', ') || '(none)'
      }.`,
    );
  }
};

const validateConfig = (config: SmartEnumPluginConfig): void => {
  validateSharedConfig(config);

  if (
    config.enumClassSuffix !== undefined &&
    typeof config.enumClassSuffix !== 'string'
  ) {
    throw new TypeError(
      '[graphql-codegen-smart-enum] Config `enumClassSuffix` must be a string when provided.',
    );
  }

  if (
    config.emitDescriptionsAsDisplay !== undefined &&
    typeof config.emitDescriptionsAsDisplay !== 'boolean'
  ) {
    throw new TypeError(
      '[graphql-codegen-smart-enum] Config `emitDescriptionsAsDisplay` must be a boolean when provided.',
    );
  }

  if (
    config.serializeAs !== undefined &&
    config.serializeAs !== 'value' &&
    config.serializeAs !== 'wrapped'
  ) {
    throw new TypeError(
      `[graphql-codegen-smart-enum] config.serializeAs must be 'value' or 'wrapped'`,
    );
  }
};

const DEFAULT_ENUM_CLASS_SUFFIX = '';
const ENUM_META_DIRECTIVE_NAME = 'enumMeta';

/** Names that must not appear in `props` (SmartEnum item keys and plugin-emitted fields). */
const RESERVED_CUSTOM_PROP_NAMES = new Set([
  'key',
  'value',
  'display',
  'shortDisplay',
  'description',
  'sortOrder',
  'deprecated',
  'deprecationReason',
  'index',
  '__smart_enum_brand',
  '__smart_enum_type',
]);

type ParsedEnumValueMeta = {
  display?: string;
  shortDisplay?: string;
  description?: string;
  sortOrder?: number;
  props?: readonly { name: string; value: string }[];
};

const deriveDisplayFromEnumKey = (enumKey: string): string => {
  return enumKey
    .trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_\-\s]+/g, ' ')
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
};

const getEnumValueDirective = (
  enumValue: GraphQLEnumValue,
  directiveName: string,
): DirectiveNode | undefined => {
  return enumValue.astNode?.directives?.find(
    directive => directive.name.value === directiveName,
  );
};

const parseStringDirectiveArg = (
  directive: DirectiveNode,
  argName: string,
): string | undefined => {
  const argValue = directive.arguments?.find(
    argument => argument.name.value === argName,
  )?.value;

  return argValue?.kind === Kind.STRING ? argValue.value : undefined;
};

const parseIntDirectiveArg = (
  directive: DirectiveNode,
  argName: string,
): number | undefined => {
  const argValue = directive.arguments?.find(
    argument => argument.name.value === argName,
  )?.value;

  if (argValue?.kind !== Kind.INT) {
    return undefined;
  }

  const parsed = Number.parseInt(argValue.value, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
};

const parseObjectFieldString = (
  objectNode: ObjectValueNode,
  fieldName: string,
): string | undefined => {
  const field = objectNode.fields.find(f => f.name.value === fieldName)?.value;
  return field !== undefined && field.kind === Kind.STRING
    ? field.value
    : undefined;
};

const parsePropsListFromDirective = (
  directive: DirectiveNode,
  argName: string,
): readonly { name: string; value: string }[] | undefined => {
  const argValue = directive.arguments?.find(
    argument => argument.name.value === argName,
  )?.value;

  if (argValue?.kind !== Kind.LIST) {
    return undefined;
  }

  const pairs: { name: string; value: string }[] = [];
  for (const element of argValue.values) {
    if (element.kind !== Kind.OBJECT) {
      continue;
    }
    const name = parseObjectFieldString(element, 'name');
    const value = parseObjectFieldString(element, 'value');
    if (name !== undefined && value !== undefined) {
      pairs.push({ name, value });
    }
  }

  return pairs.length > 0 ? pairs : undefined;
};

/** True when @enumMeta only contributes `props` (no display/shortDisplay/description/sortOrder args). */
const isPropsOnlyMeta = (
  parsedMeta?: ParsedEnumValueMeta,
): parsedMeta is ParsedEnumValueMeta & {
  props: readonly { name: string; value: string }[];
} => {
  if (
    parsedMeta === undefined ||
    parsedMeta.props === undefined ||
    parsedMeta.props.length === 0
  ) {
    return false;
  }
  return (
    parsedMeta.display === undefined &&
    parsedMeta.shortDisplay === undefined &&
    parsedMeta.description === undefined &&
    parsedMeta.sortOrder === undefined
  );
};

const UNQUOTED_OBJECT_KEY_PATTERN = /^[A-Za-z_$][A-Za-z0-9_$]*$/;

const formatEmittedCustomPropKey = (name: string): string => {
  if (
    UNQUOTED_OBJECT_KEY_PATTERN.test(name) &&
    !RESERVED_CUSTOM_PROP_NAMES.has(name)
  ) {
    return name;
  }
  return `[${JSON.stringify(name)}]`;
};

const validateCustomProps = (
  props: readonly { name: string; value: string }[],
  enumTypeName: string,
  enumValueName: string,
): void => {
  const seen = new Set<string>();
  for (const prop of props) {
    if (seen.has(prop.name)) {
      throw new Error(
        `[graphql-codegen-smart-enum] Duplicate enumMeta props name "${prop.name}" on ${enumTypeName}.${enumValueName}.`,
      );
    }
    seen.add(prop.name);
    if (RESERVED_CUSTOM_PROP_NAMES.has(prop.name)) {
      throw new Error(
        `[graphql-codegen-smart-enum] enumMeta props name "${prop.name}" is reserved on ${enumTypeName}.${enumValueName}.`,
      );
    }
  }
};

const parseEnumMetaDirective = (
  enumValue: GraphQLEnumValue,
): ParsedEnumValueMeta | undefined => {
  const enumMetaDirective = getEnumValueDirective(
    enumValue,
    ENUM_META_DIRECTIVE_NAME,
  );
  if (!enumMetaDirective) {
    return undefined;
  }

  const props = parsePropsListFromDirective(enumMetaDirective, 'props');

  const parsedMeta: ParsedEnumValueMeta = {
    display: parseStringDirectiveArg(enumMetaDirective, 'display'),
    shortDisplay: parseStringDirectiveArg(enumMetaDirective, 'shortDisplay'),
    description: parseStringDirectiveArg(enumMetaDirective, 'description'),
    sortOrder: parseIntDirectiveArg(enumMetaDirective, 'sortOrder'),
    props,
  };

  if (
    parsedMeta.display === undefined &&
    parsedMeta.shortDisplay === undefined &&
    parsedMeta.description === undefined &&
    parsedMeta.sortOrder === undefined &&
    (parsedMeta.props === undefined || parsedMeta.props.length === 0)
  ) {
    return undefined;
  }

  return parsedMeta;
};

const getTrimmedEnumValueDescription = (
  enumValue: GraphQLEnumValue,
): string | undefined => {
  const description = enumValue.description?.trim();
  return typeof description === 'string' && description.length > 0
    ? description
    : undefined;
};

const resolveEnumValueDisplay = (
  enumValue: GraphQLEnumValue,
  parsedMeta?: ParsedEnumValueMeta,
): string => {
  if (typeof parsedMeta?.display === 'string') {
    return parsedMeta.display;
  }

  const valueDescription = getTrimmedEnumValueDescription(enumValue);
  if (typeof valueDescription === 'string') {
    return valueDescription;
  }

  return deriveDisplayFromEnumKey(enumValue.name);
};

const resolveEnumValueDescription = (
  enumValue: GraphQLEnumValue,
  parsedMeta?: ParsedEnumValueMeta,
): string | undefined => {
  if (typeof parsedMeta?.description === 'string') {
    return parsedMeta.description;
  }

  return getTrimmedEnumValueDescription(enumValue);
};

const buildEnumBlock = (
  enumName: string,
  enumType: GraphQLEnumType,
  enumClassSuffix: string,
  emitDescriptionsAsDisplay: boolean,
  serializeAs?: 'value' | 'wrapped',
): { inputLine: string; typeLine: string; enumLine: string } => {
  const generatedName = `${enumName}${enumClassSuffix}`;
  const { inputDefinition, inputName } = buildInput(
    generatedName,
    enumType,
    emitDescriptionsAsDisplay,
  );

  return {
    inputLine: inputDefinition,
    typeLine: `export type ${generatedName} = Enumeration<typeof ${generatedName}>;`,
    enumLine: `export const ${generatedName} = enumeration<typeof ${inputName}>('${escapeString(enumName)}', { input: ${inputName}${
      serializeAs ? `, serializeAs: '${serializeAs}'` : ''
    } });`,
  };
};

const buildExternalImportLines = (
  externalEntries: readonly { importPath: string; identifier: string }[],
): string[] => {
  if (externalEntries.length === 0) {
    return [];
  }

  const byPath = new Map<string, Set<string>>();
  for (const entry of externalEntries) {
    const set = byPath.get(entry.importPath) ?? new Set<string>();
    set.add(entry.identifier);
    byPath.set(entry.importPath, set);
  }

  return [...byPath.entries()]
    .sort(([leftPath], [rightPath]) => leftPath.localeCompare(rightPath))
    .map(([importPath, identifiers]) => {
      const names = [...identifiers].sort((a, b) => a.localeCompare(b));
      return `import { ${names.join(', ')} } from '${escapeString(importPath)}';`;
    });
};

const formatRegistryProperty = (
  graphqlTypeName: string,
  tsIdentifier: string,
): string =>
  graphqlTypeName === tsIdentifier
    ? tsIdentifier
    : `${graphqlTypeName}: ${tsIdentifier}`;

export const plugin: PluginFunction<SmartEnumPluginConfig> = (
  schema,
  _documents,
  config,
): string => {
  validateConfig(config);
  validateExternalEnumsConfig(schema, config);

  const enumClassSuffix = config.enumClassSuffix ?? DEFAULT_ENUM_CLASS_SUFFIX;
  const emitDescriptionsAsDisplay = config.emitDescriptionsAsDisplay ?? true;

  const enumTypes = filterSkippedEnumTypes(
    getEnumTypes(schema),
    config.skipEnums,
  );

  const externalEnumTypeNames =
    config.externalEnums === undefined
      ? []
      : Object.keys(config.externalEnums).sort((a, b) => a.localeCompare(b));

  const externalRegistryEntries = externalEnumTypeNames.map(typeName => ({
    graphqlTypeName: typeName,
    importPath: config.externalEnums![typeName],
    identifier: `${typeName}${enumClassSuffix}`,
  }));

  if (enumTypes.length === 0 && externalRegistryEntries.length === 0) {
    return '';
  }

  const blocks = enumTypes.map(enumType =>
    buildEnumBlock(
      enumType.name,
      enumType,
      enumClassSuffix,
      emitDescriptionsAsDisplay,
      config.serializeAs,
    ),
  );
  const inputLines = blocks.map(block => block.inputLine);
  const typeLines = blocks.map(block => block.typeLine);
  const enumLines = blocks.map(block => block.enumLine);

  const generatedRegistryRows = enumTypes.map(enumType => ({
    graphqlTypeName: enumType.name,
    identifier: `${enumType.name}${enumClassSuffix}`,
  }));

  const combinedRegistryRows = [
    ...generatedRegistryRows,
    ...externalRegistryEntries.map(e => ({
      graphqlTypeName: e.graphqlTypeName,
      identifier: e.identifier,
    })),
  ].sort((a, b) =>
    a.graphqlTypeName.localeCompare(b.graphqlTypeName, undefined, {
      sensitivity: 'base',
    }),
  );

  const registryProperties = combinedRegistryRows.map(row =>
    formatRegistryProperty(row.graphqlTypeName, row.identifier),
  );

  const registryLine =
    registryProperties.length > 0
      ? `export const enumRegistry = { ${registryProperties.join(', ')} } as const;`
      : '';

  const externalImportLines = buildExternalImportLines(externalRegistryEntries);

  const smartEnumImportLine =
    enumTypes.length > 0
      ? "import { enumeration, type Enumeration } from '@reharik/smart-enum';"
      : '';

  const lines: string[] = [
    '/**',
    ' * -----------------------------------------------------------------------------',
    ' * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.',
    ' * Any manual changes will be overwritten by GraphQL Code Generator.',
    ' * -----------------------------------------------------------------------------',
    ' */',
  ];

  const appendBlock = (chunk: readonly string[]): void => {
    if (chunk.length === 0) {
      return;
    }
    lines.push('', ...chunk);
  };

  if (smartEnumImportLine.length > 0) {
    appendBlock([smartEnumImportLine]);
  }

  if (externalImportLines.length > 0) {
    appendBlock(externalImportLines);
  }

  appendBlock(inputLines);
  appendBlock(typeLines);
  appendBlock(enumLines);

  if (registryLine.length > 0) {
    appendBlock([registryLine]);
  }

  lines.push('');
  return lines.join('\n');
};

const buildInput = (
  generatedName: string,
  enumType: GraphQLEnumType,
  emitDescriptionsAsDisplay: boolean,
): { inputDefinition: string; inputName: string } => {
  const inputName = `${lcFirst(generatedName)}Input`;
  const enumValues = enumType.getValues();
  const originalEnumValues = enumValues.map(enumValue => enumValue.name);
  assertNoCamelCaseCollisions(enumType.name, originalEnumValues);
  const hasDescriptions = enumValues.some(
    enumValue =>
      typeof enumValue.description === 'string' &&
      enumValue.description.trim().length > 0,
  );
  const hasDeprecatedValues = enumValues.some(
    enumValue => typeof enumValue.deprecationReason === 'string',
  );
  const hasEnumMeta = enumValues.some(
    enumValue => parseEnumMetaDirective(enumValue) !== undefined,
  );
  const shouldUseObjectInput =
    hasDeprecatedValues ||
    hasEnumMeta ||
    (emitDescriptionsAsDisplay && hasDescriptions);

  const inputDefinition = shouldUseObjectInput
    ? `const ${inputName} = { ${enumValues
        .map(enumValue => {
          const parsedMeta = parseEnumMetaDirective(enumValue);
          const resolvedDisplay = resolveEnumValueDisplay(
            enumValue,
            parsedMeta,
          );
          const resolvedDescription = resolveEnumValueDescription(
            enumValue,
            parsedMeta,
          );
          const objectFields: string[] = [];
          const entryKey = camelCase(enumValue.name);
          const hasParsedMeta = parsedMeta !== undefined;
          const propsOnly = isPropsOnlyMeta(parsedMeta);

          if (!propsOnly && (emitDescriptionsAsDisplay || hasParsedMeta)) {
            objectFields.push(`display: '${escapeString(resolvedDisplay)}'`);
          }

          if (typeof parsedMeta?.shortDisplay === 'string') {
            objectFields.push(
              `shortDisplay: '${escapeString(parsedMeta.shortDisplay)}'`,
            );
          }

          if (hasParsedMeta && typeof resolvedDescription === 'string') {
            objectFields.push(
              `description: '${escapeString(resolvedDescription)}'`,
            );
          }

          if (typeof parsedMeta?.sortOrder === 'number') {
            objectFields.push(`sortOrder: ${parsedMeta.sortOrder}`);
          }

          if (parsedMeta?.props !== undefined && parsedMeta.props.length > 0) {
            validateCustomProps(
              parsedMeta.props,
              enumType.name,
              enumValue.name,
            );
            for (const prop of parsedMeta.props) {
              objectFields.push(
                `${formatEmittedCustomPropKey(prop.name)}: '${escapeString(prop.value)}'`,
              );
            }
          }

          if (typeof enumValue.deprecationReason === 'string') {
            objectFields.push(
              'deprecated: true',
              `deprecationReason: '${escapeString(enumValue.deprecationReason)}'`,
            );
          }

          return `${quoteLiteral(entryKey)}: { ${objectFields.join(', ')} }`;
        })
        .join(', ')} } as const;`
    : `const ${inputName} = [${enumValues
        .map(enumValue => quoteLiteral(camelCase(enumValue.name)))
        .join(', ')}] as const;`;
  return { inputDefinition, inputName };
};
