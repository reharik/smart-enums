# Changelog

## 0.7.0

- **BREAKING: `emit: 'externalDefines'` is now `emit: 'enumRegistry'`**, and the split between the two outputs moved. The reasoning: `enumRegistry` is the only generated code that imports user code (the hand-authored enums), so it must live in a file nothing else in the module graph imports — otherwise user code importing generated enums can form a load-order-dependent import cycle.
  - The `'enums'` output, when `externalEnums` is set, now emits the `define<Name>Input` functions inline (schema key list + input pinning, importing no user code) and **stops emitting `enumRegistry`**.
  - The new `'enumRegistry'` output emits only the registry barrel: it imports generated enums via the new **required `enumsImportPath`** config (path of the `'enums'` output relative to the registry file) and hand-authored enums via their `externalEnums` paths. Emit it into its own file that only bootstrap code imports.
- `externalEnums` paths are now documented as relative to the output file; each name must still exist in the schema, and listing a name still implies skipping it from generation.

## 0.3.0 – 0.6.0

See git history.

## 0.2.6

- **`skipEnums` config** — optional `string[]` of GraphQL enum type names to omit from the generated file. Use when certain schema enums should be handled only by the TypeScript plugin (or outside this plugin).

## 0.2.1

- **Props-only `@enumMeta`:** if a value’s directive only passes `props` (no `display` / `shortDisplay` / `description` / `sortOrder`), omit generated `display` for that item.
- Emit valid identifier prop names as plain keys (`column:`) instead of always using bracket notation.

## 0.2.0

- Add `@enumMeta(props: [...])` support: optional list of `EnumMetaProp { name, value }` entries per enum value, emitted as extra SmartEnum item fields. Duplicate `name` values or reserved names fail at codegen time.

## 0.1.4 and earlier

See git history.
