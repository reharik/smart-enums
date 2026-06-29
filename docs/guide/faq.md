# FAQ

Honest answers to the questions a skeptic asks first. If one of these is the thing keeping you out, read that one.

## Isn't this just a const object with helpers?

At the smallest scale, yes — and if all you ever need is `{ A: 'a', B: 'b' }`, use that. The pattern earns its keep when you need more than the map: iteration in a defined order, runtime lookup by value *or* key with type narrowing, per-member metadata that travels with the value, and — the part a const object can't do — surviving a round trip through JSON or a database and coming back as the same typed thing. Smart enums are what the const-object-plus-helpers approach turns into once you've written those helpers three times and want them to be correct and consistent.

## Why not the built-in TypeScript `enum`?

TS enums give you a name↔value map and stop. You can't iterate the members, attach metadata, look up by value at runtime, or narrow custom fields. They also have well-known sharp edges (numeric enums are assignable from any number; `const enum` has its own compilation caveats). A smart enum is a superset of what you actually use a TS enum for, minus the foot-guns, plus the runtime surface. See [Coming from TypeScript enums](/guide/coming-from-enums) for the migration.

## Why not a Zod enum / validation-library enum?

Different job, and they compose fine. A validation enum answers "is this incoming string one of the allowed values?" A smart enum answers that too (`tryFromValue`) but is also the thing you *use* afterward — with a label, metadata, ordering, and a stable typed identity. Validate at the edge with whatever you like, then `fromValue` into a smart enum for everything downstream. They're not competitors; one guards the door, the other furnishes the room.

## What does it cost in bundle size?

The full API is roughly 600 bytes. The package ships [separate entry points](/core/guards-and-entry-points#entry-points), so if you only call `enumeration` you import ~149 bytes and the serialization, transport, and database code never enters your bundle. There's no framework underneath — the runtime is the member objects themselves.

## Is there runtime overhead?

Members are built once, at module load, and frozen. Access (`.display`, `.status`) is a plain property read. Lookups (`fromValue`, `fromKey`) are a find over a small fixed array. There's no proxy, no getter indirection, no per-access allocation. For the sizes enums actually are — a handful to a few dozen members — it's not a thing you'll measure.

## Am I locked in?

No, and this is deliberate. The output is plain frozen objects. The wire format is ordinary JSON (`{ __smart_enum_type, value }`, or just the bare string in `value` mode). There's no central registry you're forced to route through for basic use, no runtime you have to boot. If you removed the library tomorrow, you'd be left with objects and strings, not a migration project.

## Do I have to convert my whole app at once?

No. Every boundary is built to pass plain strings through untouched, so adoption is incremental by design: the GraphQL serializer patch does `val?.value ?? val` (strings flow through), database revival is opt-in per query, and a function still typed `string` happily takes `member.value`. Convert one enum, one resolver, one column, ship it, continue. The [adoption guide](/guide/coming-from-enums#doing-it-incrementally-across-a-stack) lays out an order.

## Why is `as const` required on array input?

Because without it, TypeScript infers `string[]` for your input and every literal — your keys, your values — collapses to `string`. The whole point is literal-level types (`Status.active` is a known member, `.value` is `'ACTIVE'` not `string`), and `as const` is what preserves them. It's the one piece of ceremony the type system can't infer for you.

## What's the difference between `key`, `value`, and `display`?

Three roles for three audiences. The **`key`** is your code-facing handle — `Status.active`, camelCase, what you type. The **`value`** is the wire/storage form — `'ACTIVE'` — what goes in the database and over the network. The **`display`** is for humans — `'Active'` — what you render. Keeping them distinct is why the same member can be ergonomic in code, stable on the wire, and pretty in the UI without three separate structures.

## Does it work outside GraphQL / without a database?

Yes. Core is standalone — `enumeration`, lookup, metadata, subsetting, and serialization work in any TypeScript project, frontend or backend. The Knex, codegen, and Apollo packages are optional extensions for those specific stacks. Plenty of people use just the core for in-app enums and dropdowns.

## Will it mess with `JSON.stringify`?

Only in the way you choose. Members have a `toJSON`, and its output is controlled by [serialization mode](/core/serialization#serialization-mode): in `'value'` mode `JSON.stringify` produces the bare wire string (what most APIs and databases want); in `'wrapped'` mode it produces the self-describing object (what you want when you'll revive on the other side). You set the default once per app, typically `'value'`.

## How do I compare two members safely?

Use [`.equals()`](/core/lookup#comparing-members), not `===`, anywhere a member might have crossed a boundary. Within a single module members are interned so `===` happens to work, but a member rebuilt from a string (a DB read, a revived payload) is a different object — `equals` compares by value and gets it right regardless.

## Still not sure?

Read [Patterns & recipes](/guide/patterns). The pattern is more convincing carrying real weight than being argued about in the abstract.
