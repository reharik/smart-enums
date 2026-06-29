# Knex adapter

**Package:** [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex)

Small Knex helpers that wire **explicit** row revival into Knex's `queryContext` and `postProcessResponse`. This package does **not** infer enum types from the database, scan schema, or maintain a registry. You pass a field-to-enum mapping per query (or reuse one you already have).

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

const fieldEnumMapping = { status: UserStatus };

const rows = await withEnumRevival(db('users').select('*'), fieldEnumMapping, {
  strict: true,
});
```

- **`strict: true`** — invalid stored values throw `EnumRevivalError` (from `@reharik/smart-enum`).
- **No `withEnumRevival`** — `postProcessResponse` leaves results unchanged; there's no mapping in context, so nothing is revived.

Array columns work the same way: pass the column name in the mapping and each element is revived independently. See [array columns](/database/revival#array-columns).

## API

| Export | Role |
| --- | --- |
| `withEnumRevival(query, fieldEnumMapping, options?)` | Merges enum metadata into `query.queryContext(...)`. |
| `createSmartEnumPostProcessResponse()` | Returns a Knex `postProcessResponse` callback that calls `reviveRowFromDatabase`. |
| `SmartEnumKnexQueryContext` | Shape of the query-context fields this adapter reads. |
