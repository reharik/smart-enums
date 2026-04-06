# @reharik/graphql-codegen-smart-enum

GraphQL Code Generator plugin that inspects schema enums and emits SmartEnum definitions.

## Goals

- Generate SmartEnum code for GraphQL enums only.
- Keep implementation thin and independent from TypeScript plugin internals.
- Let `@graphql-codegen/typescript` continue handling standard GraphQL TypeScript types.

## Install

```bash
npm i @reharik/smart-enum
npm i -D @reharik/graphql-codegen-smart-enum @graphql-codegen/cli @graphql-codegen/typescript graphql
```

Generated files import `@reharik/smart-enum` at runtime, so install it as a regular dependency (not only dev).

## Config

```ts
export type SmartEnumPluginConfig = {
  enumClassSuffix?: string;
  emitDescriptionsAsDisplay?: boolean;
};
```

- `enumClassSuffix` (default: empty): optional suffix appended to generated enum symbol names.
- `emitDescriptionsAsDisplay` (default: `true`): when true, enums with descriptions emit object input with `{ display }` metadata.

## Custom fields per enum value (props)

You can attach arbitrary string key/value pairs to each generated SmartEnum item using the `props` argument on `@enumMeta`. Define a small input type and extend your directive:

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

Example:

```graphql
enum RowKind {
  PERSON @enumMeta(
    display: "Person"
    props: [
      { name: "column", value: "person_id" }
      { name: "locale", value: "en-US" }
    ]
  )
  ORG @enumMeta(
    display: "Organization"
    props: [{ name: "column", value: "org_id" }]
  )
}
```

The plugin emits each pair as a property on the item object. Names that are valid JavaScript identifiers use plain keys (for example `column: 'created_at'`). Other names use computed keys (for example `["weird-key"]: 'x'`).

If `@enumMeta` on a value **only** supplies `props` (no `display`, `shortDisplay`, `description`, or `sortOrder` arguments), the plugin does **not** emit a `display` field for that value—even when `emitDescriptionsAsDisplay` is true.

Reserved names (cannot appear in `props[].name`): `key`, `value`, `display`, `shortDisplay`, `description`, `sortOrder`, `deprecated`, `deprecationReason`, `index`, `__smart_enum_brand`, `__smart_enum_type`. Duplicate `name` values within the same enum value are rejected at codegen time.

## Usage (`codegen.ts`)

```ts
import type { CodegenConfig } from "@graphql-codegen/cli";

const config: CodegenConfig = {
  schema: "./schema.graphql",
  generates: {
    "./src/generated/graphql-types.ts": {
      plugins: ["typescript"],
    },
    "./src/generated/graphql-smart-enums.ts": {
      plugins: ["@reharik/graphql-codegen-smart-enum"],
      config: {
        emitDescriptionsAsDisplay: true,
      },
    },
  },
};

export default config;
```

For local development of this plugin before publishing, you can also reference the built plugin file directly:

```ts
{
  generates: {
    "./src/generated/graphql-smart-enums.ts": {
      plugins: ["./dist/index.js"]
    }
  }
}
```

## Usage (`codegen.yml`)

```yml
schema: ./schema.graphql
generates:
  ./src/generated/graphql-types.ts:
    plugins:
      - typescript
  ./src/generated/graphql-smart-enums.ts:
    plugins:
      - "@reharik/graphql-codegen-smart-enum"
    config:
      emitDescriptionsAsDisplay: true
```

## Generated shape

```ts
import { enumeration, type Enumeration } from "@reharik/smart-enum";

const paymentStatusInput = {
  pending: { display: "Waiting for payment" },
  canceled: { display: "Payment was canceled", deprecated: true, deprecationReason: "Use VOIDED" },
} as const;

export type PaymentStatus = Enumeration<typeof PaymentStatus>;
export const PaymentStatus = enumeration<typeof paymentStatusInput>("PaymentStatus", { input: paymentStatusInput });
```

When `emitDescriptionsAsDisplay: false`, generated input is normally an `as const` array of enum names.
When `emitDescriptionsAsDisplay: true`, enums without descriptions still use array input.
If an enum contains deprecated GraphQL values, the plugin forces object input for that enum and includes `deprecated` metadata.
All generated enum entries are camelCased (object keys and array values).
If camelCasing causes collisions within a GraphQL enum, generation fails with a clear error message.

## Enum Metadata From SDL

You can define enum-value metadata directly in your schema using `@enumMeta` on `ENUM_VALUE`:

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

enum ClaimStatus {
  OPEN @enumMeta(display: "Open")
  IN_REVIEW @enumMeta(display: "In Review")
  CLOSED @enumMeta(display: "Closed")
}
```

The plugin reads this schema-authored metadata and emits it into generated SmartEnum input entries.
Fallback behavior per enum value:

- `display`: `@enumMeta(display)` -> enum value description -> derived from enum key (for example `IN_REVIEW` -> `In Review`)
- `description`: `@enumMeta(description)` -> enum value description -> omitted
- `shortDisplay`: `@enumMeta(shortDisplay)` -> omitted
- `sortOrder`: `@enumMeta(sortOrder)` -> omitted
- `props`: optional list of `{ name, value }` strings; see [Custom fields per enum value (props)](#custom-fields-per-enum-value-props) above

## Schema input (what this plugin actually sees)

The plugin runs on the **GraphQL `GraphQLSchema`** that GraphQL Code Generator builds from your `schema` entry. It reads **`@enumMeta` from each enum value’s AST** (`enumValue.astNode.directives`).

For that to work:

1. **`directive @enumMeta` must exist in the schema** (and any input types used by its arguments, e.g. `props`). Using `@enumMeta` in SDL without defining the directive is invalid for a full schema build.
2. **The schema you pass to codegen must still contain `@enumMeta` on enum values after load.** If your pipeline turns the schema into a string with `graphql`’s **`printSchema()`**, note that **`printSchema()` does not print custom directives on enum values**—only the value name and `@deprecated`. In that case the loaded schema will not have `@enumMeta` on enum values, and this plugin will silently behave as if no metadata was authored.

### `@graphql-codegen/schema-ast` (printed schema file)

If you use [`@graphql-codegen/schema-ast`](https://the-guild.dev/graphql/codegen/plugins/schema-ast) to emit a `schema.graphql` file and then point another codegen (or another package) at that file, enable:

```yml
# Example: apps/api/codegen.yml — output that other packages consume
generates:
  ./src/graphql/generated/schema.graphql:
    plugins:
      - schema-ast
    config:
      includeDirectives: true
```

With the default `includeDirectives: false`, the plugin uses **`printSchema()`**, which **drops** `@enumMeta` (and any other non-deprecated directives) on enum values. With **`includeDirectives: true`**, the plugin prints from the schema AST so enum-value directives are preserved in the file.

### Monorepos

A common pattern is `packages/contracts` codegen with `schema: ../../apps/api/src/graphql/generated/schema.graphql`. Changes to SDL under the API only affect this plugin **after** you regenerate that **API** schema file (`graphql-codegen` in the API), then run contracts codegen.

## Troubleshooting

| Symptom | Likely cause | What to do |
|--------|----------------|------------|
| `@enumMeta` / `props` never appear in generated SmartEnum input | Schema passed to codegen was produced with `printSchema()`, or enum-value directives were stripped | Use `includeDirectives: true` for `schema-ast`, or point `schema` at SDL that still includes `@enumMeta` on enum values |
| GraphQL load / validation errors on `@enumMeta` | Directive (or `props` input type) not defined in schema | Add `directive @enumMeta ... on ENUM_VALUE` and the `input` type for `props` as in [Custom fields per enum value (props)](#custom-fields-per-enum-value-props) |
| Works in API SDL but not in contracts package | Stale or wrong `schema` path | Regenerate the API `schema.graphql` (or shared schema artifact), then rerun contracts codegen |
