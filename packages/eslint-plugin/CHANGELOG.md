# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial release of `@reharik/eslint-plugin-smart-enum` (0.1.0), a flat-config
  ESLint plugin with a `recommended` config.
- `no-smart-enum-reference-equality` rule (extracted from photoapp's internal
  plugin): reports `===`, `!==`, `==`, `!=` where either operand is a
  smart-enum member, and suggests `.equals()`. Negated operators suggest
  `!left.equals(right)`. Members are detected structurally via
  `__smart_enum_brand: true`, so duplicate package copies are covered.
