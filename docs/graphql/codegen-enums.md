# Enum definitions (codegen)

**Package:** [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum)

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that turns your schema's `enum` types into [`@reharik/smart-enum`](/core/creating-enums) definitions. You define enums in SDL; codegen produces type-safe smart-enum objects with lookup methods, display strings, and full inference — no hand-authored enum files to keep in sync with the schema.

## What it generates

Given this schema:

```graphql
"""
Payment processing status
"""
enum PaymentStatus {
  """Waiting for payment"""
  PENDING
  """Payment completed successfully"""
  PAID
  """Payment was canceled"""
  CANCELED @deprecated(reason: "Use VOIDED")
  """Payment was voided"""
  VOIDED
}

enum SortDirection {
  ASC
  DESC
}
```

the plugin emits:

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

Enum values with descriptions get object input with `display` metadata. Plain enums without descriptions or deprecations get the compact array form. Deprecated values always force object input so the `deprecated` flag survives.

All member keys are camelCased from the GraphQL value name (`IN_REVIEW` → `inReview`). If camelCasing causes a collision within an enum, codegen fails with a clear error.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum @graphql-codegen/cli graphql
```

`@reharik/smart-enum` is a runtime dependency (generated files import it). The plugin and CLI are dev-only.

## Configuration

```typescript
// codegen.ts
import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './schema.graphql',
  generates: {
    // Standard TypeScript types (optional)
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

### Options

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `emitDescriptionsAsDisplay` | `boolean` | `true` | Use GraphQL enum value descriptions as the `display` field. When `false`, only enums with deprecated values or `@enumMeta` directives get object input. |
| `enumClassSuffix` | `string` | `''` | Suffix appended to generated enum names (e.g. `'Enum'` → `PaymentStatusEnum`). |
| `skipEnums` | `string[]` | — | GraphQL enum type names to exclude from output. |
| `externalEnums` | `Record<string, string>` | — | Map of GraphQL enum type names to import paths for hand-authored enums. Each named enum must also appear in `skipEnums`. See [Hand-authored enums](#hand-authored-enums). |

## Hand-authored enums

Sometimes you want to hand-author an enum — to add custom methods, derive props at runtime, or wrap a third-party value object. List those names in `skipEnums` so the plugin doesn't generate them. But the generated `enumRegistry` barrel **still needs to include them**, otherwise the server-side [`patchSchemaEnumSerializers`](/graphql/overview#server-side-resolvers-returning-members) can't find them when GraphQL calls `parseValue` on a request argument — and the resolver receives a raw string instead of a member.

`externalEnums` bridges the gap:

```yaml
config:
  skipEnums:
    - ReactionEmoji
    - ViewerOperation
  externalEnums:
    ReactionEmoji: '../hand-authored/reactions'
    ViewerOperation: '../hand-authored/viewerOperations'
```

The plugin emits imports for each hand-authored enum and includes them in the registry:

```typescript
import { ReactionEmoji } from '../hand-authored/reactions';
import { ViewerOperation } from '../hand-authored/viewerOperations';

// ... generated enums ...

export const enumRegistry = {
  // ... generated enums ...
  ReactionEmoji,
  ViewerOperation,
} as const;
```

The registry key is always the GraphQL type name. The plugin does **not** re-export hand-authored enums as named exports — consumers keep importing them from their original location.

## Local development

When developing the plugin itself, reference the built output directly:

```typescript
generates: {
  './src/generated/graphql-smart-enums.ts': {
    plugins: ['./path/to/dist/index.js'],
  },
}
```

## Next

- Richer metadata than descriptions? → [`@enumMeta` metadata](/graphql/enum-meta)
- Tired of writing one config block per enum target? → [The preset](/graphql/preset)
- Rehydrating the Apollo cache? → [Apollo type policies](/graphql/type-policies)
