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

**`strict` defaults to `true`.** It enforces the mapping/data contract in both directions, and both checks throw `EnumRevivalError`:

| Check | Fires when | The bug it catches |
| --- | --- | --- |
| **Value** | A mapped string matches no member | Corrupt or transitional data in a column |
| **Field** | A mapping key names a field the row does not have | A typo, or a column the query never selected |

`strict: false` disables both.

### The field check

This is the one that pays for itself. A mapping key that matches nothing used to be a silent no-op:

```typescript
// row has `operations: string[]`
reviveRowFromDatabase(row, {
  fieldEnumMapping: { operation: Operation }, // singular — typo
});
```

Nothing was revived, nothing complained, and `row.operations` stayed an array of raw strings while remaining *typed* as members. The failure surfaced far downstream — `.value` returning `undefined`, or every element collapsing into one key when used to build a map.

Now it throws, and the message lists the row's actual fields, because this whole class of bug is near-miss names:

```
EnumRevivalError: Cannot revive field "operation": not present on the row.
Available fields: id, operations, status
```

Seeing `operations` next to `operation` is the fix.

The same check applies to `revivePayloadFromDatabase`, at every path segment including the leaf — a mapped path the payload doesn't have throws rather than quietly doing nothing.

### It is a runtime check, not a static one

Two limits follow from that, both worth knowing:

- **Empty result sets can't be validated.** With zero rows there is no shape to check the mapping against, so a typo stays invisible until a query returns data.
- **It sees the row you actually got.** If a query selects a subset of columns, a mapping key naming an unselected column throws — correctly, since reviving it was never going to work. Reuse one mapping across queries with different projections only under `strict: false`.

For the Knex adapter, mapping keys are additionally [constrained to the query's row type at compile time](/database/knex#compile-time-key-checking), which catches the typo before it runs. The runtime check is the backstop for untyped queries and for `.select<T>()` assertions that don't match the database.

### Turning it off

Use `strict: false` when you're migrating and expect transitional values, or when one mapping is deliberately shared across queries that select different columns. It disables the value check too — there is no way to keep one and drop the other.

## Array columns

For columns holding arrays of enum values (e.g. Postgres `text[]`), pass the column name in `fieldEnumMapping` (or its path in `pathEnumMapping`) exactly as you would for a scalar column. Each element is revived independently. Strict mode applies element by element — an unknown value in any position throws and identifies the offending value.

```typescript
const revived = reviveRowFromDatabase(row, {
  fieldEnumMapping: { operations: Operation }, // operations is a text[] column
});
// revived.operations === [Operation.view, Operation.download]
```

No special syntax distinguishes scalar from array — the revival code inspects the actual value at runtime. A string revives as a scalar; an array revives element by element. The same mapping handles both.
