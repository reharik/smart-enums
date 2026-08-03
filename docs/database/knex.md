# Knex adapter

**Package:** [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex)

Small Knex helpers that wire **explicit** row revival into Knex's `queryContext` and `postProcessResponse`. This package does **not** infer enum types from the database, scan schema, or maintain a registry. You pass a field-to-enum mapping per query.

That explicitness is the design: the adapter connects [the core revival utilities](/database/revival) to Knex's hooks, and nothing more. Enum creation, `prepareForDatabase`, and the revival behavior itself all live in [`@reharik/smart-enum`](/core/creating-enums).

## Why you want this

Without it, every read that touches an enum column ends with the same chore: pull the row, then walk it converting `'ACTIVE'` back into `Status.active` before anyone downstream can use `.display` or `.equals`. Miss one query and that code path silently works with raw strings. This adapter moves that conversion into Knex's response hook, so it happens once, in one place, for every query you opt in — and the rest of your data-access code goes back to looking like ordinary Knex. You annotate the query that needs revival; the plumbing is invisible.

## Install

```bash
npm install @reharik/smart-enum-knex @reharik/smart-enum knex
```

`knex` is a **peer dependency**; `@reharik/smart-enum` is required at runtime for `reviveRowFromDatabase`.

## Client setup

Register a `postProcessResponse` hook once on your Knex config. It reads the smart-enum field mapping and strict flag from each query's context (set via `withEnumRevival`):

```typescript
import knex from 'knex';
import { createSmartEnumPostProcessResponse } from '@reharik/smart-enum-knex';

export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  postProcessResponse: createSmartEnumPostProcessResponse(),
});
```

## Per-query mapping

Attach the mapping for **that** query so the hook knows which columns to revive:

```typescript
import { withEnumRevival } from '@reharik/smart-enum-knex';
import { enumeration } from '@reharik/smart-enum';

const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active'] as const,
});

const rows = await withEnumRevival(db('users').select('*'), {
  status: UserStatus,
});
```

- **`strict`** — defaults to `true`. Invalid stored values *and* mapping keys that name a field the row doesn't have both throw `EnumRevivalError` (from `@reharik/smart-enum`). See [strict mode](/database/revival#strict-mode).
- **No `withEnumRevival`** — `postProcessResponse` leaves results unchanged; there's no mapping in context, so nothing is revived.

Array columns work the same way: pass the column name in the mapping and each element is revived independently. See [array columns](/database/revival#array-columns).

For a multi-row result the mapping is validated once, against the first row. Heterogeneous rows in a single result set aren't a supported case, and a per-row check would exit on the first failure anyway.

## Compile-time key checking

Mapping keys are constrained to the query's row type, so a near-miss name fails to compile wherever that row type is known — and TypeScript names the field you meant:

```typescript
interface User { id: number; operations: string[] }

withEnumRevival(db('users').select<User[]>('*'), { operation: Operation });
//                                                 ~~~~~~~~~
// Object literal may only specify known properties, but 'operation'
// does not exist in type 'Record<keyof User, SmartEnumLike>'.
// Did you mean to write 'operations'?
```

This works for `.select<T[]>()` assertions, typed tables, `.first()`, and `.returning()` — awaiting the builder is what resolves Knex's deferred-selection types.

Two cases it can't cover, which is why the runtime check exists:

- **Untyped queries.** `db('users').select('*')` has no row type, so keys fall back to unconstrained strings.
- **Wrong assertions.** `.select<T>()` is an assertion, not a check. If `T` doesn't match the real columns, the mapping can agree with `T` and still miss the database.

A partial select narrows the allowed keys, so mapping a column the query didn't select is a compile error too. Reusing one mapping constant across queries still works wherever the projection covers it — `select('*')`, or an untyped query — but a mapping wider than the projection won't compile, and `strict: false` doesn't change that. `strict` governs the runtime checks only; the key constraint is unconditional. If you genuinely need a wider mapping than the row type admits, cast it at the call site.

## API

| Export | Role |
| --- | --- |
| `withEnumRevival(query, fieldEnumMapping, options?)` | Merges enum metadata into `query.queryContext(...)`. Mapping keys are constrained to the query's row type. |
| `createSmartEnumPostProcessResponse()` | Returns a Knex `postProcessResponse` callback that calls `reviveRowFromDatabase`. |
| `SmartEnumKnexQueryContext` | Shape of the query-context fields this adapter reads. |
| `SmartEnumRow<TQuery>` | The row type a query builder resolves to. |
| `SmartEnumRowField<TQuery>` | The field names of `SmartEnumRow<TQuery>` a mapping key may name. |
