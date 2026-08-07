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
| `externalEnums` | `Record<string, string>` | — | Map of GraphQL enum type names to import paths for hand-authored enums. Listing a name here implies it is skipped from generation. See [Hand-authored enums](#hand-authored-enums). |
| `emit` | `'enums' \| 'externalDefines'` | `'enums'` | Which output to produce. `'enums'` is the full generated output; `'externalDefines'` emits key lists and `define<Name>Input` definers. See [Keeping them in sync](#keeping-them-in-sync). |

## Hand-authored enums

Sometimes you want to hand-author an enum — to add custom methods, derive props at runtime, or wrap a third-party value object. But the generated `enumRegistry` barrel **still needs to include them**, otherwise the server-side [`patchSchemaEnumSerializers`](/graphql/overview#server-side-resolvers-returning-members) can't find them when GraphQL calls `parseValue` on a request argument — and the resolver receives a raw string instead of a member.

`externalEnums` bridges the gap. Listing a name there keeps it out of generation while keeping it in the registry:

```yaml
config:
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

::: tip `externalEnums` implies skip
You don't need to repeat these names in `skipEnums`. Earlier versions required it; that requirement is gone, and listing them in both still works.

`skipEnums` alone means something different: **emit nothing at all** — no generated enum, no registry entry, no factory. That's for enums the client never sees.
:::

### Keeping them in sync

A hand-authored enum has no link back to the schema. Add a value to the SDL and your enum silently doesn't have it; remove one and a stale member lingers. Nothing fails until it does, at runtime, somewhere else.

Add a **second** `generates` entry with `emit: 'externalDefines'` to close that:

```typescript
generates: {
  './src/generated/graphql-smart-enums.ts': {
    plugins: ['@reharik/graphql-codegen-smart-enum'],
    config: {
      serializeAs: 'value',
      externalEnums: { EntityType: '../hand-authored/entityType' },
    },
  },
  './src/generated/entity-type-defines.ts': {
    plugins: ['@reharik/graphql-codegen-smart-enum'],
    config: {
      emit: 'externalDefines',
      serializeAs: 'value',
      externalEnums: { EntityType: '../hand-authored/entityType' },
    },
  },
}
```

Using the [preset](/graphql/preset), the same thing in YAML — a shared anchor keeps the two entries from disagreeing:

```yaml
generates:
  ./src/enums/graphqlSmartEnums.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: enums
      serializeAs: value
      externalEnums: &externalEnums
        EntityType: './entityType'

  ./src/enums/graphqlSmartEnumDefines.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: external-defines
      serializeAs: value
      externalEnums: *externalEnums
```

::: warning Two things that will bite you
**The outputs must be separate files.** The enums output imports your hand-authored enum (for `enumRegistry`), and your enum imports the defines output. One file means a cycle — and it fails at **runtime** with a TDZ `ReferenceError`, not at build time. Worse, *where* it fails depends on module load order: whichever side of the cycle evaluates first throws on the other's uninitialized const (the definer, or your enum inside `enumRegistry`) — so it can pass in one entrypoint and crash in another. Keeping the defines output in its own file makes the graph acyclic: generated → your enum → defines, no back edge.

**Keep `serializeAs` aligned.** The definer doesn't build the enum, so it can't apply serialization for you — you pass `serializeAs` in your own `enumeration()` call. Configure it on the defines entry too and the emitted usage example shows the exact call to copy; omit it in your enum and it silently serializes differently than the generated ones.
:::

### Using an input definer

For each `externalEnums` entry the defines output contains the schema's key list and a typed `define<Name>Input` function. It doesn't build the enum — it takes your input object, pins it to the schema's key set, and returns it unchanged. You then declare the enum from it exactly like every other smart enum:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

import { defineEntityTypeInput } from '../generated/entity-type-defines';

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

Adding the `generates` entry changes no behaviour on its own — it emits definers nothing uses yet. Switch enums onto them one at a time as you get to each. There's no cutover.

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

The defines output imports nothing at all — not even `@reharik/smart-enum` — which is what makes the no-cycle guarantee hold and keeps declaration emit in consuming packages cheap.

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
