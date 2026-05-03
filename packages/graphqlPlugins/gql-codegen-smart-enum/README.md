# @reharik/graphql-codegen-smart-enum

[GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that turns your schema's `enum` types into [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) definitions. You define enums in your SDL; codegen produces type-safe smart-enum objects with lookup methods, display strings, and full TypeScript inference — no hand-authored enum files to keep in sync with your schema.

## What it generates

Given this schema:

```graphql
"""
Payment processing status
"""
enum PaymentStatus {
  """
  Waiting for payment
  """
  PENDING
  """
  Payment completed successfully
  """
  PAID
  """
  Payment was canceled
  """
  CANCELED @deprecated(reason: "Use VOIDED")
  """
  Payment was voided
  """
  VOIDED
}

enum SortDirection {
  ASC
  DESC
}
```

The plugin emits:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const paymentStatusInput = {
  pending: { display: 'Waiting for payment' },
  paid: { display: 'Payment completed successfully' },
  canceled: {
    display: 'Payment was canceled',
    deprecated: true,
    deprecationReason: 'Use VOIDED',
  },
  voided: { display: 'Payment was voided' },
} as const;

const sortDirectionInput = ['asc', 'desc'] as const;

export type PaymentStatus = Enumeration<typeof PaymentStatus>;
export type SortDirection = Enumeration<typeof SortDirection>;

export const PaymentStatus = enumeration<typeof paymentStatusInput>(
  'PaymentStatus',
  { input: paymentStatusInput },
);
export const SortDirection = enumeration<typeof sortDirectionInput>(
  'SortDirection',
  { input: sortDirectionInput },
);
```

Enum values with descriptions get object input with `display` metadata. Plain enums without descriptions or deprecations get the compact array form. Deprecated values always force object input so the `deprecated` flag is preserved.

All member keys are camelCased from the GraphQL value name (`IN_REVIEW` → `inReview`). If camelCasing causes a collision within an enum, codegen fails with a clear error.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum @graphql-codegen/cli graphql
```

`@reharik/smart-enum` is a runtime dependency (generated files import it). The codegen plugin and CLI are dev-only.

## Configuration

### `codegen.ts`

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    // Standard TypeScript types (optional, from @graphql-codegen/typescript)
    './src/generated/graphql-types.ts': {
      plugins: ['typescript'],
    },
    // Smart-enum definitions
    './src/generated/graphql-smart-enums.ts': {
      plugins: ['@reharik/graphql-codegen-smart-enum'],
      config: {
        emitDescriptionsAsDisplay: true,
      },
    },
  },
};

export default config;
```

### Config options

| Option                      | Type       | Default | Description                                                                                                                                             |
| --------------------------- | ---------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `emitDescriptionsAsDisplay` | `boolean`  | `true`  | Use GraphQL enum value descriptions as the `display` field. When `false`, only enums with deprecated values or `@enumMeta` directives get object input. |
| `enumClassSuffix`           | `string`   | `''`    | Suffix appended to generated enum names (e.g. `'Enum'` → `PaymentStatusEnum`).                                                                          |
| `skipEnums`                 | `string[]` | —       | GraphQL enum type names to exclude from output.                                                                                                         |

## Enum metadata with `@enumMeta`

For richer metadata than what GraphQL descriptions provide, use the `@enumMeta` directive on enum values.

### Setup

Define the directive and its input type in your schema:

```graphql
input EnumMetaProp {
  name: String!
  value: String!
}

directive @enumMeta(
  display: String
  shortDisplay: String
  description: String
  sortOrder: Int
  props: [EnumMetaProp!]
) on ENUM_VALUE
```

### Usage

```graphql
enum ClaimStatus {
  OPEN @enumMeta(display: "Open", sortOrder: 1)
  IN_REVIEW
    @enumMeta(
      display: "In Review"
      shortDisplay: "Review"
      description: "Waiting for adjudication"
      sortOrder: 2
    )
  CLOSED @enumMeta(display: "Closed", sortOrder: 3)
}
```

### Field resolution order

Each field resolves with these fallbacks:

| Field          | Priority                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------ |
| `display`      | `@enumMeta(display:)` → GraphQL value description → derived from key (`IN_REVIEW` → `In Review`) |
| `description`  | `@enumMeta(description:)` → GraphQL value description → omitted                                  |
| `shortDisplay` | `@enumMeta(shortDisplay:)` → omitted                                                             |
| `sortOrder`    | `@enumMeta(sortOrder:)` → omitted                                                                |

### Custom key-value props

Attach arbitrary string properties to enum members:

```graphql
enum AlbumSortBy {
  CREATED_AT @enumMeta(props: [{ name: "column", value: "created_at" }])
  TITLE @enumMeta(props: [{ name: "column", value: "title" }])
}
```

Generates:

```typescript
const albumSortByInput = {
  createdAt: { column: 'created_at' },
  title: { column: 'title' },
} as const;
```

When `@enumMeta` on a value _only_ supplies `props` (no `display`, `shortDisplay`, `description`, or `sortOrder`), the plugin does not emit a derived `display` field — even when `emitDescriptionsAsDisplay` is `true`.

Prop names that aren't valid JS identifiers use computed keys (e.g. `["weird-key"]: 'value'`). Duplicate prop names and reserved names (`key`, `value`, `display`, `deprecated`, `index`, etc.) are rejected at codegen time.

## Important: `@enumMeta` and schema pipelines

`@enumMeta` directives are read from the schema AST. If your pipeline uses `printSchema()` anywhere (which strips custom directives from enum values), the metadata will be silently lost.

If you use `@graphql-codegen/schema-ast` to emit a `.graphql` file that other packages consume, enable `includeDirectives: true`:

```yaml
generates:
  ./schema.graphql:
    plugins:
      - schema-ast
    config:
      includeDirectives: true
```

Without this, `@enumMeta` directives are dropped from the output file.

## Local development

When developing the plugin locally, reference the built output directly:

```typescript
generates: {
  './src/generated/graphql-smart-enums.ts': {
    plugins: ['./path/to/dist/index.js'],
  },
}
```

## Related packages

| Package                                                                              | Purpose                                      |
| ------------------------------------------------------------------------------------ | -------------------------------------------- |
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum)           | Core smart-enum library (runtime dependency) |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex) | Knex query-level enum revival                |

## License

MIT
