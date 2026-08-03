# @reharik/smart-enum

Type-safe, feature-rich enumerations for TypeScript. Every member is a frozen object that carries its own wire value, display label, ordering, and any custom fields you give it — with runtime lookup, iteration, serialization, and database revival built in.

📖 **Full documentation:** https://reharik.github.io/smart-enums/

## The idea

Have you ever followed one value — an order status, say — through a codebase and counted how many places had to know about it? The database stores `'ACTIVE'`, the API ships `'ACTIVE'`, a `<select>` uses it, a labels map turns it into `'Active'`, an array lists every option, and a few `if`s compare it. Add `'ARCHIVED'` and there are five places to update. Miss one and it's not carelessness — those places were never connected. The language gave you a bare `string`, so the concept scattered.

A smart enum lets that concept be **one object that knows everything about itself**:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;

Status.active;               // { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }
Status.active.display;       // 'Active'        — the label lives with the value
Status.fromValue('ACTIVE');  // Status.active   — runtime lookup, type-narrowed
Status.items();              // every member, in order — your dropdown options
Status.values();             // ['PENDING','ACTIVE','COMPLETED'] — your validator set
```

The options list, wire value, label, valid-set, and ordering are all the same object, defined once. There's no fifth place to forget.

## Why people reach for it

- **Metadata that travels with the value** — attach `status`, `retryable`, `column`, anything, and read it off the member at runtime instead of from a parallel map.
- **Lookup without boilerplate** — `fromValue` / `fromKey` (and `try*` variants), all type-narrowed to the enum's members.
- **Survives the boundary** — members serialize to self-describing JSON and revive into the *same* instances across a network, a database, or a full GraphQL stack. A value that left as `Status.active` comes back knowing it is.
- **Tiny and lock-in-free** — ~600 bytes full, ~149 for just `enumeration` via [entry points](https://reharik.github.io/smart-enums/core/guards-and-entry-points); output is plain frozen objects and ordinary JSON.

## Strict revival

Reading enums back out of a database means declaring which columns map to which enums. That mapping is the contract, and `strict` — **on by default** — enforces it in both directions:

```typescript
reviveRowFromDatabase(row, {
  fieldEnumMapping: { operations: Operation },
});
```

- **The data side** — a stored string that matches no member throws `EnumRevivalError`, instead of leaking a bare string into your domain logic.
- **The mapping side** — a key naming a field the row doesn't have throws too. A typo like `{ operation: Operation }` against an `operations` column used to be a silent no-op: nothing revived, no warning, and the column arrived as raw strings while still *typed* as members. That failure surfaces far from its cause — `.value` returning `undefined`, or every element collapsing into one key when used to build a map.

The error lists the row's actual fields, because the whole class of bug is near-miss names:

```
EnumRevivalError: Cannot revive field "operation": not present on the row.
Available fields: id, operations, status
```

With the [Knex adapter](https://reharik.github.io/smart-enums/database/knex), mapping keys are also constrained to the query's row type, so TypeScript catches the typo first — and suggests the field you meant. The runtime check backstops untyped queries and `.select<T>()` assertions that don't match the database.

Pass `strict: false` to disable both checks — when you're migrating and expect transitional values, or when one mapping is deliberately shared across queries that select different columns.

## Install

```bash
npm install @reharik/smart-enum
```

Then read the [five-minute quick start](https://reharik.github.io/smart-enums/guide/quick-start), or [Coming from TypeScript enums](https://reharik.github.io/smart-enums/guide/coming-from-enums) if you're migrating.

## The ecosystem

| Package | Purpose |
| --- | --- |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex) | Knex query-level enum revival via `postProcessResponse` |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Generate smart-enum definitions from GraphQL schema enums |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Apollo `typePolicies` for client-side enum rehydration |
| [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset) | Codegen preset that wires the whole stack with zero per-enum config |

## License

MIT
