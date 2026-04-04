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
directive @enumMeta(
  display: String
  shortDisplay: String
  description: String
  sortOrder: Int
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
