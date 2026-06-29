# Revival utilities

Database columns are plain strings — they don't carry type information. So the two directions are asymmetric: writing is automatic (members already know their `.value`), but reading requires you to declare which columns map to which enums.

These utilities live in the core package's `@reharik/smart-enum/database` entry point. If you use Knex, the [Knex adapter](/database/knex) wires them into `postProcessResponse` so you don't call them by hand per query.

## Why it's worth the one declaration

It's tempting to skip this and just read strings. But a string column gives you back `'ACTIVE'`, and from there every consumer re-implements the same lookup to get a label or compare safely — scattered, easy to get subtly wrong. Declaring the column→enum mapping once, at the data boundary, means rows arrive as real members: `.display` works, `.equals` works, metadata is attached, and an unexpected stored value can fail loudly (`strict`) instead of leaking a bare string into your domain logic. One declaration at the edge buys correctness everywhere inside it.

## Outbound: writing

`prepareForDatabase` recursively replaces members with their `.value` strings. Each member also has a `.toPostgres()` method that PostgreSQL drivers honoring the protocol will call automatically.

```typescript
import { prepareForDatabase } from '@reharik/smart-enum/database';

const dbRow = prepareForDatabase({ name: 'Alice', status: Status.active });
// { name: 'Alice', status: 'ACTIVE' }
```

## Inbound: reading

Reads come back as strings; you map them back to members.

### Flat rows

```typescript
import { reviveRowFromDatabase } from '@reharik/smart-enum/database';

const revived = reviveRowFromDatabase(row, {
  fieldEnumMapping: { status: Status, priority: Priority },
  strict: true, // throw on unknown values instead of keeping the raw string
});
```

### Nested payloads (e.g. JSONB)

For documents — a JSONB column, say — map by path instead of by top-level field:

```typescript
import { revivePayloadFromDatabase } from '@reharik/smart-enum/database';

const doc = revivePayloadFromDatabase(payload, {
  pathEnumMapping: {
    'user.status': Status,
    'items[].kind': ItemKind,
  },
});
```

The `items[].kind` syntax revives `kind` on every element of the `items` array.

## Strict mode

`strict: true` throws `EnumRevivalError` when a mapped string matches no member. Without it, unrecognized values are left as-is. Use strict mode when stored data should always be valid and a mismatch means corruption you want surfaced; leave it off when you're migrating and expect transitional values.

## Array columns

For columns holding arrays of enum values (e.g. Postgres `text[]`), pass the column name in `fieldEnumMapping` (or its path in `pathEnumMapping`) exactly as you would for a scalar column. Each element is revived independently. Strict mode applies element by element — an unknown value in any position throws and identifies the offending value.

```typescript
const revived = reviveRowFromDatabase(row, {
  fieldEnumMapping: { operations: Operation }, // operations is a text[] column
  strict: true,
});
// revived.operations === [Operation.view, Operation.download]
```

No special syntax distinguishes scalar from array — the revival code inspects the actual value at runtime. A string revives as a scalar; an array revives element by element. The same mapping handles both.
