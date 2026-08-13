# Changelog

## 0.5.0

- **BREAKING: the `external-defines` mode is gone.** Hand-authored enums are now handled entirely within `enums` mode: when `externalEnums` is set, the preset emits **two files from the one `generates` entry** — the enums output (generated enums plus `define<Name>Input` functions, importing no user code) and a sibling `<name>Registry.<ext>` file holding `enumRegistry` (which imports the hand-authored enums). Point bootstrap code (`patchSchemaEnumSerializers`, Apollo `typePolicies` setup) at the registry file; never import it from code reachable by an enum. Previously the registry lived in the widely-imported enums file, which gave the module graph a load-order-dependent cycle that TDZ-crashed at runtime.
  - Migration: delete the `external-defines` `generates` entry, move its `externalEnums` map onto the `enums` entry, and update bootstrap imports from the enums file to the new `<name>Registry` sibling. `presetConfig.mode` now accepts `'enums' | 'type-policies' | 'with-enum-values'`.
- `externalEnums` no longer needs to be non-empty; it must be a plain object of enum type name → import path (relative to the enums output file).
- Requires `@reharik/graphql-codegen-smart-enum` ^0.7.0 (the `emit: 'enumRegistry'` / `enumsImportPath` API this preset orchestrates).

## 0.4.0 and earlier

See git history.
