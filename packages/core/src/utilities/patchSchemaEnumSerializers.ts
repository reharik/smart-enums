import { isEnumType, type GraphQLSchema } from 'graphql';

export const patchSchemaEnumSerializers = (
  schema: GraphQLSchema,
  enumRegistry: Record<string, { fromValue: (v: string) => unknown }>,
): void => {
  const typeMap = schema.getTypeMap();

  for (const typeName in typeMap) {
    if (typeName.startsWith('__')) continue;

    const type = typeMap[typeName];
    if (!isEnumType(type)) continue;

    const originalSerialize = type.serialize.bind(type);
    const originalParseValue = type.parseValue.bind(type);
    const originalParseLiteral = type.parseLiteral.bind(type);
    const smartEnum = enumRegistry?.[typeName];

    type.serialize = (value: unknown) => {
      const raw = (value as { value?: string })?.value ?? value;
      return originalSerialize(raw);
    };

    if (smartEnum) {
      type.parseValue = (value: unknown) => {
        const parsed = originalParseValue(value) as string;
        return smartEnum.fromValue(parsed);
      };

      type.parseLiteral = (valueNode, variables) => {
        const parsed = originalParseLiteral(valueNode, variables) as string;
        return smartEnum.fromValue(parsed);
      };
    }
  }
};
