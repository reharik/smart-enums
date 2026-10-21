# no-smart-enum-reference-equality

Disallow reference equality (`===`, `!==`, `==`, `!=`) on smart-enum members. Use `.equals()` instead.

Rule from [`@reharik/eslint-plugin-smart-enum`](https://www.npmjs.com/package/@reharik/eslint-plugin-smart-enum).

## Why

`===` on smart-enum members compares object identity, which breaks when two copies of
`@reharik/smart-enum` end up in one app (nested installs, bundling, mixed ESM/CJS) and each
builds its own member objects. `.equals()` compares by enum type and value, so it works across copies.

## Install

```sh
npm install --save-dev @reharik/eslint-plugin-smart-enum @typescript-eslint/parser eslint typescript
```

## Configure (flat config)

### 1. Enable type information (required)

::: danger This rule is type-aware
Without type information it does **nothing useful**. You must give the parser a TypeScript
program via `parserOptions.projectService: true` or `parserOptions.project`. The plugin does
**not** set a parser or parser options — you own that. If type information is missing,
typescript-eslint throws a "requires type information" error; if your files are matched by a
config block that has no `.ts` parser at all, the rule never runs.
:::

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
  // 2. add the rule here — see below
];
```

### 2. Add the rule

Pick one of these and add it to the array after the parser block.

**Recommended config** — turns the rule on as `error` for every file ESLint lints:

```js
smartEnum.configs.recommended,
```

**Explicit plugin and rule** — use this to set the rule to `'warn'` or to limit it
to certain files:

```js
{
  files: ['src/**/*.ts'],
  plugins: { 'smart-enum': smartEnum },
  rules: { 'smart-enum/no-smart-enum-reference-equality': 'warn' },
},
```

## Before / after

```ts
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: { active: { value: 'ACTIVE' }, inactive: { value: 'INACTIVE' } },
});
type Status = Enumeration<typeof Status>;

declare const status: Status;
declare const row: { kind: Status };
```

❌ Reported:

```ts
status === Status.active;
status !== Status.active;
Status.active === status;
row.kind == Status.active;
```

✅ Fixed:

```ts
status.equals(Status.active);
!status.equals(Status.active);
Status.active.equals(status);
row.kind.equals(Status.active);
```

✅ Not reported:

```ts
status == null; // nullish checks are allowed
status != undefined;
status.value === 'ACTIVE'; // comparing primitives is fine
```

## What counts as a member

Any type, or union constituent, whose `__smart_enum_brand` property is literally `true`. That
covers `Status`, `Status | undefined`, `EnumSubset<…>`, members of `pickEnum(…)` views, and
object properties typed as a member. Detection is structural rather than by importing the
library's types, so members created by a duplicate copy of the package are still caught.

## Options

None.
