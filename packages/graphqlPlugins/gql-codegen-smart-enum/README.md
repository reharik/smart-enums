# @reharik/graphql-codegen-smart-enum

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that turns your schema's `enum` types into [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) definitions. Your SDL becomes the single source of truth; the smart-enum objects — keys, wire values, display strings, deprecation flags — are generated from it.

📖 **Full documentation:** https://reharik.github.io/smart-enums/graphql/codegen-enums

## Why generate them

If your enums already live in a GraphQL schema, hand-writing a matching TypeScript enum is busywork that rots. Every new schema value is a second edit somewhere else, and the day someone forgets, your types and your schema quietly disagree until something breaks at runtime. Generating the definitions means they can't drift — add a value to the schema, run codegen, and the smart enum updated with it.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum @graphql-codegen/cli graphql
```

## The shape of it

```graphql
"""Payment processing status"""
enum PaymentStatus {
  """Waiting for payment"""
  PENDING
  """Payment completed"""
  PAID
}
```

becomes a ready-to-use smart enum (descriptions become `display`, the GraphQL type name becomes the serialization identity):

```typescript
export const PaymentStatus = enumeration('PaymentStatus', {
  input: {
    pending: { display: 'Waiting for payment' },
    paid: { display: 'Payment completed' },
  } as const,
});
```

Point a codegen target at the plugin and you're done:

```typescript
'./src/generated/graphql-smart-enums.ts': {
  plugins: ['@reharik/graphql-codegen-smart-enum'],
  config: { emitDescriptionsAsDisplay: true },
},
```

Richer per-value metadata via the `@enumMeta` directive, hand-authored enums via `externalEnums`, the generated `enumRegistry` barrel, and every config option are covered in the [docs](https://reharik.github.io/smart-enums/graphql/codegen-enums) and the [`@enumMeta` guide](https://reharik.github.io/smart-enums/graphql/enum-meta).

## Related packages

| Package | Purpose |
| --- | --- |
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) | Core library (runtime dependency) |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Apollo cache rehydration |
| [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset) | Wires the whole stack with zero per-enum config |

## License

MIT
