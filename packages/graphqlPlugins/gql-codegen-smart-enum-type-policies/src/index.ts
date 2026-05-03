import type { PluginFunction } from '@graphql-codegen/plugin-helpers';
import {
  getNamedType,
  isEnumType,
  isObjectType,
  type GraphQLObjectType,
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
    fields: readonly { fieldName: string; enumTypeName: string }[];
  }[] = [];

  for (const objectType of objectTypes) {
    const fieldMap = objectType.getFields();
    const sortedFieldNames = Object.keys(fieldMap).sort((a, b) =>
      a.localeCompare(b),
    );
    const enumFields: { fieldName: string; enumTypeName: string }[] = [];
    for (const fieldName of sortedFieldNames) {
      const field = fieldMap[fieldName];
      const named = getNamedType(field.type);
      if (isEnumType(named) && allowedEnumNames.has(named.name)) {
        enumFields.push({ fieldName, enumTypeName: named.name });
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
      lines.push('        read(existing: string) {');
      lines.push(
        `          return existing ? ${className}.fromValue(existing) : existing;`,
      );
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
