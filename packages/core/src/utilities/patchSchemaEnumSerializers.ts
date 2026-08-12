import { isEnumType, type GraphQLSchema } from 'graphql';

// String marker (not a Symbol) so a second *copy* of the library sees it too.
// Double-patching wraps parseValue twice: the inner wrapper returns an enum
// item, the outer calls fromValue(<item>) and throws "No enum value found" —
// an error that names the wrong thing entirely. Patching is idempotent instead.
const PATCHED_MARKER = '__smart_enum_serializers_patched';

export const patchSchemaEnumSerializers = (
  schema: GraphQLSchema,
  enumRegistry: Record<string, { fromValue: (v: string) => unknown }>,
): void => {
  if (Reflect.get(schema, PATCHED_MARKER) === true) {
    return;
  }
  Object.defineProperty(schema, PATCHED_MARKER, {
    value: true,
    enumerable: false,
  });

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
