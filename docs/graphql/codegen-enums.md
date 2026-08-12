# Enum definitions (codegen)

**Package:** [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum)

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) plugin that turns your schema's `enum` types into [`@reharik/smart-enum`](/core/creating-enums) definitions. You define enums in SDL; codegen produces type-safe smart-enum objects with lookup methods, display strings, and full inference — no hand-authored enum files to keep in sync with the schema.

## Why you want this

If your enums live in a GraphQL schema, hand-writing matching smart-enum definitions is busywork that rots: every new schema value is a second edit somewhere else, and the day someone forgets, your types and your schema disagree and nobody notices until runtime. This plugin makes the schema the single source of truth. Run codegen and the definitions — keys, wire values, display strings from descriptions, deprecation flags — are derived from the SDL you already maintain. Add a value to the schema, regenerate, done. The enums can't drift from the schema because they're produced from it.

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
| `skipEnums` | `string[]` | — | GraphQL enum type names to exclude entirely: no generated enum, no registry entry, no factory. Use for backend-only enums. |
| `externalEnums` | `Record<string, string>` | — | Map of GraphQL enum type names to import paths (relative to the output file) for hand-authored enums. Listing a name here implies it is skipped from generation, adds a `define<Name>Input` definer to the enums output, and moves `enumRegistry` to the `enumRegistry` emit. See [Hand-authored enums](#hand-authored-enums). |
| `emit` | `'enums' \| 'enumRegistry'` | `'enums'` | Which output to produce. `'enums'` is the generated enums (plus definers when `externalEnums` is set); `'enumRegistry'` is the registry barrel in its own file. See [The registry file](#the-registry-file). |
| `enumsImportPath` | `string` | — | Required for `emit: 'enumRegistry'`: import path of the enums output relative to the registry file (e.g. `'./graphqlSmartEnums'`). |

## Hand-authored enums

Sometimes you want to hand-author an enum — to add custom methods, derive props at runtime, or wrap a third-party value object. But the generated `enumRegistry` barrel **still needs to include them**, otherwise the server-side [`patchSchemaEnumSerializers`](/graphql/overview#server-side-resolvers-returning-members) can't find them when GraphQL calls `parseValue` on a request argument — and the resolver receives a raw string instead of a member.

`externalEnums` bridges the gap. Listing a name there does three things:

```yaml
config:
  externalEnums:
    ReactionEmoji: '../hand-authored/reactions'
    ViewerOperation: '../hand-authored/viewerOperations'
```

1. **Skips it from generation** — you own the definition.
2. **Emits a `define<Name>Input` definer** into the enums output, so your hand-authored version [can't drift from the schema](#keeping-them-in-sync).
3. **Moves `enumRegistry` out of the enums output** — it now comes from a second `generates` entry with [`emit: 'enumRegistry'`](#the-registry-file) (the [preset](/graphql/preset) emits that file automatically).

The third one is a hard requirement, not a preference. The registry must import your hand-authored enums, and your codebase freely imports generated enums from the enums file — including from modules that end up in a hand-authored enum's import closure (an error-catalog module using a generated `ErrorCategory`, say). If the registry lived in the enums file, those two edges would form an import cycle that crashes at **runtime** with a TDZ `ReferenceError` — and *where* it crashes depends on module load order, so it can work from one entrypoint and fail from another. With `externalEnums` set, the enums output therefore imports no user code at all, ever.

The registry key is always the GraphQL type name. The registry does **not** re-export hand-authored enums as named exports — consumers keep importing them from their original location.

::: tip `externalEnums` implies skip
You don't need to repeat these names in `skipEnums`. Earlier versions required it; that requirement is gone, and listing them in both still works.

`skipEnums` alone means something different: **emit nothing at all** — no generated enum, no registry entry, no factory. That's for enums the client never sees.
:::

### Keeping them in sync

A hand-authored enum has no link back to the schema. Add a value to the SDL and your enum silently doesn't have it; remove one and a stale member lingers. Nothing fails until it does, at runtime, somewhere else.

The definers close that gap, and with `externalEnums` set they're emitted automatically — no extra config. Using the [preset](/graphql/preset), the whole layout is **one** `generates` entry; the registry file is emitted as a sibling automatically:

```yaml
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      serializeAs: value
      externalEnums:
        EntityType: './entityType'
# → emits ./src/enums/graphqlSmartEnums.ts          (enums + definers)
#   and   ./src/enums/graphqlSmartEnumsRegistry.ts  (enumRegistry)
```

Using the plugin directly (no preset), a plugin can only emit one file, so the registry is an explicit second entry:

```typescript
generates: {
  './src/generated/graphql-smart-enums.ts': {
    plugins: ['@reharik/graphql-codegen-smart-enum'],
    config: {
      serializeAs: 'value',
      externalEnums: { EntityType: '../hand-authored/entityType' },
    },
  },
  './src/generated/graphql-smart-enums-registry.ts': {
    plugins: ['@reharik/graphql-codegen-smart-enum'],
    config: {
      emit: 'enumRegistry',
      enumsImportPath: './graphql-smart-enums',
      externalEnums: { EntityType: '../hand-authored/entityType' },
    },
  },
}
```

::: warning Keep `serializeAs` aligned
The definer doesn't build the enum, so it can't apply serialization for you — you pass `serializeAs` in your own `enumeration()` call. Configure it on the codegen entry too and each definer's emitted usage example shows the exact call to copy; omit it in your enum and it silently serializes differently than the generated ones.
:::

### Using an input definer

For each `externalEnums` entry the enums output contains the schema's key list and a typed `define<Name>Input` function. It doesn't build the enum — it takes your input object, pins it to the schema's key set, and returns it unchanged. You then declare the enum from it exactly like every other smart enum:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { defineEntityTypeInput } from '../generated/graphql-smart-enums';

const input = defineEntityTypeInput({
  album:   { table: 'albums',   soft: true },
  comment: { table: 'comments', soft: true },
  // ...one entry per schema value
});

export type EntityType = Enumeration<typeof EntityType>;
export const EntityType = enumeration<typeof input>('EntityType', {
  input,
  serializeAs: 'value',
});
```

The string you pass to `enumeration()` must be the GraphQL type name — registry patching matches on it. Each definer's JSDoc includes a copy-paste example with the right name (and your configured `serializeAs`) already filled in.

Extras keep their literal types without `as const`, so `EntityType.album.table` is typed `'albums'`, not `string`.

::: details Why doesn't the definer just return the enum?
An earlier design had `defineEntityType(input)` return `enumeration(...)` directly. That shape breaks TypeScript **declaration emit**: the function's inferred return type is built from smart-enum's internal conditional types applied to an unresolved generic, and a consuming package compiled with `declaration: true` (or `composite`) forces `tsc` to structurally expand them — including character-by-character template-literal recursion — which can exhaust the heap and crash the build. Returning the plain input type makes the definer's declaration trivial, and your `enumeration<typeof input>(...)` call works on concrete types, which resolve cheaply like any hand-written enum.
:::

::: details Why one definer per enum instead of a single generic?
A shared `defineEnumInput(keys, input)` would work — pass the key list as an argument and both type parameters infer. But the definer is an identity function; the *only* per-enum things about it are exactly the things worth having per enum: the pinned key set (so you can't accidentally pair an input with the wrong enum's keys — with a shared generic, two enums with identical key sets would pin interchangeably without an error), and the JSDoc example carrying the correct GraphQL type name and `serializeAs` for that enum. Since the file is generated, the repetition costs nothing to maintain.
:::

Now the two can't drift:

- SDL gains a value → missing key, compile error
- SDL loses a value → unknown key, compile error

Both point at your enum file, naming the key.

The definers themselves change no behaviour until an enum calls one — switch enums onto them as you get to each. The one-time change is the registry: the **first** `externalEnums` entry moves `enumRegistry` into its own file, so the bootstrap imports (see [The registry file](#the-registry-file)) update once, then never again.

### The registry file

With `externalEnums` set, `enumRegistry` comes from the `emit: 'enumRegistry'` output (the preset emits it automatically as `<name>Registry.ts` next to the enums file):

```typescript
// graphqlSmartEnumsRegistry.ts (generated)
import { ErrorCategory, SortDirection } from './graphqlSmartEnums';
import { EntityType } from '../hand-authored/entityType';

export const enumRegistry = { EntityType, ErrorCategory, SortDirection } as const;
```

This is the only generated file that imports user code, and it must stay a **pure sink**: the only things importing it should be bootstrap code — `patchSchemaEnumSerializers` on the server, the Apollo type-policies setup on the client (directly, or via one `export * from './enums/graphqlSmartEnumsRegistry'` line in your contracts barrel).

::: warning Never import the registry from code an enum can reach
Files inside your contracts package should import each other **relatively**, never through the package's own barrel. If a module in a hand-authored enum's import closure imports the barrel (and the barrel re-exports the registry), the cycle this layout exists to prevent comes right back — as a load-order-dependent TDZ `ReferenceError` at runtime.
:::

### Values and display strings

Wire values are derived from the key (`mediaItem` → `MEDIA_ITEM`), matching what codegen would have emitted. Pass `value` in an entry to override:

```typescript
const input = defineEntityTypeInput({
  album:   { value: 'ALBUM_V2' },
  comment: {},
});
```

::: warning Descriptions are not applied to hand-authored enums
`emitDescriptionsAsDisplay` affects generated enums only. A hand-authored enum's `display` is always derived from its key, even with the flag on.

This is deliberate: a hand-authored enum owns its content, the definer only pins the key set, and `display` stays a type-level literal so hover types never disagree with runtime values.

It matters when you externalize an enum that was previously *generated* — its display strings change from SDL descriptions to key-derived. Pass `display` explicitly in those entries to keep them identical. Enums that were hand-authored all along are unaffected.
:::

### What you still get

Enums built from pinned inputs are ordinary smart enums. `fromValue`, [`match` and `switchOn`](/core/branching), [subsets](/core/lookup), serialization, `enumRegistry` — all unchanged.

And the layout guarantee: with `externalEnums` set, the enums output never imports user code, the registry output is the only file that does, and it's a sink — so the module graph is acyclic by construction, and the definers' plain-input return type keeps declaration emit in consuming packages cheap.

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
