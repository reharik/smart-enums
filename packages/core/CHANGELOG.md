# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.7.0] - 2026-07-20

### Added

- `omitEnum(enum, keys)` — a runtime enum-like view of every member _except_ the named ones; the inverse of `pickEnum`. Like `pickEnum` it reuses the parent's item instances (identity, `equals`, and serialization carry over) and preserves declaration order. Use it when dropping one or two members is shorter than listing all the ones you keep.
- `EnumSubset` now accepts an object selector in addition to a bare key union: `{ include: K }` (same members as the bare form) and `{ exclude: K }` (every member _except_ `K`). `{ exclude }` is the type-level twin of `omitEnum`, so adding a member to the enum widens the subset automatically. Keys are still validated — a typo in an `include`/`exclude` list is a compile error.
- Exported the `SmartEnumItem<Name, Key, Value, Display>` type (the shape every enum member now resolves to).

### Changed

- Enum member types now resolve to a named `SmartEnumItem<…>` interface reference instead of an anonymous intersection of object types. Editors show a single named line on hover — e.g. `SmartEnumItem<"EventType", "commentPosted", "COMMENT_POSTED", "Comment Posted">`, with the enum name first — instead of expanding every field, and a non-exhaustive `.match()` error now names the missing branch over short, named handler types instead of burying it under full field dumps. The structural shape is unchanged, so this is a display/diagnostics improvement only — no runtime or type-compatibility change.

## [0.6.0] - 2026-07-15

### Changed

- Enum item equality (`equals`, `enumItemsEqual`, and the new `has`) is now package-resistant. Equality compares the string identity `__smart_enum_type` + `value` instead of per-instance Symbols, so members compare equal across separate `enumeration()` calls of the same enum and across duplicate copies of `@reharik/smart-enum` — the cases where the previous Symbol-based `equals` silently returned `false` (behaving no better than `===`). Item and enum detection (`isSmartEnumItem`, `isSmartEnum`) is likewise now structural rather than Symbol-based. Consequence: `equals`/`has` against an _unbranded_ serialized object (`{ __smart_enum_type, value }` with no `__smart_enum_brand`) returns `false` — revive it first, or use a branded object. All internal Symbols were removed.
- `enumeration()` now throws at creation time if the same enum name is registered with _different_ members, because the name is the wire/identity key. Re-registering a name with identical members is allowed (returns compatibly). This can surface as an error at module load for any app that defined two different enums under one name — previously silent, now rejected. Names must be unique within a module instance.

## [0.5.3] - 2026-07-15

### Added

- exposed EnumSubset this time

## [0.5.2] - 2026-07-15

### Changed

- `isSmartEnum()` now returns a type predicate (`x is SmartEnumLike`) instead of `boolean`, narrowing the value inside a guard. Runtime behavior is unchanged.
- Enum item `equals()` now returns a type predicate (`this is T`) instead of `boolean`, so exhaustive `if`/`else` chains narrow to `never` without `match`. Runtime behavior is unchanged.
- Enum item `equals()` now rejects comparisons between members of _different_ enums at compile time. Each enum's members carry a distinct brand (`__smart_enum_type` is now a literal type on `enumeration()`-produced items). A cross-enum comparison was always `false` at runtime; it is now a type error — surfacing bugs that previously compiled silently.

### Added

- `match()` on enum items — exhaustive branch-on-member that returns a value. The compiler requires one handler per member of the statically-known type; a missing arm is a compile error, and an arm for a member that can't occur is also a compile error. Handlers are keyed by member key and receive the narrowed item. A runtime guard throws on a value with no matching handler (e.g. a mistyped deserialized value).
- `pickEnum(enum, keys)` — a runtime enum-like view over an explicit list of member keys. Picked members reuse the parent's item references (identity, `equals`, and serialization are preserved), and the view's `fromValue` / `fromKey` / `items` are scoped to the subset. Complements `getSubsetByProp`, which selects by shared property value rather than by key list.
- `EnumSubset<Members, Keys>` — a type-level member subset. Narrows an enum's member union to the named members, derived from the parent, for typing fields and parameters without declaring a new enum or a runtime view.
- `SmartEnumMatch`, `PickEnumView`, `EnumMemberKeys`, and `EnumSubset` exported from `types` for consumer annotations and to satisfy declaration-file naming.

## [0.5.1] - 2026-07-14

### Added

- added SmartEnumMatch to public export

## [0.5.0] - 2026-07-14

### Changed

- **npm package renamed** from `smart-enums` to `@reharik/smart-enum` (import specifiers and subpath exports such as `@reharik/smart-enum/database` replace the old `smart-enums/*` paths). The Knex helper package is published as `@reharik/smart-enum-knex`.
- `isSmartEnum()` now returns a type predicate (`x is SmartEnumLike`) instead of `boolean`, narrowing the value inside a guard. Runtime behavior is unchanged.
- Enum item `equals()` now returns a type predicate (`this is T`) instead of `boolean`, so exhaustive `if`/`else` chains narrow to `never` without `match`. Runtime behavior is unchanged.

### Added

- `match()` on enum items — exhaustive branch-on-member that returns a value. The compiler requires one handler per member of the statically-known type; a missing arm is a compile error. Handlers are keyed by member key and receive the narrowed item. Includes a runtime guard that throws on a value with no matching handler (e.g. a mistyped deserialized value).
- `pickEnum(enum, keys)` — an enum-like view over an explicit list of member keys. Picked members reuse the parent's item references (identity, `equals`, and serialization are preserved), and the view's `fromValue` / `fromKey` / `items` are scoped to the subset. The picked members form a discriminated union that composes with `match`. Complements `getSubsetByProp`, which selects by shared property value rather than by key list.
- `SmartEnumMatch`, `PickEnumView`, and `EnumMemberKeys` exported from `types` for consumer annotations.
- Added `isSmartEnum()` function to check if an object is a full smart enum (as opposed to a single enum item)
- Added `SMART_ENUM` symbol property to enum objects for runtime detection
- Database module rebuilt under `src/db`: `reviveRowFromDatabase`, `revivePayloadFromDatabase`, `EnumRevivalError`, and `prepareForDatabase` (serialization only)
- `toPostgres()` on enum items for outbound PostgreSQL binding
- `initializeSmartEnumMappings` / `getGlobalEnumRegistry` moved to transport (`src/utilities/transport/transportRegistry.ts`) — wire revival only

### Removed

- Entire previous `src/utilities/database` implementation: `reviveFromDatabase`, learned mappings, `getLearnedMapping`, `mergeFieldMappings`, `learnFromData`, registry-based DB revival, string / `string[]` field-to-type-name mappings
- Tests that covered the old database behavior

### Changed

- `isSmartEnum()` now uses a dedicated `SMART_ENUM` symbol property on enum objects for more accurate detection
- **`@reharik/smart-enum/database`** no longer exports transport registry helpers (import from `@reharik/smart-enum/transport` or the root package)
- **Breaking:** `reviveFromDatabase` and all learning / manual string-based enum mapping APIs are gone; use explicit `fieldEnumMapping` / `pathEnumMapping` with enum object references
- The repo was converted to a workspace monorepo (`packages/core` and `packages/knex`) to keep the core and Knex adapter clearly separated.
- Build artifacts (`dist/`) are no longer committed to git; install-time `prepare` builds generate the output required for consumption.
- **`@reharik/smart-enum-knex`** adds an explicit, metadata-driven Knex adapter (`withEnumRevival`, `createSmartEnumPostProcessResponse`) that revives rows via `reviveRowFromDatabase` using per-query `queryContext` (no schema inspection, inference, or registries).

## [0.0.21] - 2024-XX-XX

### Initial Release (Changelog Started)

- Core enumeration functionality
- Type guards: `isSmartEnumItem()`, `isSerializedSmartEnumItem()`
- Extension methods for enum objects (fromValue, toOptions, etc.)
- Serialization and revival utilities
- Database utilities with automatic field mapping learning
- Transport utilities for API communication
- Tree-shaking support with multiple entry points

[Unreleased]: https://github.com/reharik/smart-enums/compare/v0.0.21...HEAD
[0.0.21]: https://github.com/reharik/smart-enums/compare/v0.0.20...v0.0.21
