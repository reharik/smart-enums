# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.10.0] - Unreleased

> **Release coordination:** `@reharik/smart-enum-knex` has an outstanding fix of
> the same "loud beats silent" family — under `strict`, a mapping key that
> matches no row field is currently ignored silently. Plan a coordinated
> release of both packages so the two behavior changes land (and are documented)
> together.

### Why this release exists — the incident

A consumer's Nx monorepo ended up with two stray nested installs at
`packages/*/node_modules/@reharik/smart-enum`, created by a container-side
`npm install` through a bind mount. They were invisible in `package-lock.json`
(a single hoisted entry; every package declared `^0.9.0`) and only showed up as
missing "deduped" markers in `npm ls`. The effect: enums built by one copy of
the library serialized through *that copy's* module-level default, so
`setDefaultSerializationMode('value')` called on the other copy had no effect.
The result was `{ __smart_enum_type, value }` objects on the wire where bare
strings were expected — silently, and only on the REST path, since the GraphQL
path mapped the items to plain objects before serialization ever ran.

The lesson this release encodes: **module-level mutable state plus multiple
module instances equals silent wrong behavior.** The library cannot prevent
duplicate instances — bundling, hoisting accidents, mixed ESM/CJS loading, and
consumers' build configs all create them, and until now even importing two of
this package's *own entry points* (`.` and `./transport`, say) loaded two
copies of every internal module, because each entry is bundled standalone.
What the library can do is make its state survive duplication, the same way
`0.6.0` made `.equals()` compare string identity instead of references.
**Do not reintroduce module-level mutable state**; use the `globalSlot` helper
(`utilities/globalState.ts`) instead.

### Changed

- **All shared mutable state now lives on `globalThis`**, keyed by
  `Symbol.for('@reharik/smart-enum:…')`, so every loaded copy of the library —
  duplicate install, extra bundle chunk, ESM+CJS pair, or two of this package's
  own entry points — reads and writes the same state. No API signatures
  changed. The four pieces, and what each one silently broke when a second
  module instance existed and only one was configured:
  - _Default serialization mode_ (`setDefaultSerializationMode`): enums built
    by an unconfigured copy kept emitting wrapped `{ __smart_enum_type, value }`
    shapes — the incident above.
  - _Transport enum registry_ (`initializeSmartEnumMappings`):
    `reviveAfterTransport` imported from an unconfigured copy silently returned
    payloads unrevived, handing back wire shapes *typed* as enum members.
  - _Logger_ (`SmartEnumMappingsConfig.logger` / `logLevel`): an injected
    logger and level filter didn't apply to other copies, which kept logging
    unfiltered to the console.
  - _Enum-name uniqueness registry_: the creation-time guard against two
    different enums sharing a name (the wire/identity key) could not see names
    registered through another copy. It now holds realm-wide — **and it now
    warns instead of throwing.** The severity changed *because* the scope
    changed: module-scoped, a name collision was always a real duplicate-name
    mistake, so throwing was right. Realm-global, the registry outlives module
    reloads, so a dev-server hot reload that re-evaluates an enum module after
    a members edit re-registers a changed signature — ordinary development,
    not a mistake — and throwing would fail every HMR cycle. This guard's
    failure mode was also never silent wrong output, only a *missing warning*;
    the other three slots earn their realm-global strictness precisely because
    theirs was. So: a redefinition with different members logs a warning
    through the library's logger (filterable) naming the enum and the
    best-effort file of each registration, the registration is updated so the
    post-reload steady state stays quiet, and identical re-registration
    remains silent as before. Code that relied on the 0.6.0 throw
    (`Enum name '…' is already defined with different members`) should watch
    for the warning instead.
- **BREAKING-ish: `reviveAfterTransport` now throws when no registry has been
  initialized** instead of returning the payload untouched. The silent
  pass-through was a wrong-data path that fired even with a single library
  instance whenever `initializeSmartEnumMappings` was never called: wire shapes
  came back typed as enum members and the failure surfaced far downstream.
  Nothing useful can be done with a half-revived payload, so it is now loud.
  Migration — if you relied on the pass-through:

  ```ts
  // before: silently returned `payload` unrevived when uninitialized
  const dto = reviveAfterTransport<Dto>(payload);

  // after: initialize once at startup, before any revival
  initializeSmartEnumMappings({ enumRegistry: { Status, Color } });
  const dto = reviveAfterTransport<Dto>(payload);
  ```

- `getSubsetByProp` now compares prop values that are themselves enum members
  by string identity (`__smart_enum_type` + `value`) instead of reference
  identity. Passing a member from a second `enumeration()` call or a duplicate
  library copy previously returned a silently *empty* subset — the same failure
  `.equals()` was hardened against in `0.6.0`, applied to the one comparison
  that still used references. Plain string/number props are compared exactly as
  before.
- `patchSchemaEnumSerializers` is now idempotent per schema (stamped with a
  non-enumerable string marker, so a second *copy* of the library recognizes it
  too). Double-patching previously wrapped `parseValue` twice, and the second
  wrapper called `fromValue(<enum item>)` — which threw `No enum value found`,
  an error that names the wrong thing entirely and costs an hour of debugging
  in exactly the duplicate-instance setups above.

### Added

- **Duplicate-install detection.** On load, each copy of the library registers
  its version and on-disk location (directory) in a realm-global slot; when a
  second *distinct location* registers, the library logs a warning naming every
  copy (`0.9.0 at …/node_modules/@reharik/smart-enum/dist, 0.9.0 at
  packages/api/node_modules/@reharik/smart-enum/dist`) and suggesting
  `npm ls @reharik/smart-enum`. It's a warning, not an error: string-based
  identity and globalThis-keyed state mean duplicates mostly *work* — but a
  duplicate install is a packaging bug, and the silent kind cost a real
  debugging session (see the incident above). Legitimate multi-instance cases —
  the package's own entry-point bundles, ESM+CJS pairs — share one directory
  and are deliberately not flagged; unidentifiable locations stay silent rather
  than false-positive.
- `resetSmartEnumMappings()` — clears the transport registry back to
  uninitialized; the registry counterpart of `resetDefaultSerializationMode`,
  primarily for tests (which now need it, since the registry outlives a module
  instance).

## [0.9.0] - 2026-08-04

### Added

- `switchOn(obj, prop, handlers)` on every enum object — and on `pickEnum` / `omitEnum` / `getSubsetByProp` views, scoped to the subset. An exhaustive branch on the **object holding a member** that narrows the object itself: TypeScript only narrows a parent through unit-type discriminants, so an enum member can never drive `switch` narrowing — `switchOn` closes that gap. `prop` completion lists only properties holding _this_ enum's members; a prop holding a different enum's member is a compile error, and missing or extra arms are compile errors. At runtime it throws `TypeError` if `prop` does not hold a smart-enum member and `Error` if no arm matches (the same wire-lie guard `match` has). Dispatch is package-resistant: a member from a duplicate copy of the library still routes correctly.
- `isTagged(obj, prop, member)` and curried `taggedBy(prop)` — type guards that narrow the **containing object**, in both the true _and_ false branches, so an exhaustive `if` chain can end in `assertNever` and compile. The `if`-shaped counterpart of `switchOn`; where `has` narrows the value you pass to it, these narrow the object holding it. Comparison is package-resistant.
- `sameMember(a, b)` — the underlying package-resistant "same logical member" comparison (keys on `__smart_enum_type` + `value`), exported for direct use. `false`, never a throw, for non-members.

### Changed

- `fromValue` now preserves string literals: `Kind.fromValue('COMMENT')` is typed as the exact member rather than the member union. A widened `string` still returns the full union, so revival and wire-boundary call sites are unaffected. Type-level only — the runtime lookup is unchanged.

## [0.8.0] - 2026-08-03

### Changed

- **BREAKING: `strict` now defaults to `true`** on `reviveRowFromDatabase` and `revivePayloadFromDatabase`. Any call that omitted the option was previously silently permissive and now throws `EnumRevivalError` on a value that matches no member. Pass `strict: false` to keep the old behavior.
- **BREAKING: under `strict`, a mapping key that names a field the row does not have now throws** instead of being skipped. Previously `{ operation: Operation }` against a row with `operations` was a silent no-op: the column arrived as a raw string, typed as a member, and the failure surfaced far downstream — `.value` returning `undefined`, or every element collapsing into one key when used to build a map. The message lists the row's actual fields, since this class of bug is near-miss names:

  ```
  EnumRevivalError: Cannot revive field "operation": not present on the row.
  Available fields: id, operations, status
  ```

  `revivePayloadFromDatabase` applies the same check at leaf paths; it already threw for mismatched intermediate segments.

  This is a runtime check against real data, so it cannot fire for a query that returns zero rows, and it cannot tell a typo from a column the query didn't select. A mapping reused across queries with different projections needs `strict: false`.

### Added

- `assertMappedFieldsPresent(row, fieldEnumMapping)` — the field-presence check on its own, for callers validating a mapping once against a representative row rather than per row.
- `ReviveRowOptions.validateMappedFields` (default `true`) — skips the field-presence check while leaving value checking on. For batch callers that have already validated the mapping against the first row.

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
