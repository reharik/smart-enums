# Apollo type policies

**Package:** [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies)

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that generates [Apollo Client `typePolicies`](https://www.apollographql.com/docs/react/caching/cache-configuration/#typepolicy-fields) for automatic enum rehydration. It walks your schema, finds every field on every object type that returns an enum, and emits `read` functions that convert raw cache strings back into live [`@reharik/smart-enum`](/core/creating-enums) members.

## The problem

When Apollo reads a query result from its normalized cache, enum fields come back as plain strings. Your components receive `'ACTIVE'` instead of `Status.active` — no `.display`, no `.key`, no custom fields, just a string you have to look up manually everywhere you use it.

## What it generates

Given this schema:

```graphql
enum PaymentStatus { PENDING PAID VOIDED }
enum SortDirection { ASC DESC }

type Order {
  id: ID!
  status: PaymentStatus!
  direction: SortDirection
  total: Float!
}

type Customer {
  id: ID!
  name: String!
  preferredSort: SortDirection!
}
```

and config `{ enumImportPath: './graphql-smart-enums' }`, the plugin emits:

```typescript
import { PaymentStatus, SortDirection } from './graphql-smart-enums';

export const smartEnumTypePolicies = {
  Customer: {
    fields: {
      preferredSort: {
        read(existing: string) {
          return existing ? SortDirection.fromValue(existing) : existing;
        },
      },
    },
  },
  Order: {
    fields: {
      direction: {
        read(existing: string) {
          return existing ? SortDirection.fromValue(existing) : existing;
        },
      },
      status: {
        read(existing: string) {
          return existing ? PaymentStatus.fromValue(existing) : existing;
        },
      },
    },
  },
};
```

The generated `read` functions call `.fromValue()`, which means those enum objects must exist somewhere the generated file can import them. That's what `enumImportPath` points at — usually the output of the [enum-definition plugin](/graphql/codegen-enums), or wherever your hand-authored enums are exported.

Non-enum fields (`id`, `total`, `name`) aren't included. Enum types that don't appear on any object field aren't imported. Object types, fields, and imports are sorted alphabetically for stable output.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-type-policies @graphql-codegen/cli graphql
```

## Configuration

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/generated/graphql-smart-enum-type-policies.ts': {
      plugins: ['@reharik/graphql-codegen-smart-enum-type-policies'],
      config: {
        enumImportPath: './graphql-smart-enums',
      },
    },
  },
};

export default config;
```

`enumImportPath` is the relative path from the generated type-policies file to wherever your smart-enum definitions are exported. If both generated files land in the same directory, it's just the filename without extension.

### Options

| Option | Type | Default | Required | Description |
| --- | --- | --- | --- | --- |
| `enumImportPath` | `string` | — | **Yes** | Import path written into the generated `import` statement. |
| `enumClassSuffix` | `string` | `''` | No | Suffix appended to enum names in imports and `fromValue` calls. Match your enum-definition codegen. |
| `skipEnums` | `string[]` | — | No | GraphQL enum type names to exclude. Fields of skipped enums are omitted. |

The two plugins are independent — this one doesn't care how your enum objects were created, only that they exist at `enumImportPath` and have a `.fromValue()` method.

## Wiring it into Apollo

```typescript
// src/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';

const cache = new InMemoryCache({
  typePolicies: {
    ...smartEnumTypePolicies,
    // any other type policies you have go here too
  },
});

export const apolloClient = new ApolloClient({
  link: new HttpLink({ uri: 'https://your-api.com/graphql' }),
  cache,
});
```

::: warning Merge order matters
If you spread `...smartEnumTypePolicies` and then later declare a policy for the **same type** (e.g. `MediaItem: { keyFields: ['id'] }`), the later declaration silently overrides the generated enum policies for that type. Merge them explicitly instead:

```typescript
typePolicies: {
  ...smartEnumTypePolicies,
  MediaItem: {
    ...smartEnumTypePolicies.MediaItem,
    keyFields: ['id'],
  },
}
```
:::

After that, every component reading from the cache gets members instead of strings:

```tsx
const { data } = useQuery(GET_ORDER, { variables: { id: orderId } });

// data.order.status === PaymentStatus.paid (a member, not 'PAID')
<span>{data.order.status.display}</span>  {/* 'Paid' */}
<span>{data.order.status.key}</span>      {/* 'paid' */}
<span>{data.order.status.value}</span>    {/* 'PAID' */}
```

## Edge cases & scope

The generated `read` uses a truthiness check, `existing ? Enum.fromValue(existing) : existing`:

- `null` → passes through as `null`
- `undefined` (cache miss / not yet loaded) → passes through as `undefined`
- `'ACTIVE'` → `Status.active`

If a string doesn't match any member, `fromValue` throws — same as calling it directly. For silent fallback, customize the policy yourself.

The plugin inspects `GraphQLObjectType` only — not input types or interfaces. It unwraps `NonNull` and `List` wrappers, so `PaymentStatus!`, `[PaymentStatus]`, and `[PaymentStatus!]!` all resolve. Introspection types (`__Schema`, `__Type`, …) are always skipped.

For list-of-enum fields, the generated `read` maps each element through `fromValue`, so an array column rehydrates element by element.
