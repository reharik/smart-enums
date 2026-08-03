# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-08-03

### Changed

- **BREAKING: `strict` now defaults to `true`** on `withEnumRevival`. A query annotated without the option was previously permissive and now throws `EnumRevivalError` on a stored value that matches no member. Pass `{ strict: false }` to keep the old behavior.
- **BREAKING: under `strict`, a mapping key that names a field the rows do not have now throws.** A typo like `{ operation: Operation }` against rows with `operations` used to revive nothing, silently, leaving raw strings typed as members. The error lists the row's actual fields. See the [core changelog](../core/CHANGELOG.md) for the full rationale.
- **BREAKING: mapping keys are now constrained to the query's row type.** A near-miss name is a compile error wherever the row type is known, with TypeScript suggesting the intended field. Untyped queries stay permissive, and a `.select<T>()` assertion is only as good as `T` — the runtime check is the backstop for both. A mapping wider than the query's projection no longer compiles; cast at the call site if that's deliberate.
- For a multi-row result the mapping is validated once against the first row, not per row. Heterogeneous rows in one result set aren't a supported case.
- Requires `@reharik/smart-enum` >= 0.8.0.

### Added

- `SmartEnumRow<TQuery>` and `SmartEnumRowField<TQuery>` — the row type a query builder resolves to, and the field names a mapping key may name.
- A `typecheck` script, now part of `npm test`, so the compile-time key constraint is actually gated.
