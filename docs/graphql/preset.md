# The preset

**Package:** [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset)

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) preset that orchestrates end-to-end smart-enum integration. It walks your schema and auto-derives the `enumValues` map for `typescript-resolvers`, `typescript-operations`, and friends — so adding a new GraphQL enum requires zero changes to your codegen config.

## What it solves

Without the preset, integrating smart enums end-to-end means maintaining manual `enumValues` mappings in every codegen target:

```yaml
# Server codegen
config:
  enumValues:
    PaymentStatus: '@packages/contracts#PaymentStatus'
    SortDirection: '@packages/contracts#SortDirection'
    OrderType: '@packages/contracts#OrderType'
    # ... every enum, every target

# Client codegen
config:
  enumValues:
    PaymentStatus: '@packages/contracts#PaymentStatus'
    SortDirection: '@packages/contracts#SortDirection'
    # ... the same list, repeated
```

Adding an enum means three places to update. Forget one and the generated types silently fall back to plain TypeScript enums. With the preset you write `enumImportPath` once per target and the rest is derived from the schema:

```yaml
preset: '@reharik/graphql-codegen-smart-enum-preset'
presetConfig:
  mode: with-enum-values
  enumImportPath: '@packages/contracts'
plugins:
  - typescript
  - typescript-resolvers
config:
  # ... your existing config, no enumValues needed
```

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-preset @graphql-codegen/cli graphql
```

The preset doesn't bundle the underlying plugins — install whichever you use:

```bash
# 'enums' mode:
npm install -D @reharik/graphql-codegen-smart-enum

# 'type-policies' mode:
npm install -D @reharik/graphql-codegen-smart-enum-type-policies

# 'with-enum-values' mode — whichever typescript plugins you need:
npm install -D @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
# or
npm install -D @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

## Modes

The preset has four modes; each codegen target picks one. A typical end-to-end setup uses `enums`, `type-policies`, and `with-enum-values` across different targets, adding `external-defines` when some enums are hand-authored.

### Mode: `enums`

Generates the smart-enum definitions and the `enumRegistry` barrel from your schema. Runs the [enum-definition plugin](/graphql/codegen-enums) under the hood. Use it for the target that owns your enum definitions — typically a contracts package.

```yaml
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      emitDescriptionsAsDisplay: true
      serializeAs: value
      skipEnums:
        - ViewerOperation
        - AlbumMemberRole
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `emitDescriptionsAsDisplay` | `boolean` | `true` | Use GraphQL enum descriptions as `display`. |
| `serializeAs` | `'value' \| 'wrapped'` | unset (library default) | How generated enums serialize via `JSON.stringify`. Set to `'value'` for GraphQL pipelines. |
| `enumClassSuffix` | `string` | `''` | Suffix appended to generated enum names. |
| `skipEnums` | `string[]` | — | Enum type names to emit **nothing** for — backend-only enums the frontend never sees. |
| `externalEnums` | `Record<string, string>` | — | Map of type names to import paths for hand-authored enums; forwarded so `enumRegistry` stays complete for `patchSchemaEnumSerializers`. Listing a name here implies it is skipped from generation — it no longer needs to appear in `skipEnums` (though listing it in both still works). |

### Mode: `external-defines`

Emits schema key lists and a typed `define<EnumName>` factory for every `externalEnums` entry, so hand-authored enums can't drift from the SDL: a missing key or a key not in the schema becomes a compile error. Runs the [enum-definition plugin](/graphql/codegen-enums) with `emit: 'externalDefines'` under the hood.

Using it means **two** `generates` targets — the regular `enums` target plus an `external-defines` target — and both need the same `externalEnums` map. Nothing can validate that the two entries agree (codegen builds each `generates` target independently), so hoist the map to a shared constant in a `codegen.ts` config — that constant is the only thing keeping them in sync:

```typescript
import type { CodegenConfig } from '@graphql-codegen/cli';

const externalEnums = {
  PaymentStatus: '../enums/paymentStatus',
  ViewerOperation: '../enums/viewerOperations',
};

const config: CodegenConfig = {
  schema: '../../../apps/api/src/graphql/generated/schema.graphql',
  generates: {
    './src/enums/graphqlSmartEnums.ts': {
      preset: '@reharik/graphql-codegen-smart-enum-preset',
      presetConfig: {
        mode: 'enums',
        externalEnums,
      },
    },
    './src/enums/graphqlSmartEnumDefines.ts': {
      preset: '@reharik/graphql-codegen-smart-enum-preset',
      presetConfig: {
        mode: 'external-defines',
        externalEnums,
      },
    },
  },
};

export default config;
```

Your hand-authored enum then calls the emitted factory instead of `enumeration()` directly:

```typescript
// src/enums/paymentStatus.ts (hand-authored)
import { definePaymentStatus } from './graphqlSmartEnumDefines';

export const PaymentStatus = definePaymentStatus({
  pending: { icon: 'clock' },
  paid: { icon: 'check' },
  voided: { icon: 'ban' },
  // add a schema value and forget to regenerate? compile error.
});
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `externalEnums` | `Record<string, string>` | **required, non-empty** | The hand-authored enums to emit factories for. Must be the same map as the `enums` mode target — share the constant. |
| `serializeAs` | `'value' \| 'wrapped'` | unset (library default) | Baked into the emitted factories. Must match the `enums` mode target. |

::: warning The two targets must be separate files
The `enums` output imports your hand-authored enum (to build `enumRegistry`), and your hand-authored enum imports the defines output. If both outputs land in one file, the imports form a cycle — generated → hand-authored → generated — which is **not** a build error: it crashes at runtime with a TDZ `ReferenceError` on the factory const. The defines output imports only `@reharik/smart-enum`, never user code, which is what keeps the two-file arrangement cycle-free.
:::

**Display strings are derived from the key, not from schema descriptions.** The generated `enums` output uses SDL descriptions as `display` (when `emitDescriptionsAsDisplay` is on, the default); the defines factories deliberately do not. A hand-authored enum owns its own content — the factory guards the *key set*, and `display` stays a precise, type-level literal derived from the key. If an enum relied on descriptions-as-display before you externalized it, pass `display` explicitly in the corresponding entries.

`skipEnums` keeps its standalone meaning here as everywhere: an enum listed **only** in `skipEnums` (not in `externalEnums`) gets nothing emitted at all — the right treatment for backend-only enums.

### Mode: `type-policies`

Generates Apollo [`typePolicies`](/graphql/type-policies) for client-side rehydration.

```yaml
generates:
  ./src/graphql/generated/graphql-smart-enum-type-policies.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: type-policies
      enumImportPath: '@packages/contracts'
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enumImportPath` | `string` | **required** | Import path for your smart-enum definitions. |
| `enumClassSuffix` | `string` | `''` | Must match the suffix used in `enums` mode. |
| `skipEnums` | `string[]` | — | Skip these enum types. |

### Mode: `with-enum-values`

Adds the auto-derived `enumValues` map to a consumer-supplied plugin list. The preset does **not** pick the plugins — you list whatever you use (`typescript`, `typescript-operations`, `typescript-resolvers`, `typed-document-node`, …). The preset only contributes the `enumValues` map.

```yaml
generates:
  ./src/graphql/generated/types.generated.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: with-enum-values
      enumImportPath: '@packages/contracts'
    plugins:
      - typescript
      - typescript-resolvers
    config:
      # Your existing config, untouched. The preset adds enumValues automatically.
      contextType: ../context/types#GraphQLContext
      maybeValue: 'T | undefined'
      mappers:
        Viewer: ../resolvers/parentModels#ViewerParent
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `enumImportPath` | `string` | **required** | Where smart-enum definitions live; the `from` half of every `enumValues` mapping. |
| `enumClassSuffix` | `string` | `''` | Must match the `enums` mode suffix. |
| `skipEnums` | `string[]` | — | Skip these enum types when building the map. |

Any `config.enumValues` you set explicitly is preserved and overrides the auto-derived entries — so you can tweak individual mappings without losing auto-derivation for the rest.

## A complete end-to-end setup

A typical smart-enum-aware stack has three codegen configs: contracts, server, and client.

### Contracts — generates the definitions

```yaml
schema: ../../../apps/api/src/graphql/generated/schema.graphql
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      emitDescriptionsAsDisplay: true
      skipEnums:
        - ViewerOperation
        - AlbumMemberRole
```

### Server — generates resolver types

```yaml
schema: ./src/graphql/schema/**/*.graphql
generates:
  ./src/graphql/generated/schema.graphql:
    plugins:
      - schema-ast
    config:
      includeDirectives: true

  ./src/graphql/generated/types.generated.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: with-enum-values
      enumImportPath: '@packages/contracts'
    plugins:
      - typescript
      - typescript-resolvers
    config:
      scalars:
        DateTime: Date
      contextType: ../context/types#GraphQLContext
      maybeValue: 'T | undefined'
      mappers:
        Album: '@packages/media-core#AlbumProjection'
```

### Client — generates operations + type policies

```yaml
schema: ../api/src/graphql/generated/schema.graphql
documents:
  - 'src/graphql/**/*.graphql'
generates:
  src/graphql/generated/types.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: with-enum-values
      enumImportPath: '@packages/contracts'
    plugins:
      - typescript
      - typescript-operations
      - typed-document-node
    config:
      enumsAsTypes: true
      maybeValue: 'T | undefined'
      scalars:
        DateTime:
          input: string
          output: string

  ./src/graphql/generated/graphql-smart-enum-type-policies.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: type-policies
      enumImportPath: '@packages/contracts'
```

After this, adding an enum is one step: write the GraphQL enum, run codegen. The contracts package gets a definition, server and client types reference it, and the Apollo cache rehydrates it. Zero per-enum configuration anywhere.

## Hand-authored enums

When you want to hand-author an enum — custom methods, runtime-derived props, wrapping a third-party value object — list it in `externalEnums` in your **`enums`** mode target. That excludes it from generation (no separate `skipEnums` entry needed) while keeping it in the generated `enumRegistry`, so server-side [`patchSchemaEnumSerializers`](/graphql/overview#server-side-resolvers-returning-members) still finds it. Then add an [`external-defines` target](#mode-external-defines) so the hand-authored version can't drift from the schema:

```typescript
// src/enums/viewerOperations.ts (hand-authored)
import { defineViewerOperation } from './graphqlSmartEnumDefines';

export const ViewerOperation = defineViewerOperation({
  view: { /* per-member extras */ },
  edit: { /* ... */ },
});

// src/index.ts (your contracts barrel)
export * from './enums/graphqlSmartEnums';  // codegen output
export * from './enums/viewerOperations';   // hand-authored
```

The hand-authored version must be re-exported from your `enumImportPath` so the auto-derived `enumValues` mappings find it. Don't skip it in `with-enum-values` or `type-policies` modes — those still need to map and rehydrate it, just from your hand-authored export instead of the codegen output.

`skipEnums` means something stronger: emit **nothing** for the enum, in whichever mode it appears. Use it for backend-only enums that shouldn't exist in the generated output at all. (For backward compatibility, a name listed in both `externalEnums` and `skipEnums` behaves as external.)

## Validation

The preset validates `skipEnums` against your schema at codegen time. List a name that isn't an enum type and codegen fails, naming the typo and listing valid options:

```
[graphql-codegen-smart-enum-preset] presetConfig.skipEnums contains names that
don't correspond to enum types in the schema: 'ViwerOperation'. Available enum
types: 'AlbumMemberRole', 'PaymentStatus', 'ViewerOperation'.
```
