# Coming from TypeScript enums

You don't adopt smart enums by rewriting your app. You adopt them one concept at a time, and the rest of the codebase doesn't notice. This page shows the migrations for the three shapes you almost certainly have today, and how to do them without a flag day.

## The guiding fact

A smart enum member's **wire value** is just a string. `Status.active.value` is `'ACTIVE'`. So at every boundary that already speaks strings — function arguments, JSON, the database, a `<select>` — a smart enum can stand in for the string you have now. That's what makes the migration incremental: you upgrade the *definition* and the places that benefit, and everything still talking in strings keeps working through `.value` and `fromValue`.

## From a TypeScript `enum`

```typescript
// Before
enum Status {
  Pending = 'PENDING',
  Active = 'ACTIVE',
  Completed = 'COMPLETED',
}
```

```typescript
// After
const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;
```

The wire values match (`constantCase` of the key gives `'ACTIVE'`), so stored data and API payloads are unchanged. What you gain immediately: `Status.items()` for iteration, `Status.fromValue(str)` for the lookups you were writing by hand, and `.display` instead of a separate labels map.

Call sites that did `Status.Active` become `Status.active`; anywhere you were passing the string `'ACTIVE'` can stay a string or become `Status.active.value` — both reach the wire identically.

## From a union + labels map

This is the most common hand-rolled pattern, and the one smart enums most directly replace:

```typescript
// Before — three artifacts, kept in sync by hand
type Priority = 'low' | 'medium' | 'high';

const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const PRIORITY_OPTIONS: Priority[] = ['low', 'medium', 'high'];
```

```typescript
// After — one artifact
const Priority = enumeration('Priority', {
  input: {
    low:    { display: 'Low' },
    medium: { display: 'Medium' },
    high:   { display: 'High' },
  } as const,
});
type Priority = Enumeration<typeof Priority>;
```

`PRIORITY_LABELS[p]` becomes `p.display`. `PRIORITY_OPTIONS` becomes `Priority.items()`. The two satellite objects that used to drift out of sync are gone, folded into the one definition. Add `urgent` once and the label and the options list both have it.

## From a "constants + validator" object

```typescript
// Before
const Roles = { ADMIN: 'admin', EDITOR: 'editor', VIEWER: 'viewer' } as const;
type Role = (typeof Roles)[keyof typeof Roles];

function isRole(x: string): x is Role {
  return Object.values(Roles).includes(x as Role);
}
```

```typescript
// After
const Role = enumeration('Role', {
  input: ['admin', 'editor', 'viewer'] as const,
});
type Role = Enumeration<typeof Role>;
```

The hand-written guard disappears: `Role.tryFromValue(x)` returns the member or `undefined`, which is both your validation and your lookup in one call. `Role.values()` is your allow-list.

## Doing it incrementally across a stack

You do not have to convert everything before anything works. The seams are designed to pass plain strings through:

- **Function boundaries** — a function typed to take `Status` accepts members; one still taking `string` accepts `member.value`. You can migrate signatures one at a time.
- **GraphQL** — `patchSchemaEnumSerializers` does `val?.value ?? val`, so a resolver returning `Status.active` and one still returning `'ACTIVE'` both serialize correctly. Patch the schema once, then convert resolvers whenever. See the [GraphQL overview](/graphql/overview).
- **Database** — revival is opt-in per query. Rows you haven't mapped come back as strings, exactly as before; map a column when you want members from it. See [revival utilities](/database/revival).
- **The schema-first shortcut** — if your enums originate in a GraphQL schema, skip the hand-conversion entirely: [codegen](/graphql/codegen-enums) generates the definitions and keeps them in lockstep with the schema.

A realistic order: convert one enum definition, switch its most annoying call sites (the labels lookup, the options list), patch your GraphQL schema if you have one, then let the rest migrate opportunistically. Nothing forces a big-bang.

## What to watch for

- **`as const` on array input** — without it TypeScript widens to `string[]` and you lose literal inference. The compiler will let you forget; the types will quietly go vague. (Object input doesn't need it on the outer shape but does on the values.)
- **Key casing** — keys are the camelCase handles (`inReview`), wire values default to `CONSTANT_CASE` (`IN_REVIEW`). If your existing stored values aren't constant-case, set them explicitly with object input (`{ value: 'in-review' }`) so the wire format matches what's already in your database.
- **The identity string** must be stable across serialize/revive. Keep it matching the variable name; codegen handles this for you. See [the identity string](/core/serialization#the-identity-string).

## Next

- [Patterns & recipes](/guide/patterns) — what the pattern buys you once it's in.
- [Creating enums](/core/creating-enums) — the full input forms and custom fields.
