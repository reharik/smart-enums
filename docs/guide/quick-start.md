# Quick start

## Install

```bash
npm install @reharik/smart-enum
```

## Define an enum

The simplest form is an `as const` array. Keys are the array values, wire values are auto-derived as `CONSTANT_CASE`, and display strings as `Title Case`.

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;
```

::: tip `as const` is required on array inputs
Without it, TypeScript widens the type to `string[]` and you lose literal inference on keys and values.
:::

The first argument — `'Status'` — is the enum's **identity string**. It's used for serialization (`__smart_enum_type`) and must be unique across your app. By convention, keep it matching the variable name. See [the identity string](/core/serialization#the-identity-string) for details.

## Use it

```typescript
// Member access
Status.active;
// { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }

Status.active.display; // 'Active'
Status.active.value;   // 'ACTIVE'

// Lookup
Status.fromValue('ACTIVE');    // Status.active (throws if not found)
Status.tryFromValue('NOPE');   // undefined

// Iterate
Status.items();  // all members, frozen array
Status.values(); // ['PENDING', 'ACTIVE', 'COMPLETED']
Status.keys();   // ['pending', 'active', 'completed']
```

## Where to go next

- Need custom values, display strings, or extra fields per member? → [Creating enums](/core/creating-enums)
- Sending enums over the wire or storing them in a database? → [Serialization & transport](/core/serialization) and [Database revival](/database/revival)
- Running a GraphQL stack? → [GraphQL overview](/graphql/overview)
