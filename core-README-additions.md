<!--
  ADDITIVE README SECTION — paste into packages/core/README.md.
  Does not replace existing content; drop it in after the current feature
  highlights (or wherever new-feature callouts belong).
-->

## Exhaustive `match`

Branch on an enum member and return a value — the compiler forces you to cover
every case. No `let`, no `else`, no `assertUnreachable`.

```ts
const recipientId = await event.targetType.match({
  comment:   () => commentRepo.getById(event.targetId).then(c => c.authorId),
  mediaItem: () => mediaRepo.getById(event.targetId).then(m => m.ownerId),
});
```

Add a member to the enum and every `match` missing an arm turns red — a runtime
surprise becomes a compile error. A runtime guard still catches values that lied
about their shape on the wire.

## `pickEnum` — subsets without cloning

Carve a smaller enum out of a bigger one by naming the members. The picked members
are the *same* references as the parent, so identity, `equals`, and serialization
all just work.

```ts
const CommentTarget = pickEnum(EntityType, ['comment', 'mediaItem'] as const);

CommentTarget.comment === EntityType.comment; // true
CommentTarget.fromValue('USER');              // throws — outside the subset
```

The subset is a real discriminated union — an unpicked member won't type-check, and
it composes with `match` so a picked value is exhaustive over just its members.

→ Full guide: matching, subsets, and guards.
