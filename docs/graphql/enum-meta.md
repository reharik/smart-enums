# `@enumMeta` metadata

GraphQL descriptions can populate the `display` field, but they're a single string. When you want richer per-value metadata — short labels, sort order, arbitrary key-value props — use the `@enumMeta` directive with the [enum-definition plugin](/graphql/codegen-enums).

## Setup

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

## Usage

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

## Field resolution order

Each field resolves with these fallbacks:

| Field | Priority |
| --- | --- |
| `display` | `@enumMeta(display:)` → GraphQL value description → derived from key (`IN_REVIEW` → `In Review`) |
| `description` | `@enumMeta(description:)` → GraphQL value description → omitted |
| `shortDisplay` | `@enumMeta(shortDisplay:)` → omitted |
| `sortOrder` | `@enumMeta(sortOrder:)` → omitted |

## Custom key-value props

Attach arbitrary string properties to members:

```graphql
enum AlbumSortBy {
  CREATED_AT @enumMeta(props: [{ name: "column", value: "created_at" }])
  TITLE @enumMeta(props: [{ name: "column", value: "title" }])
}
```

generates:

```typescript
const albumSortByInput = {
  createdAt: { column: 'created_at' },
  title: { column: 'title' },
} as const;
```

When `@enumMeta` supplies **only** `props` (no `display`, `shortDisplay`, `description`, or `sortOrder`), the plugin does not emit a derived `display` field — even when `emitDescriptionsAsDisplay` is `true`.

Prop names that aren't valid JS identifiers use computed keys (e.g. `["weird-key"]: 'value'`). Duplicate prop names and reserved names (`key`, `value`, `display`, `deprecated`, `index`, …) are rejected at codegen time.

## Caution: schema pipelines strip directives

`@enumMeta` directives are read from the schema **AST**. If your pipeline calls `printSchema()` anywhere — which strips custom directives from enum values — the metadata is silently lost.

If you use `@graphql-codegen/schema-ast` to emit a `.graphql` file other packages consume, enable `includeDirectives: true`:

```yaml
generates:
  ./schema.graphql:
    plugins:
      - schema-ast
    config:
      includeDirectives: true
```

Without this, `@enumMeta` directives are dropped from the output file and downstream codegen never sees them.
