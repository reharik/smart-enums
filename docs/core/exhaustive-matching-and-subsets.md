# Matching, subsets, and guards

Three capabilities that build on smart-enum's core promise — that each member is a
real, distinct value the compiler understands: exhaustive `match`, member subsets,
and narrowing type guards.

## `match` — exhaustive branch on a member

`match` is the enum twin of a `switch` the compiler forces you to cover completely.
You give it one handler per member; it runs the one matching the value and returns
the result. Miss a member and it will not compile.

```ts
const recipientId = await event.targetType.match({
  comment: async () => {
    const comment = await commentRepo.getById(event.targetId);
    return comment.authorId;
  },
  mediaItem: async () => {
    const mediaItem = await mediaRepo.getById(event.targetId);
    return mediaItem.ownerId;
  },
});
```

Three things this replaces, all at once: the mutable `let` waiting to be assigned,
the `if / else if / else` ladder, and the `assertUnreachable(x)` in the final branch.
`match` returns a value, so you assign from it directly with `const`. The
exhaustiveness guarantee that `assertUnreachable` gave you at runtime is now a
compile-time one — baked into `match`'s type.

`match` is a method on each **member**, not on the enum object. You call it on a
value (`event.targetType.match(...)`), never on the enum itself (`EntityType.match`
does not exist — the enum is the container, `match` lives on its members).

### Arms are keyed by member key

The handler keys are the member keys (`comment`, `mediaItem`) — the same names you
use to reach members off the enum (`EntityType.comment`), not the wire value
(`COMMENT`). Handlers receive the fully-narrowed item, so inside the `comment` arm
the argument is known to be the comment member.

### Add a member, get a compile error

Add `EntityType.album` to the enum and every `match` that doesn't handle it turns
red until you add an `album:` arm. The bug that used to surface as a runtime throw
on an unexpected event now surfaces in your editor.

### Missing and extra arms both fail

Exhaustiveness runs in both directions — the handlers must match the possible
members _exactly_:

- **Miss a member** → a _missing property_ error. You forgot a case that can occur.
- **Handle a member that can't occur** — e.g. an `album:` arm on a value narrowed to
  `comment | mediaItem` — → an _excess property_ error: `'album' does not exist in
type …`. Read that as "you're handling a case that can't happen here," and delete
  the arm. (It's the standard object-literal excess-property message; on a `match` it
  means one arm too many, not one too few.)

### The runtime guard

`match` still throws if it's handed a value with no matching handler — the case
static types can't cover, like a deserialized value that lied about its shape. That
guard is inside `match`; you never write it yourself.

### Mixed returns and async

The return type unifies across arms. Arms returning different types widen the
result to their union; `async` arms make `match` return a `Promise`, which you
`await` once around the whole expression.

## Subsetting

Often you want a value restricted to _some_ of an enum's members — a field that only
holds `comment` or `mediaItem`, never the other three. You do **not** need to declare
a second enum for this. There are two tools, for two different jobs, and picking the
right one is almost always the whole difficulty.

::: tip The distinction that matters: container vs member, value vs type
An enum is really two things. The **container** is the enum object itself
(`EntityType`) — it carries `fromValue`, `fromKey`, `items()`. A **member** is one
value in it (`EntityType.comment`) — it carries `key`, `value`, `display`, `match`,
`equals`.

Your full enum already leans on this: the **value** `EntityType` is the container,
and the **type** `EntityType` (from `Enumeration<typeof EntityType>`) is the member
union. Subsets follow the same split:

- **Typing a field, calling `match`, narrowing** → you want a **member** type →
  `EnumSubset`.
- **Calling `fromValue`, iterating, validating raw input** → you want a **container**
  value → `pickEnum`.

`match` is on members; `fromValue` is on the container. When an error says a method
"does not exist," you're almost always holding the container where you wanted a
member, or the reverse.
:::

### Type-level: `EnumSubset`

`EnumSubset<Members, Keys>` narrows an enum's member union to the named members. It's
a pure type — no runtime, nothing declared — derived from the superset, so it tracks
it. This is what a field annotation wants:

```ts
import { type EnumSubset } from '@reharik/smart-enum';

type EntityType = Enumeration<typeof EntityType>;
type ReactionTarget = EnumSubset<EntityType, 'comment' | 'mediaItem'>;

interface ReactionAdded {
  kind: 'reactionAdded';
  targetType: ReactionTarget; // only comment | mediaItem
}
```

You fill it with the **parent's own members** — no conversion, no wrapper — and the
compiler rejects the rest:

```ts
const ok: ReactionTarget = EntityType.comment; // fine
const no: ReactionTarget = EntityType.notification; // compile error — not in the subset
```

The subset is a real discriminated union, so `match` over it is exhaustive with
exactly those members, and a typo in the key list is a compile error:

```ts
declare const t: ReactionTarget;
t.match({
  comment: () => /* ... */,
  mediaItem: () => /* ... */,
  // exhaustive with two arms — no `album`, no `else`
});

type Oops = EnumSubset<EntityType, 'commnet'>;   // compile error — not a member key
```

#### Selecting by include or exclude

The second argument is a **selector**. A bare key union is the common form — it
_includes_ those members — but you can also pass an explicit `{ include }`, or, to
keep everything _but_ a few, `{ exclude }`:

```ts
type ReactionTarget = EnumSubset<EntityType, 'comment' | 'mediaItem'>; // bare = include
type Same = EnumSubset<EntityType, { include: 'comment' | 'mediaItem' }>;
type NonAlbum = EnumSubset<EntityType, { exclude: 'album' }>; // everything except album
```

`{ exclude }` is the type-level twin of `omitEnum` below: you name the members to
drop and the rest follow the parent, so adding a member to the enum widens the
subset automatically instead of quietly leaving it behind. Keys are checked either
way — a typo in an `include` or `exclude` list is the same compile error as above.

For most subset needs — typing DTO fields, restricting a parameter, branching with
`match` — `EnumSubset` is the entire answer. The values flowing through are already
the parent's members, so a member type is exactly what fits them.

### Runtime: `pickEnum`

When the subset needs to _do_ something at runtime — its own `fromValue`, its own
`items()` — reach for `pickEnum`. It builds an enum-like **view** over the members
you name. It does not clone: the picked members are the _same_ instances as the
parent, so identity, `equals`, and serialization all carry over.

```ts
const ReactionTarget = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

ReactionTarget.comment === EntityType.comment; // true — same reference
ReactionTarget.items(); // just the two picked members
ReactionTarget.fromValue('COMMENT'); // the comment member
ReactionTarget.fromValue('NOTIFICATION'); // throws — outside the subset
```

::: warning Keep `as const` on the key list
Without `as const`, the key array widens to `string[]`, the subset type collapses,
and the view stops restricting — it compiles but guards nothing.
:::

Because `pickEnum` reuses the parent's instances, a picked member serializes with the
**parent's** type name (`{ __smart_enum_type: 'EntityType', value: 'COMMENT' }`), not
a new one. It is _not_ a separate enum — a fresh `enumeration('ReactionTarget', …)`
would mint new objects with a different wire encoding that no longer round-trip as
`EntityType`. `pickEnum` stays a view onto the one source of truth.

A `pickEnum` result is a value, so it follows the same companion pattern as any enum
— define it once at module scope, and derive its member type from it:

```ts
const ReactionTarget = pickEnum(EntityType, ['comment', 'mediaItem'] as const);
type ReactionTarget = Enumeration<typeof ReactionTarget>; // member union
```

Writing the key list once, here, keeps the value and type from ever disagreeing.

### The revival boundary

That runtime container is the point of `pickEnum`: its `fromValue` revives a wire
value **and** rejects anything outside the subset in a single call —
serialized-shape check and membership check collapsed into the enum's own parser.
That's the clean deserialization boundary for a narrowly-typed field, where a raw
string arrives and you want "revive it, but only if it's one of these two."

### Start type-only, promote later

`EnumSubset<EntityType, K>` and the member type of `pickEnum(EntityType, [K])`
describe the **same members**. So you can annotate everything with `EnumSubset`
today, and the day one subset needs a runtime container, add the `pickEnum` value
without touching a single field annotation. The type-only form is the low-cost
default; the container is a cheap upgrade when a runtime need actually shows up.

### `pickEnum` vs `getSubsetByProp`

Both build runtime subset views. `getSubsetByProp` selects members that _share a
property value_; `pickEnum` selects an _explicit list of members_. Reach for
`pickEnum` when the subset is hand-picked rather than defined by a common property.

### Runtime inverse: `omitEnum`

`omitEnum` is `pickEnum` turned around: it builds the same enum-like view, but from
every member _except_ the ones you name. Reach for it when dropping one or two
members is shorter than listing all the ones you keep. Like `pickEnum`, it reuses
the parent's instances — so identity, `equals`, and serialization carry over — and
it preserves the parent's declaration order.

```ts
const NonAlbum = omitEnum(EntityType, ['album'] as const);

NonAlbum.comment === EntityType.comment; // true — same reference
NonAlbum.items(); // every member except album
NonAlbum.fromValue('ALBUM'); // throws — outside the subset
```

The same `as const` rule applies — without it the key list widens to `string[]` and
the view stops restricting. `omitEnum` is to `pickEnum` what
`EnumSubset<…, { exclude }>` is to `EnumSubset<…, { include }>`: the complement, for
when the short list is the one you're removing.

## Narrowing guards

Two guards return type predicates instead of bare booleans — same runtime, added
narrowing.

### `isSmartEnum`

Narrows an unknown value to the enum-container type, so its methods are available
inside the guard:

```ts
if (isSmartEnum(x)) {
  x.items(); // available — x is narrowed to the enum
}
```

### `equals`

`equals` now narrows, which makes `if`-chains exhaustive without `match` — useful at
sites `match` doesn't cover:

```ts
function label(t: EnumSubset<EntityType, 'comment' | 'mediaItem'>) {
  if (t.equals(EntityType.comment)) return 'a comment';
  if (t.equals(EntityType.mediaItem)) return 'a media item';
  return assertUnreachable(t); // compiles — nothing left
}
```

Each `equals` check peels one member off the union, so the trailing branch reaches
`never` and `assertUnreachable` compiles — the same exhaustiveness `match` gives you,
available in an ordinary `if`-chain.

Comparing members of two _different_ enums is a compile error. Each enum's members
carry their own brand, so a cross-enum comparison doesn't type-check:

```ts
Status.active.equals(Color.red); // compile error — different enums
```

That comparison is always `false` at runtime — it was a bug the types couldn't see
before, and now catch for you. Same-enum comparisons are unaffected.
