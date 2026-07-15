# Matching, subsets, and guards

Three capabilities that build on smart-enum's core promise — that each member is a
real, distinct value the compiler understands: exhaustive `match`, key-list subsets
with `pickEnum`, and narrowing type guards.

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

### Arms are keyed by member key

The handler keys are the member keys (`comment`, `mediaItem`) — the same names you
use to reach members off the enum (`EntityType.comment`), not the wire value
(`COMMENT`). Handlers receive the fully-narrowed item, so inside the `comment` arm
the argument is known to be the comment member.

### Add a member, get a compile error

Add `EntityType.album` to the enum and every `match` that doesn't handle it turns
red until you add an `album:` arm. The bug that used to surface as a runtime throw
on an unexpected event now surfaces in your editor.

```ts
// Now a compile error — `album` arm required:
event.targetType.match({
  comment: () => /* ... */,
  mediaItem: () => /* ... */,
  // Property 'album' is missing
});
```

### The runtime guard

`match` still throws if it's handed a value with no matching handler — the case
static types can't cover, like a deserialized value that lied about its shape. That
guard is inside `match`; you never write it yourself.

### Mixed returns and async

The return type unifies across arms. Arms returning different types widen the
result to their union; `async` arms make `match` return a `Promise`, which you
`await` once around the whole expression.

## `pickEnum` — a subset by key list

`pickEnum` produces an enum-like **view** over an explicit list of members. It does
not clone anything — the picked members are the *same* item references as the
parent, so identity, `equals`, and serialization all carry over untouched. The
subset-ness lives in the types and a scoped method set, never on the wire.

```ts
const CommentTarget = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

CommentTarget.comment === EntityType.comment; // true — same reference
CommentTarget.items();                        // just the two picked members
CommentTarget.fromValue('COMMENT');           // the comment member
CommentTarget.fromValue('USER');              // throws — outside the subset
```

::: warning Keep `as const` on the key list
Without `as const`, the key array widens to `string[]`, the subset type collapses,
and the view stops restricting — it compiles but guards nothing.
:::

### The subset is a real discriminated union

The picked members form a discriminated union with exactly those members. An
unpicked member is not assignable to it, and a typo in the key list is a compile
error:

```ts
type Target = ReturnType<typeof CommentTarget.items>[number];

const a: Target = EntityType.comment;   // ok
const b: Target = EntityType.album;     // compile error — not in the subset

pickEnum(EntityType, ['commnet']);      // compile error — not a member key
```

### Composes with `match`

Because a picked value's type carries only the picked members, calling `match` on
it is exhaustive over *just those members*. `pickEnum` narrows the type; `match`
consumes it completely.

```ts
const target: Target = /* ... */;
target.match({
  comment: () => /* ... */,
  mediaItem: () => /* ... */,
  // exhaustive with two arms — no `album`, no `else`
});
```

### The revival boundary

The subset's own `fromValue` revives a wire value **and** rejects anything outside
the subset in a single call — serialized-shape check and membership check collapsed
into the enum's own parser. That's the clean deserialization boundary for
narrowly-typed fields.

### `pickEnum` vs `getSubsetByProp`

Both produce subset views. `getSubsetByProp` selects members that *share a property
value*; `pickEnum` selects an *explicit list of members*. Reach for `pickEnum` when
the subset is hand-picked rather than defined by a common property.

## Narrowing guards

Two guards now return type predicates instead of bare booleans — same runtime,
added narrowing.

### `isSmartEnum`

Narrows an unknown value to the enum-container type, so its methods are available
inside the guard:

```ts
if (isSmartEnum(x)) {
  x.items();          // available — x is narrowed to the enum
}
```

### `equals`

`equals` now narrows, which makes `if`-chains exhaustive without `match` — useful at
sites `match` doesn't cover:

```ts
function label(t: typeof EntityType.comment | typeof EntityType.mediaItem) {
  if (t.equals(EntityType.comment)) return 'a comment';
  if (t.equals(EntityType.mediaItem)) return 'a media item';
  return assertUnreachable(t); // compiles — nothing left
}
```

One consequence worth knowing: comparing items from two *different* enums
(`someColor.equals(someEntityType)`) is now a compile error. That comparison is
always `false` — a bug the types will now catch for you.
