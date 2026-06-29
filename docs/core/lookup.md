# Lookup & subsets

## Lookup methods

Every enum object carries these methods. Return types are fully narrowed to the enum's member union.

| Method | Description |
| --- | --- |
| `fromValue(value)` | Find by wire value. **Throws** if not found. |
| `tryFromValue(value)` | Find by wire value. Returns `undefined` if not found. |
| `fromKey(key)` | Find by key. **Throws** if not found. |
| `tryFromKey(key)` | Find by key. Returns `undefined` if not found. |
| `items()` | All members as a frozen array. |
| `values()` | All wire values as an array. |
| `keys()` | All keys as an array. |

The `from*` variants throw on a miss; the `tryFrom*` variants return `undefined`. Reach for `tryFromValue` when the input is untrusted (a query param, a form value) and `fromValue` when a miss is a programming error you want surfaced loudly.

## Subsetting by a custom field

Filter an enum down to the members matching a property value. The result is a new enum-like object with its own `fromValue`, `items`, and the rest — scoped to the subset:

```typescript
import { getSubsetByProp, subsetByProp } from '@reharik/smart-enum';

const apiErrors = getSubsetByProp(AppError, 'source', 'api' as const);

apiErrors.notFound;       // same object as AppError.notFound
apiErrors.items();        // only api-source members
apiErrors.fromValue('500'); // works, scoped to the subset
// apiErrors.unauthorized → not present (its source is 'auth')
```

There's a curried form for when you want to fix the property and vary the value:

```typescript
const bySource = subsetByProp('source');
const authErrors = bySource(AppError, 'auth' as const);
```

The subset members are the **same frozen objects** as on the parent enum — identity is preserved, so `apiErrors.notFound === AppError.notFound`. That makes subsets safe to use anywhere the parent member would be.

## Comparing members

Members carry an `.equals()` method that compares by value, and an enum-level `Enum.equals(a, b)` static form:

```typescript
Status.active.equals(Status.active);        // true
Status.active.equals(Status.completed);     // false
Status.equals(Status.active, Status.active); // true (static form)
```

Within a single module this looks redundant — members are interned, so `Status.active === Status.active` is already `true`. The reason `.equals()` exists is **boundaries**. A member rebuilt from a string is a *different object*:

```typescript
const fromDb = Status.fromValue(row.status); // freshly constructed
fromDb === Status.active;        // happens to be true (same intern table)...
fromDb.equals(Status.active);    // ...but THIS is the comparison to trust
```

After data has crossed the wire and been revived, or been parsed back from a payload, you may be holding a copy whose object identity differs. `.equals()` compares the underlying value (and even matches a plain `{ key, value }` shape), so it's correct regardless of how the member was produced. The habit: use `===` for members you know are local constants, and `.equals()` for anything that might have come through transport, a cache, or the database.

## Iterating in order

`items()` returns members in definition order, and each member carries its `index`:

```typescript
Status.items().forEach(s => console.log(s.index, s.display));
// 0 Pending
// 1 Active
// 2 Completed
```

That ordering is stable and meaningful — it's the order you declared — so it's safe to drive a sorted dropdown or a stepper UI directly from `items()` without a separate sort.
