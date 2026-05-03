import { isEnumType, type GraphQLEnumType, type GraphQLSchema } from 'graphql';

export type SharedPluginConfig = {
  skipEnums?: string[];
};

export const validateSharedConfig = (config: SharedPluginConfig): void => {
  if (config.skipEnums !== undefined) {
    if (!Array.isArray(config.skipEnums)) {
      throw new TypeError(
        '[graphql-codegen-smart-enum] Config `skipEnums` must be an array of strings when provided.',
      );
    }

    for (const name of config.skipEnums) {
      if (typeof name !== 'string') {
        throw new TypeError(
          '[graphql-codegen-smart-enum] Config `skipEnums` must contain only string enum type names.',
        );
      }
    }
  }
};

export const escapeString = (value: string): string => {
  return value
    .replaceAll('\\', String.raw`\\`)
    .replaceAll("'", String.raw`\'`)
    .replaceAll('\r', String.raw`\r`)
    .replaceAll('\n', String.raw`\n`);
};

/** Lowercases the first character (previous name: `lcFirst` / camelCase-leading de-cap). */
export const uncapitalize = (value: string): string => {
  if (value.length === 0) {
    return value;
  }

  return `${value.charAt(0).toLowerCase()}${value.slice(1)}`;
};

export const toCamelCase = (value: string): string => {
  const normalized = value
    .trim()
    .replaceAll(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replaceAll(/[_\-\s]+/g, ' ')
    .toLowerCase();
  const parts = normalized.split(' ').filter(Boolean);

  if (parts.length === 0) {
    return '';
  }

  const [first, ...rest] = parts;
  return [
    first,
    ...rest.map(part => `${part.charAt(0).toUpperCase()}${part.slice(1)}`),
  ].join('');
};

export const isNonIntrospectionEnumType = (
  type: ReturnType<GraphQLSchema['getTypeMap']>[string],
): type is GraphQLEnumType => {
  return isEnumType(type) && !type.name.startsWith('__');
};

export const getEnumTypes = (
  schema: GraphQLSchema,
): readonly GraphQLEnumType[] => {
  return Object.values(schema.getTypeMap())
    .filter(type => isNonIntrospectionEnumType(type))
    .sort((left, right) => left.name.localeCompare(right.name));
};

export const filterSkippedEnumTypes = (
  enumTypes: readonly GraphQLEnumType[],
  skipEnums: string[] | undefined,
): readonly GraphQLEnumType[] => {
  if (skipEnums === undefined || skipEnums.length === 0) {
    return enumTypes;
  }

  const skip = new Set(skipEnums);
  return enumTypes.filter(enumType => !skip.has(enumType.name));
};

export const assertNoCamelCaseCollisions = (
  enumName: string,
  originalValues: readonly string[],
): void => {
  const byCamelCase = new Map<string, string[]>();

  for (const originalValue of originalValues) {
    const camelCasedValue = toCamelCase(originalValue);
    const existing = byCamelCase.get(camelCasedValue) ?? [];
    byCamelCase.set(camelCasedValue, [...existing, originalValue]);
  }

  const collisions = [...byCamelCase.entries()].filter(
    ([, values]) => values.length > 1,
  );

  if (collisions.length === 0) {
    return;
  }

  const details = collisions
    .map(
      ([camelKey, values]) =>
        `"${camelKey}" <- [${values.map(value => `"${value}"`).join(', ')}]`,
    )
    .join('; ');
  throw new Error(
    `[graphql-codegen-smart-enum] CamelCase collision in enum "${enumName}". Conflicting values: ${details}.`,
  );
};

export const quoteLiteral = (value: unknown): string => {
  if (typeof value === 'string') {
    return `'${escapeString(value)}'`;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return `${value}`;
  }

  return `'${escapeString(String(value))}'`;
};
