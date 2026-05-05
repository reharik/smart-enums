# @reharik/graphql-codegen-smart-enum-preset

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) preset that orchestrates end-to-end smart-enum integration. It eliminates the per-enum configuration burden by walking your schema and auto-deriving the `enumValues` map for `typescript-resolvers`, `typescript-operations`, and friends — so adding a new GraphQL enum to your schema requires zero changes to your codegen config.

## What it solves

Without the preset, integrating [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) end-to-end across a GraphQL stack means maintaining manual `enumValues` mappings in every codegen target:

```yaml
# Server codegen
config:
  enumValues:
    PaymentStatus: '@packages/contracts#PaymentStatus'
    SortDirection: '@packages/contracts#SortDirection'
    OrderType: '@packages/contracts#OrderType'
    # ... every enum, every codegen target

# Client codegen
config:
  enumValues:
    PaymentStatus: '@packages/contracts#PaymentStatus'
    SortDirection: '@packages/contracts#SortDirection'
    # ... same list, repeated
```

Adding an enum to the schema means three places to update. Forget one and the generated types fall back to plain TypeScript enums silently. With the preset, you write `enumImportPath` once per codegen target and the rest is derived from the schema:

```yaml
# Server codegen
preset: '@reharik/graphql-codegen-smart-enum-preset'
presetConfig:
  mode: with-enum-values
  enumImportPath: '@packages/contracts'
plugins:
  - typescript
  - typescript-resolvers
config:
  # ... your existing config, no enumValues needed

# Client codegen
preset: '@reharik/graphql-codegen-smart-enum-preset'
presetConfig:
  mode: with-enum-values
  enumImportPath: '@packages/contracts'
plugins:
  - typescript
  - typescript-operations
config:
  # ... your existing config, no enumValues needed
```

The preset also provides a uniform interface for the other smart-enum codegen tasks (generating definitions, generating Apollo type policies), so consumers configure everything with the same `preset:` syntax.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-preset @graphql-codegen/cli graphql
```

The preset doesn't bundle the underlying plugins — install whichever you use:

```bash
# If you use 'enums' mode:
npm install -D @reharik/graphql-codegen-smart-enum

# If you use 'type-policies' mode:
npm install -D @reharik/graphql-codegen-smart-enum-type-policies

# If you use 'with-enum-values' mode, install whichever typescript plugins you need:
npm install -D @graphql-codegen/typescript @graphql-codegen/typescript-resolvers
# or
npm install -D @graphql-codegen/typescript @graphql-codegen/typescript-operations
```

## Modes

The preset has three modes. Each codegen target picks one. A typical end-to-end setup uses all three across multiple targets.

### Mode: `enums`

Generates the smart-enum definitions and the `enumRegistry` barrel from your schema. Runs the `@reharik/graphql-codegen-smart-enum` plugin under the hood. Use this for the codegen target that owns your enum definitions (typically a contracts package).

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

Config options for `enums` mode:

| Option                      | Type                   | Default                               | Description                                                                                                          |
| --------------------------- | ---------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `emitDescriptionsAsDisplay` | `boolean`              | `true`                                | Whether to use GraphQL enum descriptions as the `display` field.                                                     |
| `serializeAs`               | `'value' \| 'wrapped'` | unset (falls back to library default) | How generated enums serialize via `JSON.stringify`. Set to `'value'` for GraphQL pipelines.                          |
| `enumClassSuffix`           | `string`               | `''`                                  | Suffix appended to generated enum names (e.g. `'Enum'` → `PaymentStatusEnum`).                                       |
| `skipEnums`                 | `string[]`             | —                                     | GraphQL enum type names to exclude. Use this for hand-authored enums that you re-export from your contracts package. |

### Mode: `type-policies`

Generates Apollo Client `typePolicies` for client-side enum rehydration. Runs the `@reharik/graphql-codegen-smart-enum-type-policies` plugin under the hood. Use this in your client codegen.

```yaml
generates:
  ./src/graphql/generated/graphql-smart-enum-type-policies.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: type-policies
      enumImportPath: '@packages/contracts'
```

Config options for `type-policies` mode:

| Option            | Type       | Default      | Description                                                                                   |
| ----------------- | ---------- | ------------ | --------------------------------------------------------------------------------------------- |
| `enumImportPath`  | `string`   | **required** | Import path for your smart-enum definitions. Becomes the `from` clause in the generated file. |
| `enumClassSuffix` | `string`   | `''`         | Must match the suffix used by your `enums` mode codegen.                                      |
| `skipEnums`       | `string[]` | —            | Skip these enum types when generating type policies.                                          |

### Mode: `with-enum-values`

Adds the auto-derived `enumValues` map to a consumer-supplied plugin list. The preset does not pick the plugins — you list whatever you use (`typescript`, `typescript-operations`, `typescript-resolvers`, `typed-document-node`, etc.). The preset just contributes the `enumValues` map to the config.

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

Config options for `with-enum-values` mode:

| Option            | Type       | Default      | Description                                                                               |
| ----------------- | ---------- | ------------ | ----------------------------------------------------------------------------------------- |
| `enumImportPath`  | `string`   | **required** | Where smart-enum definitions live. Used as the `from` half of every `enumValues` mapping. |
| `enumClassSuffix` | `string`   | `''`         | Suffix to append. Must match the `enumClassSuffix` used in your `enums` mode codegen.     |
| `skipEnums`       | `string[]` | —            | Skip these enum types when building the `enumValues` map.                                 |

The consumer's `config.enumValues` is preserved if provided — entries set explicitly there override the auto-derived ones, so you can tweak individual mappings without losing the auto-derivation for the rest.

## A complete end-to-end setup

A typical smart-enum-aware GraphQL stack has three codegen configs: contracts, server, and client. Here's what each looks like with the preset.

### Contracts codegen (generates the smart-enum definitions)

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

### Server codegen (generates resolver types)

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

### Client codegen (generates operations + type policies)

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

After this setup, adding a new enum to your schema is a one-step process: write the GraphQL enum, run codegen. The contracts package gets a new smart-enum definition, the server resolver types reference it, the client operation types reference it, and the Apollo cache rehydrates it. Zero per-enum configuration anywhere.

## Hand-authored enums

The `skipEnums` option lets you exclude enums from definition generation when you want to hand-author them (for example, to add custom methods or props the codegen plugin doesn't support). The hand-authored versions need to be re-exported from your `enumImportPath` so the auto-derived `enumValues` mappings can find them.

```typescript
// src/enums/viewerOperations.ts (hand-authored)
export const ViewerOperation = enumeration('ViewerOperation', {
  input: { ... } as const,
});

// src/index.ts (your contracts barrel)
export * from './enums/graphqlSmartEnums';  // codegen output
export * from './enums/viewerOperations';   // hand-authored
```

Add the hand-authored enum names to `skipEnums` in your `enums` mode codegen, but **do not** add them to `skipEnums` in `with-enum-values` or `type-policies` modes — those modes still need to map and rehydrate them, just from your hand-authored exports instead of the codegen output.

## Validation

The preset validates `skipEnums` against your schema at codegen time. If you list a name that doesn't correspond to any enum type in the schema, codegen fails with a message naming the typo and listing the valid options:

```
[graphql-codegen-smart-enum-preset] presetConfig.skipEnums contains names that don't correspond to enum types in the schema: 'ViwerOperation'. Available enum types: 'AlbumMemberRole', 'PaymentStatus', 'ViewerOperation'.
```

## Related packages

| Package                                                                                                                                | Purpose                                                                  |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum)                                                             | Core smart-enum library                                                  |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum)                             | Generates smart-enum definitions (used internally by `enums` mode)       |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Generates Apollo type policies (used internally by `type-policies` mode) |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex)                                                   | Knex query-level enum revival                                            |

## License

MIT
