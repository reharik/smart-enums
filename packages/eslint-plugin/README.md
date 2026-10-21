# @reharik/eslint-plugin-smart-enum

Type-aware ESLint rules for [`@reharik/smart-enum`](https://reharik.github.io/smart-enums/).

## Install

```sh
npm install --save-dev @reharik/eslint-plugin-smart-enum @typescript-eslint/parser eslint typescript
```

Peer dependencies: `eslint >=9`, `@typescript-eslint/parser ^8`, `typescript >=5`.

## Usage (flat config)

> [!WARNING]
> **This rule is type-aware. Without type information it does nothing useful.**
> You must give the parser a TypeScript program via `parserOptions.projectService: true`
> or `parserOptions.project`. The plugin's `recommended` config deliberately does
> **not** set a parser or parser options — you own that. If type information is
> missing, typescript-eslint throws a "requires type information" error; if your
> files are matched by a config block that has no `.ts` parser at all, the rule
> never runs.

```js
// eslint.config.js
import tsParser from '@typescript-eslint/parser';
import smartEnum from '@reharik/eslint-plugin-smart-enum';

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true, // or: project: './tsconfig.json'
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  smartEnum.configs.recommended,
];
```

Or enable the rule by hand:

```js
{
  plugins: { 'smart-enum': smartEnum },
  rules: { 'smart-enum/no-smart-enum-reference-equality': 'error' },
}
```

## Rules

| Rule                                                                                                                           | Description                                                              | Recommended |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ | ----------- |
| [`smart-enum/no-smart-enum-reference-equality`](https://reharik.github.io/smart-enums/eslint/no-smart-enum-reference-equality) | Disallow `===`, `!==`, `==`, `!=` on smart-enum members; use `.equals()` | `error`     |

### `no-smart-enum-reference-equality`

`===` on smart-enum members compares object identity, which breaks when two copies of
`@reharik/smart-enum` end up in one app (nested installs, bundling, mixed ESM/CJS) and each
builds its own member objects. `.equals()` compares by enum type and value, so it works across copies.

```ts
// ❌
if (status === Status.active) {
}
if (status !== Status.active) {
}

// ✅
if (status.equals(Status.active)) {
}
if (!status.equals(Status.active)) {
}
```

Members are detected structurally (any type, or union constituent, whose `__smart_enum_brand`
property is literally `true`), not by importing the library's types, so members from a duplicate
copy of the package are still caught. Nullish checks (`status == null`, `status != undefined`)
are allowed.
