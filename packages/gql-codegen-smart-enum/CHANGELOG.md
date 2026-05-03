# Changelog

## 0.2.6

- **`skipEnums` config** — optional `string[]` of GraphQL enum type names to omit from the generated file. Use when certain schema enums should be handled only by the TypeScript plugin (or outside this plugin).

## 0.2.1

- **Props-only `@enumMeta`:** if a value’s directive only passes `props` (no `display` / `shortDisplay` / `description` / `sortOrder`), omit generated `display` for that item.
- Emit valid identifier prop names as plain keys (`column:`) instead of always using bracket notation.

## 0.2.0

- Add `@enumMeta(props: [...])` support: optional list of `EnumMetaProp { name, value }` entries per enum value, emitted as extra SmartEnum item fields. Duplicate `name` values or reserved names fail at codegen time.

## 0.1.4 and earlier

See git history.
