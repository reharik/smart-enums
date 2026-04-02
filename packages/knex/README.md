# @ts-smart-enum/knex

Small Knex helpers that wire **explicit** smart-enum row revival into Knex’s `queryContext` and `postProcessResponse`. This package does **not** infer enum types from the database, scan schema, or maintain a registry. You pass a `FieldEnumMapping` per query (or reuse one you already have).

## Install

```bash
npm install @ts-smart-enum/knex ts-smart-enum knex
```

`knex` is a **peer dependency**; `ts-smart-enum` is required at runtime for `reviveRowFromDatabase`.

## Knex client setup

Register a `postProcessResponse` hook once on your Knex config. It reads `smartEnumFieldMapping` / `smartEnumStrict` from each query’s context (set via `withEnumRevival`).

```typescript
import knex from 'knex';
import { createSmartEnumPostProcessResponse } from '@ts-smart-enum/knex';

export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  postProcessResponse: createSmartEnumPostProcessResponse(),
});
```

## Per-query mapping

Attach the mapping for **that** query so the hook knows which columns to revive:

```typescript
import { withEnumRevival } from '@ts-smart-enum/knex';
import { enumeration } from 'ts-smart-enum';

const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active'] as const,
});

const fieldEnumMapping = { status: UserStatus };

const rows = await withEnumRevival(
  db('users').select('*'),
  fieldEnumMapping,
  { strict: true },
);
```

- **`strict: true`**: invalid stored values throw `EnumRevivalError` (from `ts-smart-enum`).
- **No `withEnumRevival`**: `postProcessResponse` leaves results unchanged (no mapping in context).

## API

| Export | Role |
| --- | --- |
| `withEnumRevival(query, fieldEnumMapping, options?)` | Merges enum metadata into `query.queryContext(...)`. |
| `createSmartEnumPostProcessResponse()` | Returns a Knex `postProcessResponse` callback that calls `reviveRowFromDatabase`. |
| `SmartEnumKnexQueryContext` | Shape of the query-context fields this adapter reads. |

Enum creation, `prepareForDatabase`, and revival behavior all live in **`ts-smart-enum`**; this package only connects them to Knex.
