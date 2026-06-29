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
