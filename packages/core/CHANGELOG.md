# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
