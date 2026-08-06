# Branching & narrowing

Two methods branch on an enum, and which one you want depends on where the data lives.

**Whatever you hand it comes back narrowed.**

- hand it a member → [`match`](#match) → the arms get the member
- hand it an object → [`switchOn`](#switchon) → the arms get the object's variant

The practical test: *do the arm bodies read fields off the object?* If yes, the object goes in the call.

## Why not just use `switch`?

Because it doesn't work, and it fails quietly:

```typescript
switch (notification.kind) {
  case Channel.email:
    notification.to;   // ✗ `notification` was never narrowed
}
```

TypeScript narrows an object by a discriminant property **only when that property's type is a unit type** — a string, number, or boolean literal, an enum literal, or a `unique symbol`. An enum member is an object type, so it can never be a discriminant. The property narrows; the object holding it does not.

Worse, that `switch` compiles and checks nothing. Add a fourth channel and it silently falls through to `default`.

::: details Things that look like they should work, and don't
Each of these was tested against TypeScript 5.8 and 7.0. None narrow the containing object. If you find yourself reaching for one, stop.

- **Branded literals** — `'EMAIL' & Brand<'Channel'>`. An intersection isn't a unit type, so the discriminant gate rejects it.
- **Nested paths** — `notification.kind.value === 'EMAIL'`. TypeScript has no nested discriminants.
- **A type predicate on the property** — `isEmail(notification.kind)`. This doesn't narrow the parent even for a plain string discriminant. It isn't a language feature.
- **`has` on the property** — `Channel.has(notification.kind)` narrows the property to the member union, which discriminates nothing.

A `unique symbol` *is* a valid discriminant, but it can only originate from a `const` declaration, so a generic factory like `enumeration()` can't produce one — and symbols don't serialize, ruling them out at any wire boundary.
:::

This is a checker-level constraint, not a gap in the library. `match` and `switchOn` sidestep control-flow narrowing entirely.

## match

Exhaustive branch on **a member you already hold**. The arms receive the narrowed member.

```typescript
channel.match({
  email: m => m.maxRetries,
  push:  m => m.ttlSeconds,
  sms:   m => m.segments,
});
```

One arm per member, checked at compile time. Miss one and it won't compile.

### Per-member fields

This is where narrowing the member earns its keep. When members carry differently-shaped data, each arm sees only its own member's fields:

```typescript
const NotifChannel = enumeration('NotifChannel', {
  input: {
    email: { template: 'welcome-email', maxRetries: 3, from: 'no-reply@x.com' },
    push:  { badge: true, ttlSeconds: 600 },
    sms:   { segments: 2 },
  },
});

const cost = (c: ChannelItem) => c.match({
  email: m => m.maxRetries * 2,   // only exists on email
  push:  m => m.ttlSeconds,       // only exists on push
  sms:   m => m.segments,
});
```

`m.segments` in the `email` arm is a compile error.

### Arms follow the receiver

The required arm set comes from the *statically known* type of the receiver, not from the whole enum. A widened member needs every arm; a concrete member needs only its own, and listing others is an error:

```typescript
declare const c: ChannelItem;                  // email | push | sms
c.match({ email: …, push: …, sms: … });        // all three required

NotifChannel.email.match({ email: m => m.display });   // one arm
```

Over a [subset view](./lookup.md#subsetting-by-a-custom-field) the arms are exhaustive over just the picked members.

### Closing over the containing object

An arm can reference an object from the enclosing scope, but that object is **not** narrowed:

```typescript
// ✗ Property 'body' does not exist on type 'Activity'
a.kind.match({
  commentPosted: () => a.body,
});
```

This fails loudly with a precise error, so it won't slip past you. If the object doesn't vary — one shape, only the member differs — closing over it is fine, because there's nothing to narrow:

```typescript
const render = (n: Notification) => n.channel.match({
  email: m => `${m.from} → ${n.recipientId}`,
  push:  m => `badge=${m.badge} → ${n.recipientId}`,
  sms:   m => `${m.segments} segments → ${n.recipientId}`,
});
```

If the object varies by member, that's `switchOn`.

## switchOn

Exhaustive branch on the **object holding a member** — narrows that object into its variant.

```typescript
Channel.switchOn(notification, 'kind', {
  email: v => sendEmail(v.to),
  push:  v => sendPush(v.device),
  sms:   v => sendSms(v.number),
});
```

Each arm receives the narrowed variant, so `v.to` exists in the `email` arm and nowhere else. Miss an arm and it won't compile. Inside an arm, `v.kind` is still the exact member, so per-member extras are available alongside the narrowed variant.

| parameter | |
| --- | --- |
| `obj` | The object whose variant you want narrowed. |
| `prop` | The property holding the member. Completion lists only keys holding a member of *this* enum. |
| `handlers` | One arm per member key present in the union. Missing or unknown arms are compile errors. |

Returns whatever the matching arm returns. Throws at runtime if `prop` doesn't hold a member, or no arm matches. Available on every enum from `enumeration()`, and on subset views — where the required arms narrow to just the subset's members.

### Shaping the union

`switchOn` narrows a **union**. Each variant needs the discriminant property typed as one specific member. Interfaces work well, since an extending interface may re-declare an inherited property more narrowly:

```typescript
export const Channel = enumeration('Channel', { input: ['email', 'push', 'sms'] });
type ChannelItem = SmartEnumMemberUnion<typeof Channel>;

interface NotificationFields {
  id: string;
  recipientId: string;
  kind: ChannelItem;
}

interface EmailNotification extends NotificationFields { kind: typeof Channel.email; to: string }
interface PushNotification  extends NotificationFields { kind: typeof Channel.push;  device: string }
interface SmsNotification   extends NotificationFields { kind: typeof Channel.sms;   number: string }

// the union gets the good name — this is what functions take
export type Notification = EmailNotification | PushNotification | SmsNotification;
```

Shared fields still read straight off the union without narrowing:

```typescript
const label = (n: Notification) => `${n.id} ${n.recipientId} ${n.kind.display}`;
```

### Single-shape objects

If only the member varies and the object has one shape, `switchOn` still works — the arms receive the object as-is, since there's nothing to narrow:

```typescript
interface Notification { id: string; recipientId: string; channel: ChannelItem }

const render = (n: Notification) => Channel.switchOn(n, 'channel', {
  email: v => `${v.recipientId} via email`,
  push:  v => `${v.id} push`,
  sms:   v => `${v.recipientId} sms`,
});
```

You still get exhaustiveness. `match` is equally correct here and reads a little lighter — prefer it when the arm bodies don't need the object.

## Common mistakes

::: danger These fail silently
The first two **compile**. The arms are typed `never`, so the code does nothing and nothing turns red. If arms are behaving as though they receive nothing, check these first.
:::

### Passing the base type instead of the union

```typescript
// ✗ arms are `never`
const send = (n: NotificationFields) => Channel.switchOn(n, 'kind', { /* … */ });

// ✓
const send = (n: Notification) => Channel.switchOn(n, 'kind', { /* … */ });
```

TypeScript narrowing is *union filtering* — it removes constituents. A base interface isn't a union, so there's nothing to filter and no route to the subtypes. Not specific to smart enums; a plain string discriminant hits the same wall.

Name the **union** `Notification` and give the base a duller name. The base is an implementation detail; the union is what functions take.

### A base type whose tag is the whole member union

```typescript
// ✗ every variant's `kind` is the entire union — nothing to discriminate on
interface Activity { id: string; kind: ActivityKindItem }
type CommentPosted = Activity & { body: string };
type MediaUploaded = Activity & { count: number };
```

Narrow the tag in each variant instead — re-declare it in an extending interface as shown above, or use a generic base:

```typescript
type ActivityBase<K extends ActivityKindItem> = { id: string; kind: K };
type CommentPosted = ActivityBase<typeof ActivityKind.commentPosted> & { body: string };
```

### Reaching for `match` when you need the object

Covered above — this one errors loudly, so it costs you a minute rather than an afternoon.

## Choosing

| where the payload lives | tool |
| --- | --- |
| on the member (per-member extras) | [`match`](#match) |
| on the object (per-variant fields) | [`switchOn`](#switchon) |
| neither — one shape, you just need to branch | either; `match` reads lighter |
| single branch mid-function, no exhaustiveness needed | [`isTagged` / `taggedBy`](./guards-and-entry-points.md#narrowing-the-object-that-holds-a-member) |

### What about a string union?

You can get native `switch` narrowing by tagging with a member's `.value` instead of the member itself. That's the right choice at a wire or persistence boundary where the value genuinely travels as a string — see [Precise lookup by literal value](./lookup.md#precise-lookup-by-literal-value).

It isn't a general recommendation. Inside your own code the member is worth keeping: it carries `display`, custom fields, and identity that survives revival and duplicate installs. `match` and `switchOn` both give you exhaustiveness without giving that up.
