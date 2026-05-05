import type { PluginFunction } from '@graphql-codegen/plugin-helpers';
import {
  isEnumType,
  isListType,
  isNonNullType,
  isObjectType,
  type GraphQLEnumType,
  type GraphQLObjectType,
  type GraphQLOutputType,
} from 'graphql';

import {
  escapeString,
  filterSkippedEnumTypes,
  getEnumTypes,
  validateSharedConfig,
  type SharedPluginConfig,
} from '../../gql-codegen-smart-enum/src/shared.js';

export type TypePoliciesPluginConfig = SharedPluginConfig & {
  /** Import path for the generated smart-enum definitions file. Required. */
  enumImportPath: string;
  /** Suffix appended to GraphQL enum names when importing. Default: '' */
  enumClassSuffix?: string;
};

type EnumFieldKind = 'scalar' | 'list';

interface ResolvedEnumField {
  enumType: GraphQLEnumType;
  kind: EnumFieldKind;
}

const AUTO_HEADER_LINES = [
  '/**',
  ' * -----------------------------------------------------------------------------',
  ' * THIS FILE IS AUTO-GENERATED. DO NOT EDIT MANUALLY.',
  ' * Any manual changes will be overwritten by GraphQL Code Generator.',
  ' * -----------------------------------------------------------------------------',
  ' */',
] as const;

const validateTypePoliciesConfig = (config: TypePoliciesPluginConfig): void => {
  validateSharedConfig(config);

  if (
    typeof config.enumImportPath !== 'string' ||
    config.enumImportPath.length === 0
  ) {
    throw new TypeError(
      '[graphql-codegen-smart-enum-type-policies] Config `enumImportPath` must be a non-empty string.',
    );
  }
};

/**
 * Inspect a GraphQL output type and determine whether it represents
 * a scalar enum or a list of enums.
 *
 * Handles all wrapping permutations:
 *   Status        → { scalar }
 *   Status!       → { scalar }
 *   [Status]      → { list }
 *   [Status]!     → { list }
 *   [Status!]     → { list }
 *   [Status!]!    → { list }
 *
 * Returns null for any non-enum type (String, Int, object types, etc).
 */
const resolveEnumField = (
  fieldType: GraphQLOutputType,
): ResolvedEnumField | null => {
  // Strip outer NonNull
  const outerInner = isNonNullType(fieldType) ? fieldType.ofType : fieldType;

  if (isListType(outerInner)) {
    // Strip the list, then strip any inner NonNull
    const listInner = outerInner.ofType;
    const namedInner = isNonNullType(listInner) ? listInner.ofType : listInner;

    if (isEnumType(namedInner)) {
      return { enumType: namedInner, kind: 'list' };
    }
    return null;
  }

  if (isEnumType(outerInner)) {
    return { enumType: outerInner, kind: 'scalar' };
  }

  return null;
};

export const plugin: PluginFunction<TypePoliciesPluginConfig> = (
  schema,
  _documents,
  config,
): string => {
  validateTypePoliciesConfig(config);

  const enumClassSuffix = config.enumClassSuffix ?? '';
  const allowedEnumNames = new Set(
    filterSkippedEnumTypes(getEnumTypes(schema), config.skipEnums).map(
      enumType => enumType.name,
    ),
  );

  const objectTypes = Object.values(schema.getTypeMap())
    .filter(
      (type): type is GraphQLObjectType =>
        isObjectType(type) && !type.name.startsWith('__'),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const typeEntries: {
    typeName: string;
    fields: readonly {
      fieldName: string;
      enumTypeName: string;
      kind: EnumFieldKind;
    }[];
  }[] = [];

  for (const objectType of objectTypes) {
    const fieldMap = objectType.getFields();
    const sortedFieldNames = Object.keys(fieldMap).sort((a, b) =>
      a.localeCompare(b),
    );
    const enumFields: {
      fieldName: string;
      enumTypeName: string;
      kind: EnumFieldKind;
    }[] = [];
    for (const fieldName of sortedFieldNames) {
      const field = fieldMap[fieldName];
      const resolved = resolveEnumField(field.type);
      if (resolved !== null && allowedEnumNames.has(resolved.enumType.name)) {
        enumFields.push({
          fieldName,
          enumTypeName: resolved.enumType.name,
          kind: resolved.kind,
        });
      }
    }
    if (enumFields.length > 0) {
      typeEntries.push({ typeName: objectType.name, fields: enumFields });
    }
  }

  if (typeEntries.length === 0) {
    return '';
  }

  const referencedEnumNames = new Set<string>();
  for (const entry of typeEntries) {
    for (const field of entry.fields) {
      referencedEnumNames.add(field.enumTypeName);
    }
  }

  const sortedImportNames = [...referencedEnumNames].sort((a, b) =>
    a.localeCompare(b),
  );
  const importIdentifiers = sortedImportNames.map(
    name => `${name}${enumClassSuffix}`,
  );

  const lines: string[] = [
    ...AUTO_HEADER_LINES,
    '',
    `import { ${importIdentifiers.join(', ')} } from '${escapeString(config.enumImportPath)}';`,
    '',
    'export const smartEnumTypePolicies = {',
  ];

  for (const entry of typeEntries) {
    lines.push(`  ${entry.typeName}: {`);
    lines.push('    fields: {');
    for (const field of entry.fields) {
      const className = `${field.enumTypeName}${enumClassSuffix}`;
      lines.push(`      ${field.fieldName}: {`);
      if (field.kind === 'list') {
        lines.push('        read(existing: string[]) {');
        lines.push(
          `          return existing ? existing.map(v => ${className}.fromValue(v)) : existing;`,
        );
      } else {
        lines.push('        read(existing: string) {');
        lines.push(
          `          return existing ? ${className}.fromValue(existing) : existing;`,
        );
      }
      lines.push('        },');
      lines.push('      },');
    }
    lines.push('    },');
    lines.push('  },');
  }

  lines.push('};');
  lines.push('');
  return lines.join('\n');
};
