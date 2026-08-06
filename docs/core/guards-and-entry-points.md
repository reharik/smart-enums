# Type guards & entry points

## Type guards

Two guards distinguish enum objects, enum members, and everything else:

```typescript
import { isSmartEnumItem, isSmartEnum } from '@reharik/smart-enum';

isSmartEnumItem(Status.active);   // true
isSmartEnumItem({ key: 'x' });    // false (plain object)

isSmartEnum(Status);              // true  (the enum object)
isSmartEnum(Status.active);       // false (a member, not the enum)
```

`isSmartEnumItem` narrows a value to an enum **member**; `isSmartEnum` narrows to the **enum container**. Use the first when you're walking arbitrary data deciding what to serialize; use the second when you're handed something that might be an enum to iterate.

::: tip Duplicate installs are safe
The guards are **structural** — they check shape and the `__smart_enum_type` string, not a branding symbol. Members carry no symbols at all. That means a member produced by a second copy of `@reharik/smart-enum` still passes `isSmartEnumItem`, still compares `true` under `.equals()`, and is still accepted by `has()`.

This wasn't always true. Earlier versions compared symbol identity, which broke silently when two copies were installed. If you're carrying a `npm dedupe` or `syncpack` workaround for that reason, it's no longer needed on this account.
:::

## Narrowing a member's *value*

`Enum.has()` narrows an unknown value to that enum's member union — useful after revival, or when checking data you didn't produce:

```typescript
if (Status.has(input)) {
  input.display;   // narrowed to a Status member
}
```

Over a subset view, `has` narrows to just the subset's members.

## Narrowing the *object* that holds a member

`has` narrows the value you pass it. When you need the **object containing** that value narrowed instead, use `isTagged` or its curried form `taggedBy`:

```typescript
import { taggedBy } from '@reharik/smart-enum';

const isKindOf = taggedBy('kind');

if (isKindOf(notification, Channel.email)) {
  notification.to;   // narrowed to EmailNotification
}
```

The difference in one line:

```typescript
Channel.has(n.kind)          // narrows n.kind
isKindOf(n, Channel.email)   // narrows n
```

`taggedBy` fixes the property name once; `isTagged(obj, prop, member)` takes it per call. A single `taggedBy('kind')` serves every union in your codebase that discriminates on `kind`, across different enums — passing a member from the wrong enum is a compile error.

### Both branches narrow

Unlike `===` against a member, these narrow the false branch too, so an exhaustive `if` chain ends in a working `never` check:

```typescript
function priority(n: Notification): number {
  if (isKindOf(n, Channel.email)) return n.to.length;
  if (isKindOf(n, Channel.push))  return n.device.length;
  if (isKindOf(n, Channel.sms))   return n.number.length;
  const exhaustive: never = n;   // compiles — add a channel and it breaks
  return exhaustive;
}
```

That trailing `never` is your exhaustiveness check. Without it, an unhandled variant falls through silently.

### As a predicate

```typescript
const emails = all.filter((n): n is EmailNotification => isKindOf(n, Channel.email));
```

The explicit `n is EmailNotification` annotation is required — `Array.filter` won't infer a guard from a generic one.

### Which to reach for

| situation | tool |
| --- | --- |
| one branch mid-function | `isTagged` / `taggedBy` |
| filtering a collection | `isTagged` / `taggedBy` |
| every variant handled, exhaustiveness wanted | [`switchOn`](./branching.md#switchon) |
| branching on a member you hold, not an object | [`match`](./branching.md#match) |

An exhaustive `if` chain with `isTagged` and a trailing `never` is equivalent in safety to `switchOn` — pick whichever reads better. `switchOn` is an expression, so prefer `isTagged` when an arm needs an early return out of the enclosing function.

Both use the same structural comparison as `has` and `.equals()`, so they behave correctly across duplicate installs and after revival.

## Entry points

The package has multiple entry points so you only pay for what you import. Pull from the narrow ones when bundle size matters:

```typescript
// Core only — enumeration + type guards + subset helpers (~149 bytes)
import { enumeration } from '@reharik/smart-enum/core';

// Core + transport serialization/revival (~406 bytes)
import { serializeForTransport } from '@reharik/smart-enum/transport';

// Core + database serialization/revival (~379 bytes)
import { prepareForDatabase } from '@reharik/smart-enum/database';

// GraphQL serializer patching
import { patchSchemaEnumSerializers } from '@reharik/smart-enum/graphql';

// Everything (~598 bytes)
import {
  enumeration,
  serializeSmartEnums,
  prepareForDatabase,
} from '@reharik/smart-enum';
```

| Entry point | Surface |
| --- | --- |
| `@reharik/smart-enum/core` | `enumeration`, type guards, subset helpers, `isTagged` / `taggedBy` |
| `@reharik/smart-enum/transport` | transport serialization & revival, global registry |
| `@reharik/smart-enum/database` | `prepareForDatabase`, row/payload revival |
| `@reharik/smart-enum/graphql` | `patchSchemaEnumSerializers` |
| `@reharik/smart-enum` | everything, re-exported |
