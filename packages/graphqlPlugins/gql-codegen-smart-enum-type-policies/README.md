# @reharik/graphql-codegen-smart-enum-type-policies

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that generates [Apollo Client `typePolicies`](https://www.apollographql.com/docs/react/caching/cache-configuration/) so enum fields come out of the cache as live [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) members instead of raw strings.

📖 **Full documentation:** https://reharik.github.io/smart-enums/graphql/type-policies

## The problem it removes

When Apollo reads a query result from its normalized cache, enum fields come back as plain strings — your component gets `'PAID'`, not `PaymentStatus.paid`. No `.display`, no `.key`, no metadata, so every component re-does the lookup by hand. This plugin walks your schema, finds every enum field on every object type, and emits a `read` function that rehydrates it. Spread the result into your cache and the lookups disappear.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-type-policies @graphql-codegen/cli graphql
```

## The shape of it

```typescript
// codegen target
'./src/generated/graphql-smart-enum-type-policies.ts': {
  plugins: ['@reharik/graphql-codegen-smart-enum-type-policies'],
  config: { enumImportPath: './graphql-smart-enums' },
},
```

```typescript
// your cache
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';

new InMemoryCache({ typePolicies: { ...smartEnumTypePolicies } });

// then, in a component:
data.order.status.display;   // 'Paid' — a real member, straight from the cache
```

It unwraps `NonNull`/`List` wrappers (lists rehydrate element by element), skips non-enum and introspection fields, and emits stable, alphabetized output. Config options, null/undefined handling, and the merge-order gotcha (a later policy for the same type can shadow these) are in the [docs](https://reharik.github.io/smart-enums/graphql/type-policies).

## Related packages

| Package | Purpose |
| --- | --- |
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) | Core library (runtime dependency) |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Generate the enum definitions this imports |
| [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset) | Wires the whole stack with zero per-enum config |

## License

MIT
