---
layout: home

hero:
  name: smart-enum
  text: Enums that carry their whole concept
  tagline: A constant is rarely just a string — it usually has a human label, a stored value, an order, often a little metadata. Smart enums keep all of it on one typed object, intact from the database to the dropdown.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Five-minute quick start
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/reharik/smart-enums

features:
  - title: One object, not four artifacts
    details: The union, the labels map, the options array, the validator — folded into a single definition that can't drift out of sync.
    link: /guide/introduction
    linkText: Why it matters
  - title: Metadata that travels with the value
    details: Attach an HTTP status, a SQL column, allowed transitions — and read them off the member at runtime instead of a parallel lookup table.
    link: /guide/patterns
    linkText: See the patterns
  - title: Runtime lookup, type-narrowed
    details: fromValue and fromKey (with try-variants), all narrowed to the enum's own members. The hand-written validators and guards go away.
    link: /core/lookup
    linkText: Lookup & subsets
  - title: Survives the boundary
    details: Serialize to JSON, store in Postgres, send through GraphQL — members revive into the same typed instances on the far side, and equal themselves.
    link: /core/serialization
    linkText: Serialization
  - title: GraphQL, end to end
    details: Generate definitions from your schema, rehydrate the Apollo cache, type resolvers and operations — wired with one preset, zero per-enum config.
    link: /graphql/overview
    linkText: The GraphQL story
  - title: Tiny and lock-in-free
    details: ~600 bytes full, ~149 for just enumeration via separate entry points. Output is plain frozen objects and ordinary JSON. Rip it out anytime.
    link: /core/guards-and-entry-points
    linkText: Entry points
---

## Does this sound familiar?

You add one value to a fixed set — a new plan, a new role, a new category. Now the database migration, the labels map, the dropdown options, the validator, and a couple of `if` statements all have to know about it. None of them were ever connected, so it's on you to remember each one, and the day you miss one the bug ships. That's not carelessness — the language handed you a bare string, so the concept scattered.

Defining one of those values the usual way already costs a line or three — and you still build the label, the options list, and the validator by hand, separately. A smart enum's entire definition is **three lines plus a one-line type alias**, and the label, lookup, options, and valid-set all come with it:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Priority = enumeration('Priority', {
  input: ['low', 'medium', 'high'] as const,
});
type Priority = Enumeration<typeof Priority>;
```

And that one definition *is* the label, the lookup, the options, and the valid-set — here's everything it hands you:

```typescript
Priority.high;              // { key: 'high', value: 'HIGH', display: 'High', index: 2 }
Priority.high.display;      // 'High'              — the label, no separate map
Priority.fromValue('HIGH'); // Priority.high       — runtime lookup, type-narrowed
Priority.items();           // [low, medium, high] — your dropdown options, in order
Priority.values();          // ['LOW','MEDIUM','HIGH'] — your validator set
```

One short definition in; the whole concept out. [Read the full idea →](/guide/introduction)
