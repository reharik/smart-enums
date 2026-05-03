# @reharik/graphql-codegen-smart-enum-type-policies

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that generates [Apollo Client `typePolicies`](https://www.apollographql.com/docs/react/caching/cache-configuration/#typepolicy-fields) for automatic smart-enum rehydration. It walks your schema, finds every field on every object type that returns an enum, and emits `read` functions that convert raw cache strings back into live [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) instances.

## The problem

When Apollo Client reads a query result from its normalized cache, enum fields come back as plain strings. Your components receive `'ACTIVE'` instead of `Status.active`, which means no `.display`, no `.key`, no custom fields — just a raw string you have to look up manually everywhere you use it.

## What this plugin does

It generates a `typePolicies` config object you spread into your `InMemoryCache`. Every enum field on every object type gets a `read` function that calls `EnumName.fromValue(existing)`, so cache reads return smart-enum instances automatically.

## What it generates

Given this schema:

```graphql
enum PaymentStatus {
  PENDING
  PAID
  VOIDED
}
enum SortDirection {
  ASC
  DESC
}

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

And config `{ enumImportPath: './graphql-smart-enums' }`, the plugin emits:

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

The generated `read` functions call `.fromValue()` on smart-enum objects, which means those objects need to exist somewhere your generated file can import them. That's what `enumImportPath` points to — the file where your smart-enum definitions live. If you use [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) to generate them, point `enumImportPath` at that output file. If your enums are hand-authored, point it wherever they're exported from.

Non-enum fields (`id`, `total`, `name`) are not included. Enum types that don't appear on any object type field are not imported. Object types, fields, and imports are all sorted alphabetically for stable output.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-type-policies @graphql-codegen/cli graphql
```

## Configuration

### `codegen.ts`

```typescript
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

The `enumImportPath` is the import path that will appear in the generated file's `import` statement. It should be the relative path from the generated type-policies file to wherever your smart-enum definitions are exported. If both generated files go in the same directory, it's just the filename without the extension.

### Using with the enum-definition plugin

If you also use [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) to generate your enum definitions, a typical codegen config looks like:

```typescript
const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    './src/generated/graphql-smart-enums.ts': {
      plugins: ['@reharik/graphql-codegen-smart-enum'],
      config: {
        emitDescriptionsAsDisplay: true,
      },
    },
    './src/generated/graphql-smart-enum-type-policies.ts': {
      plugins: ['@reharik/graphql-codegen-smart-enum-type-policies'],
      config: {
        enumImportPath: './graphql-smart-enums',
      },
    },
  },
};
```

The two plugins are independent — they can be used together or separately. This plugin doesn't care how your smart-enum objects were created, only that they exist at the import path you specify and have a `.fromValue()` method.

### Config options

| Option            | Type       | Default | Required | Description                                                                                                                        |
| ----------------- | ---------- | ------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `enumImportPath`  | `string`   | —       | **Yes**  | Import path written into the generated file's `import` statement. Usually a relative path to your smart-enum definitions file.     |
| `enumClassSuffix` | `string`   | `''`    | No       | Suffix appended to enum names in imports and `fromValue` calls. If your enums are named `PaymentStatusEnum`, set this to `'Enum'`. |
| `skipEnums`       | `string[]` | —       | No       | GraphQL enum type names to exclude. Fields of skipped enum types are omitted from the output.                                      |

## Using the generated type policies

Here's where the generated output fits into a typical Apollo Client setup. This is usually in a file like `src/apolloClient.ts` or wherever you configure your client:

```typescript
// src/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';

const httpLink = new HttpLink({
  uri: 'https://your-api.com/graphql',
});

const cache = new InMemoryCache({
  typePolicies: {
    ...smartEnumTypePolicies,
    // any other type policies you have go here too
  },
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
});
```

Then in your app's entry point, wrap your component tree with the provider as usual:

```tsx
// src/App.tsx
import { ApolloProvider } from '@apollo/client';
import { apolloClient } from './apolloClient';

function App() {
  return (
    <ApolloProvider client={apolloClient}>
      <YourRoutes />
    </ApolloProvider>
  );
}
```

That's it. Now every component that reads from the cache gets smart-enum instances instead of raw strings:

```tsx
// src/components/OrderStatus.tsx
import { useQuery, gql } from '@apollo/client';

const GET_ORDER = gql`
  query GetOrder($id: ID!) {
    order(id: $id) {
      id
      status
      direction
    }
  }
`;

function OrderStatus({ orderId }: { orderId: string }) {
  const { data } = useQuery(GET_ORDER, { variables: { id: orderId } });

  if (!data) return null;

  // Without type policies: data.order.status === 'PAID' (just a string)
  // With type policies:    data.order.status === PaymentStatus.paid (smart-enum instance)

  return (
    <div>
      <span>{data.order.status.display}</span>   {/* 'Paid' */}
      <span>{data.order.status.key}</span>        {/* 'paid' */}
      <span>{data.order.status.value}</span>      {/* 'PAID' */}
    </div>
  );
}

## How `read` functions handle edge cases

The generated `read` functions use a truthiness check: `existing ? Enum.fromValue(existing) : existing`. This means:

- `null` (field is nullable and explicitly null) → passes through as `null`
- `undefined` (field not yet loaded / cache miss) → passes through as `undefined`
- `'ACTIVE'` → `Status.active` (the smart-enum instance)

If the string doesn't match any enum member, `fromValue` throws — same behavior as calling it directly. If you need silent fallback, you'd customize the type policy yourself.

## Scope

The plugin only inspects `GraphQLObjectType` — not input types, not interfaces. It unwraps `NonNull` and `List` wrappers to find the underlying type, so `PaymentStatus!`, `[PaymentStatus]`, and `[PaymentStatus!]!` all resolve correctly.

Introspection types (`__Schema`, `__Type`, etc.) are always skipped.

## Related packages

| Package | Purpose |
|---|---|
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) | Core smart-enum library (runtime dependency) |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Generate smart-enum definitions from GraphQL schema enums |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex) | Knex query-level enum revival |

## License

MIT
```
