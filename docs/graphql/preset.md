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

The preset has three modes; each codegen target picks one. A typical end-to-end setup uses all three across different targets. Hand-authored enums don't need a mode of their own — `externalEnums` inside `enums` mode handles them, including the extra registry file that layout requires.

### Mode: `enums`

Generates the smart-enum definitions from your schema. Runs the [enum-definition plugin](/graphql/codegen-enums) under the hood. Use it for the target that owns your enum definitions — typically a contracts package.

```yaml
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      emitDescriptionsAsDisplay: true
      serializeAs: value
      skipEnums:
        - AlbumMemberRole
```

| Option | Type | Default | Description |
| --- | --- | --- | --- |
| `emitDescriptionsAsDisplay` | `boolean` | `true` | Use GraphQL enum descriptions as `display`. |
| `serializeAs` | `'value' \| 'wrapped'` | unset (library default) | How generated enums serialize via `JSON.stringify`. Set to `'value'` for GraphQL pipelines. Also shown in each emitted definer's usage example. |
| `enumClassSuffix` | `string` | `''` | Suffix appended to generated enum names. |
| `skipEnums` | `string[]` | — | Enum type names to emit **nothing** for — backend-only enums the frontend never sees. |
| `externalEnums` | `Record<string, string>` | — | Map of type names to import paths (relative to the output file) for hand-authored enums. Implies skip; emits a `define<Name>Input` definer per entry; switches on the two-file layout below. |

Without `externalEnums`, this emits a single file that also contains `enumRegistry`. With it, the layout changes — read on.

#### Hand-authored enums: the auto-emitted registry file

List hand-authored enums in `externalEnums` and the preset emits **two files from the one `generates` entry**:

```yaml
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      serializeAs: value
      externalEnums:
        PaymentStatus: './paymentStatus'
        ViewerOperation: './viewerOperations'
# → emits ./src/enums/graphqlSmartEnums.ts          (enums + definers, imports no user code)
#   and   ./src/enums/graphqlSmartEnumsRegistry.ts  (enumRegistry, imports your enums)
```

The split is not cosmetic. The registry must import your hand-authored enums, while your code freely imports generated enums from `graphqlSmartEnums.ts` — including from modules inside a hand-authored enum's import closure. If the registry lived in (or were re-exported from) the enums file, those edges would form an import cycle that crashes at **runtime** with a TDZ `ReferenceError`, on a const that depends on module load order — working from one entrypoint, crashing from another. The preset makes that configuration impossible to express: the enums file never imports user code; the registry file is the only one that does, and nothing should import it except bootstrap code (`patchSchemaEnumSerializers`, the Apollo type-policies setup — directly or via one re-export line in your contracts barrel).

::: warning Never import the registry from code an enum can reach
Files inside your contracts package should import each other relatively, never through the package's own barrel — a barrel that re-exports the registry would re-enter the cycle.
:::

Your hand-authored enum pins its input through the emitted definer, then declares the enum like any other:

```typescript
// src/enums/paymentStatus.ts (hand-authored)
import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { definePaymentStatusInput } from './graphqlSmartEnums';

const input = definePaymentStatusInput({
  pending: { icon: 'clock' },
  paid: { icon: 'check' },
  voided: { icon: 'ban' },
  // add a schema value and forget to regenerate? compile error.
});

export type PaymentStatus = Enumeration<typeof PaymentStatus>;
export const PaymentStatus = enumeration<typeof input>('PaymentStatus', {
  input,
  serializeAs: 'value',
});
```

Each definer's JSDoc carries a copy-paste example with the right GraphQL type name (and your configured `serializeAs`) already filled in. The definer returns the plain input type on purpose — an earlier shape that returned the built enum forced consuming packages with `declaration: true` to expand smart-enum's internal conditional types over an unresolved generic, which can OOM `tsc`; see [why the definer doesn't return the enum](/graphql/codegen-enums#using-an-input-definer).

**Display strings are derived from the key, not from schema descriptions.** The generated enums use SDL descriptions as `display` (when `emitDescriptionsAsDisplay` is on, the default); the definers deliberately do not forward them. A hand-authored enum owns its own content — the definer guards the *key set*, and `display` stays a precise, type-level literal derived from the key. If an enum relied on descriptions-as-display before you externalized it, pass `display` explicitly in the corresponding entries.

`skipEnums` keeps its standalone meaning: an enum listed **only** in `skipEnums` (not in `externalEnums`) gets nothing emitted at all — the right treatment for backend-only enums.

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

When you want to hand-author an enum — custom methods, runtime-derived props, wrapping a third-party value object — list it in `externalEnums` in your **`enums`** mode target. That excludes it from generation (no separate `skipEnums` entry needed), emits a [`define<Name>Input` definer](#hand-authored-enums-the-auto-emitted-registry-file) so the hand-authored version can't drift from the schema, and keeps it in the auto-emitted registry file so server-side [`patchSchemaEnumSerializers`](/graphql/overview#server-side-resolvers-returning-members) still finds it:

```typescript
// src/enums/viewerOperations.ts (hand-authored)
import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { defineViewerOperationInput } from './graphqlSmartEnums';

const input = defineViewerOperationInput({
  view: { /* per-member extras */ },
  edit: { /* ... */ },
});

export type ViewerOperation = Enumeration<typeof ViewerOperation>;
export const ViewerOperation = enumeration<typeof input>('ViewerOperation', {
  input,
});

// src/index.ts (your contracts barrel)
export * from './enums/graphqlSmartEnums';          // codegen output
export * from './enums/graphqlSmartEnumsRegistry';  // enumRegistry (bootstrap-only)
export * from './enums/viewerOperations';           // hand-authored
```

The hand-authored version must be re-exported from your `enumImportPath` so the auto-derived `enumValues` mappings find it. Don't skip it in `with-enum-values` or `type-policies` modes — those still need to map and rehydrate it, just from your hand-authored export instead of the codegen output. And remember the barrel rule from above: in-package files import each other relatively, never via the barrel, or the registry line re-enters the cycle.

`skipEnums` means something stronger: emit **nothing** for the enum, in whichever mode it appears. Use it for backend-only enums that shouldn't exist in the generated output at all. (For backward compatibility, a name listed in both `externalEnums` and `skipEnums` behaves as external.)

## Validation

The preset validates `skipEnums` against your schema at codegen time. List a name that isn't an enum type and codegen fails, naming the typo and listing valid options:

```
[graphql-codegen-smart-enum-preset] presetConfig.skipEnums contains names that
don't correspond to enum types in the schema: 'ViwerOperation'. Available enum
types: 'AlbumMemberRole', 'PaymentStatus', 'ViewerOperation'.
```
