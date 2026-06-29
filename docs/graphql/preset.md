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

The preset has three modes; each codegen target picks one. A typical end-to-end setup uses all three across different targets.

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
| `skipEnums` | `string[]` | — | Enum type names to exclude (hand-authored enums you re-export from contracts). |
| `externalEnums` | `Record<string, string>` | — | Map of type names to import paths for hand-authored enums; forwarded so `enumRegistry` stays complete for `patchSchemaEnumSerializers`. Each key must also appear in `skipEnums`. |

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

`skipEnums` excludes an enum from **definition** generation when you want to hand-author it. The hand-authored version must be re-exported from your `enumImportPath` so the auto-derived `enumValues` mappings find it:

```typescript
// src/enums/viewerOperations.ts (hand-authored)
export const ViewerOperation = enumeration('ViewerOperation', {
  input: { /* ... */ } as const,
});

// src/index.ts (your contracts barrel)
export * from './enums/graphqlSmartEnums';  // codegen output
export * from './enums/viewerOperations';   // hand-authored
```

Add the name to `skipEnums` in your **`enums`** mode codegen, but **not** in `with-enum-values` or `type-policies` modes — those still need to map and rehydrate it, just from your hand-authored export instead of the codegen output.

## Validation

The preset validates `skipEnums` against your schema at codegen time. List a name that isn't an enum type and codegen fails, naming the typo and listing valid options:

```
[graphql-codegen-smart-enum-preset] presetConfig.skipEnums contains names that
don't correspond to enum types in the schema: 'ViwerOperation'. Available enum
types: 'AlbumMemberRole', 'PaymentStatus', 'ViewerOperation'.
```
