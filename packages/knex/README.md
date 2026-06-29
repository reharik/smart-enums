# @reharik/smart-enum-knex

Wire smart-enum row revival into Knex so enum columns come back as real members, not bare strings — without a schema scanner, a registry, or magic. You annotate the queries that need it; the conversion happens once, in Knex's response hook.

📖 **Full documentation:** https://reharik.github.io/smart-enums/database/knex

## The problem it removes

A status column gives you back `'ACTIVE'`. From there, every read that wants a label or a safe comparison re-implements the same lookup — scattered across your data layer, and silently working with raw strings wherever someone forgets. This adapter moves that conversion into `postProcessResponse`, so opted-in queries return `Status.active` (with `.display`, `.equals`, and any metadata) and the rest of your Knex code stays exactly as it was.

## Install

```bash
npm install @reharik/smart-enum-knex @reharik/smart-enum knex
```

`knex` is a peer dependency; `@reharik/smart-enum` is the runtime that does the reviving.

## The shape of it

```typescript
import knex from 'knex';
import {
  createSmartEnumPostProcessResponse,
  withEnumRevival,
} from '@reharik/smart-enum-knex';

// Register the hook once on your client:
export const db = knex({
  client: 'pg',
  connection: process.env.DATABASE_URL,
  postProcessResponse: createSmartEnumPostProcessResponse(),
});

// Annotate the queries that should revive — explicit, per query:
const rows = await withEnumRevival(
  db('users').select('*'),
  { status: UserStatus },   // column → enum
  { strict: true },         // unknown stored value throws instead of leaking a string
);
// rows[0].status is now UserStatus.active — a real member
```

Queries you don't annotate are untouched, so adoption is one query at a time. Array columns (Postgres `text[]`) revive element by element with the same mapping.

The full API, strict-mode behavior, and how this composes with the core [revival utilities](https://reharik.github.io/smart-enums/database/revival) are in the docs.

## License

MIT
