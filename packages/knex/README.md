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

Status.active; // { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }
Status.active.display; // 'Active'        — the label lives with the value
Status.fromValue('ACTIVE'); // Status.active   — runtime lookup, type-narrowed
Status.items(); // every member, in order — your dropdown options
Status.values(); // ['PENDING','ACTIVE','COMPLETED'] — your validator set
```

The options list, wire value, label, valid-set, and ordering are all the same object, defined once. There's no fifth place to forget.

## Why people reach for it

- **Metadata that travels with the value** — attach `status`, `retryable`, `column`, anything, and read it off the member at runtime instead of from a parallel map.
- **Lookup without boilerplate** — `fromValue` / `fromKey` (and `try*` variants), all type-narrowed to the enum's members.
- **Exhaustive branching** — `match` over a member, and the compiler makes you handle every case (below).
- **Survives the boundary** — members serialize to self-describing JSON and revive into the _same_ instances across a network, a database, or a full GraphQL stack. A value that left as `Status.active` comes back knowing it is.
- **Tiny and lock-in-free** — ~600 bytes full, ~149 for just `enumeration` via [entry points](https://reharik.github.io/smart-enums/core/guards-and-entry-points); output is plain frozen objects and ordinary JSON.

## Exhaustive matching

Branch on a member and return a value — with the compiler forcing you to handle every case. No `let`, no `else`, no `assertUnreachable`:

```typescript
const summary = order.status.match({
  pending: () => 'Waiting to ship',
  active: () => 'On its way',
  completed: () => 'Delivered',
});
```

Add a member to the enum and every `match` missing an arm turns red — a runtime surprise becomes a compile error. A runtime guard still catches a value that lied about its shape on the wire.

## Subsetting

Restrict a value to _some_ of an enum's members without declaring a second enum. `EnumSubset` narrows the member union at the type level — you fill it with the parent's own members, and the compiler rejects the rest:

```typescript
import { type EnumSubset } from '@reharik/smart-enum';

type OpenStatus = EnumSubset<Status, 'pending' | 'active'>;

const a: OpenStatus = Status.active; // ok — the parent's own member
const b: OpenStatus = Status.completed; // compile error — not in the subset
```

Need the subset at runtime too — its own `fromValue`, its own `items()`? `pickEnum` builds a view over the _same_ member instances, not copies, so identity and serialization carry over untouched:

```typescript
const OpenStatus = pickEnum(Status, ['pending', 'active'] as const);

OpenStatus.active === Status.active; // true — same object, not a clone
OpenStatus.fromValue('COMPLETED'); // throws — outside the subset
```

→ Full guide: [matching, subsets, and guards](https://reharik.github.io/smart-enums/guide/matching).

## Install

```bash
npm install @reharik/smart-enum
```

Then read the [five-minute quick start](https://reharik.github.io/smart-enums/guide/quick-start), or [Coming from TypeScript enums](https://reharik.github.io/smart-enums/guide/coming-from-enums) if you're migrating.

## The ecosystem

| Package                                                                                                                                | Purpose                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex)                                                   | Knex query-level enum revival via `postProcessResponse`             |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum)                             | Generate smart-enum definitions from GraphQL schema enums           |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Apollo `typePolicies` for client-side enum rehydration              |
| [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset)               | Codegen preset that wires the whole stack with zero per-enum config |

## License

MIT
