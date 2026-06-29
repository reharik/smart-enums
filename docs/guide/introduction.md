# Introduction

`@reharik/smart-enum` is a type-safe, feature-rich enumeration construct for TypeScript. Every enum member is a frozen object carrying a key, a wire value, a display string, an index, and whatever custom fields you want — with lookup, iteration, serialization, and database revival built in.

## Why not just use TypeScript enums?

TypeScript's built-in `enum` gives you a name-to-value mapping and nothing else. You can't iterate members, attach metadata, look up by value at runtime, or serialize and revive across a network boundary without writing boilerplate every time.

The usual workarounds each solve one piece and leave the rest:

- **Plain objects** (`{ ACTIVE: 'active' }`) — no iteration, no type narrowing, no metadata, and text gets duplicated.
- **String unions** (`type Status = 'active' | 'inactive'`) — compile-time only. No runtime lookup, no `.display`, no `.items()`.
- **`as const` arrays** (`['active', 'inactive'] as const`) — iterable, but no keyed access and no metadata.
- **Scattered constants** (`const ME = 'me'`) — hard to find and hard to iterate.

Smart enums give you all of it in one construct:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;

Status.active;
// { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }

Status.fromValue('ACTIVE'); // Status.active
Status.tryFromValue('NOPE'); // undefined
Status.items(); // all members as a frozen array
Status.values(); // ['PENDING', 'ACTIVE', 'COMPLETED']
Status.keys(); // ['pending', 'active', 'completed']
```

Type safety works the way you'd expect — a function that takes `Status` won't accept a member from a different enum, even if the shapes look similar.

## The ecosystem

The core library stands on its own, but a small family of packages extends it to a full GraphQL + database stack. You adopt only the pieces you need.

| Package | Role |
| --- | --- |
| [`@reharik/smart-enum`](/core/creating-enums) | Core: enum creation, lookup, serialization, database revival, GraphQL serializer patching. |
| [`@reharik/smart-enum-knex`](/database/knex) | Wires explicit row revival into Knex's `postProcessResponse`. |
| [`@reharik/graphql-codegen-smart-enum`](/graphql/codegen-enums) | Generates smart-enum definitions from your schema's `enum` types. |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](/graphql/type-policies) | Generates Apollo `typePolicies` that rehydrate enum fields from the cache. |
| [`@reharik/graphql-codegen-smart-enum-preset`](/graphql/preset) | A codegen preset that orchestrates all of the above with zero per-enum config. |

If you only want better enums in a plain TypeScript project, the [core library](/core/creating-enums) is all you need. If you're running a GraphQL stack and want enum instances to flow unbroken from schema to resolver to cache to component, the [GraphQL overview](/graphql/overview) is the place to start.

## Next steps

- [Quick start](/guide/quick-start) — install, define an enum, use it.
- [Creating enums](/core/creating-enums) — array form, object form, custom fields, custom formatters.
- [GraphQL overview](/graphql/overview) — the end-to-end picture.
