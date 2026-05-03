import { isEnumType, type GraphQLSchema } from 'graphql';

export const patchSchemaEnumSerializers = (schema: GraphQLSchema): void => {
  const typeMap = schema.getTypeMap();

  for (const typeName in typeMap) {
    if (typeName.startsWith('__')) continue;

    const type = typeMap[typeName];
    if (!isEnumType(type)) continue;

    const originalSerialize = type.serialize.bind(type);

    type.serialize = (value: unknown): string | null | undefined => {
      const raw = (value as { value?: string })?.value ?? value;
      return originalSerialize(raw) as string | null | undefined;
    };
  }
};
