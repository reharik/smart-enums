# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

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
- **`smart-enums/database`** no longer exports transport registry helpers (import from `smart-enums/transport` or the root package)
- **Breaking:** `reviveFromDatabase` and all learning / manual string-based enum mapping APIs are gone; use explicit `fieldEnumMapping` / `pathEnumMapping` with enum object references

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
