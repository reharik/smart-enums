# Introduction

Have you ever followed a single value through a codebase — an order status, say — just to see how many places had to know about it?

It starts in the database as `'ACTIVE'`. It rides a GraphQL response as `'ACTIVE'`. It's the value of a `<select>`, it's compared in a handful of `if` statements, switched on in a few more. Somewhere there's a little map turning it into `'Active'` for display. Somewhere else, an array listing every possible status for a dropdown. Maybe a comment, or a wiki page, explaining what `'ACTIVE'` even means.

Does that sound familiar? Most Node codebases of any age have some version of it. And here's the part worth sitting with: when you add `'ARCHIVED'`, there are four or five places to update — and if you've ever updated four of them and missed the fifth, it almost certainly wasn't carelessness. Those places were never connected to each other in the first place. The language handed you a bare `string`, so the knowledge about that status got spread out, and keeping the pieces in step became a manual chore nobody signed up for.

That string is really a **domain concept** — an account status — traveling in disguise. It has a wire format, a human label, a place in an ordering, rules about what it's allowed to become next, maybe an icon or a color. One idea, with a handful of facts attached. The tools we reach for just don't give us a good way to keep those facts together, so they scatter.

`@reharik/smart-enum` is built on a simple bet: let the concept be one thing that knows everything about itself.

## Why the usual approaches leave you patching

It's worth noticing _why_ the scatter happens, because it's not a discipline problem — it's that each common tool gives you one piece and leaves you to build the rest:

| Approach                   | What you get        | What you end up adding by hand                            |
| -------------------------- | ------------------- | --------------------------------------------------------- |
| `enum Status {...}`        | a name→value map    | iteration, metadata, runtime lookup, boundary handling    |
| `type Status = 'a' \| 'b'` | compile-time safety | everything at runtime — `.display`, the list, `fromValue` |
| `['a','b'] as const`       | an iterable list    | keyed access, metadata                                    |
| `const S = { A: 'a' }`     | keyed constants     | iteration, narrowing, metadata (and you repeat the text)  |

So you bring in the union _and_ a labels object _and_ an options array _and_ a validator — four artifacts for one idea, each maintained separately. The boilerplate is annoying, sure, but the boilerplate isn't the real cost. The drift between those four is.

## One object that knows itself

A smart enum is a single construct where every member is a frozen object carrying everything the concept needs, with lookup and iteration already built in:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;

Status.active;
// { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }

Status.active.display; // 'Active'  — the label lives with the value
Status.fromValue('ACTIVE'); // Status.active — runtime lookup, type-narrowed
Status.items(); // every member, in order — your dropdown options
Status.values(); // ['PENDING', 'ACTIVE', 'COMPLETED'] — your validator set
```

The dropdown options, the wire value, the label, the valid-set, the ordering — all the same object, defined once. Add a member and every one of those updates in the same instant, because they were never separate things to begin with. There's no fifth place to forget.

And it's properly typed: a function that takes `Status` rejects a member of a different enum even if the shapes look identical, and `Status.active.display` is a known string, not `string | undefined`.

## Where it really clicks: custom fields

The array form is the warm-up. The pattern earns its place when members carry actual domain data:

```typescript
const HttpError = enumeration('HttpError', {
  input: {
    notFound: { status: 404, retryable: false, display: 'Not Found' },
    rateLimited: { status: 429, retryable: true, display: 'Slow Down' },
    serverError: { status: 500, retryable: true, display: 'Server Error' },
  } as const,
});

HttpError.rateLimited.status; // 429  (typed as the literal 429)
HttpError.rateLimited.retryable; // true
```

Now "which errors should we retry?" isn't a comment or a condition scattered across handlers — it's `.retryable`, attached to the concept, readable at runtime, and impossible to forget when you add a new error. That's the quiet shift the pattern is really about: from _labeling_ values to _modeling_ them.

## It survives the boundary — and comes back as itself

Here's where a lot of "enum object" helpers stop short. The moment a value crosses a network or lands in a database, it collapses back to a string and you're decoding by hand again on the far side. Smart enums close that loop: members serialize to self-describing JSON and revive into the _same_ live instances on the other end.

```typescript
const wire = serializeSmartEnums({ status: Status.active });
// { status: { __smart_enum_type: 'Status', value: 'ACTIVE' } }

const back = reviveSmartEnums(wire, { Status });
back.status === Status.active; // true — identity preserved
back.status.equals(Status.active); // true — value-based, survives any copy
```

The same holds through a database ([revival utilities](/database/revival)) and through a full GraphQL stack — schema to resolver to Apollo cache to component — where it stays a real member the whole way ([GraphQL overview](/graphql/overview)). A value that left as `Status.active` comes back knowing it's `Status.active`, label and metadata intact.

## "Sounds like a lot." It's surprisingly little.

Three fair questions usually come up around here:

- **Bundle size** — the full API is ~600 bytes, and the package splits into [entry points](/core/guards-and-entry-points#entry-points), so importing just `enumeration` costs ~149 bytes. You pay for what you use.
- **Lock-in** — output is plain frozen objects. No runtime framework, no registry you must route everything through, no proprietary wire format (it's just JSON). Take it out and you're left with ordinary objects and strings.
- **Adopt all at once?** — no. The GraphQL serializer patch passes raw strings through untouched, and revival is opt-in per query, so you can convert one enum, one resolver, one column at a time. The [adoption guide](/guide/coming-from-enums) walks the path.

If you want the rest of the "but what about…" list, the [FAQ](/guide/faq) takes them one at a time.

## The ecosystem

Core stands alone. A small family of packages extends it across a real stack — take only what you need.

| Package                                                                       | Role                                                                       |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| [`@reharik/smart-enum`](/core/creating-enums)                                 | Core: creation, lookup, serialization, database revival, GraphQL patching. |
| [`@reharik/smart-enum-knex`](/database/knex)                                  | Wires explicit row revival into Knex's `postProcessResponse`.              |
| [`@reharik/graphql-codegen-smart-enum`](/graphql/codegen-enums)               | Generates smart-enum definitions from your schema's `enum` types.          |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](/graphql/type-policies) | Generates Apollo `typePolicies` that rehydrate enum fields from the cache. |
| [`@reharik/graphql-codegen-smart-enum-preset`](/graphql/preset)               | A codegen preset that wires the whole stack with zero per-enum config.     |

## Where to go next

- [Quick start](/guide/quick-start) — install, define one, use it. Five minutes.
- [Coming from TypeScript enums](/guide/coming-from-enums) — the incremental path, with before/after.
- [Patterns & recipes](/guide/patterns) — state machines, permissions, sort columns, error catalogs. The pattern in real use.
- [FAQ](/guide/faq) — "isn't this just X?" answered honestly.
