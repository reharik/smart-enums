# Creating enums

Every enum is created with `enumeration(name, { input })`. The `input` shape decides how much metadata each member carries.

## From an array

The simplest form. Keys are the array values; wire values are auto-derived as `CONSTANT_CASE`, display strings as `Title Case`.

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Color = enumeration('Color', {
  input: ['red', 'blue', 'green'] as const,
});
type Color = Enumeration<typeof Color>;

Color.red.key;     // 'red'
Color.red.value;   // 'RED'
Color.red.display; // 'Red'
Color.red.index;   // 0
```

::: warning `as const` is required
Without it, TypeScript widens the type to `string[]` and you lose literal inference on keys and values.
:::

## From an object

When you need custom values, display strings, or extra fields per member:

```typescript
const Priority = enumeration('Priority', {
  input: {
    low: { display: 'Low Priority' },
    medium: { display: 'Medium Priority' },
    high: { value: 'P1', display: 'High Priority' },
    urgent: { value: 'P0', display: 'Urgent!!!' },
  } as const,
});
type Priority = Enumeration<typeof Priority>;

Priority.high.value;     // 'P1' (explicit)
Priority.low.value;      // 'LOW' (auto-derived from key)
Priority.urgent.display; // 'Urgent!!!'
```

If you omit `value`, it's derived from the key via `constantCase`. If you omit `display`, it's derived via `capitalCase`. Override either or both per member.

## Custom fields

Any extra properties on a member are preserved with full type inference:

```typescript
const AppError = enumeration('AppError', {
  input: {
    notFound: { source: 'api', httpStatus: 404 },
    unauthorized: { source: 'auth', httpStatus: 401 },
    serverError: { source: 'api', httpStatus: 500 },
  } as const,
});

AppError.notFound.source;     // 'api' (literal type)
AppError.notFound.httpStatus; // 404 (literal type)

// Extract by custom fields:
type ApiErrors = Extract<Enumeration<typeof AppError>, { source: 'api' }>;
```

Those custom fields are also what [prop-based subsetting](/core/lookup#subsetting-by-a-custom-field) filters on.

## Custom auto-formatters

Override how `value`, `display`, or any auto-generated property is derived from the key:

```typescript
const Routes = enumeration('Routes', {
  input: ['userProfile', 'adminDashboard'] as const,
  propertyAutoFormatters: [
    { key: 'value', format: k => `/${k}` },
    { key: 'slug', format: k => k.replace(/([A-Z])/g, '-$1').toLowerCase() },
  ],
});

Routes.userProfile.value; // '/userProfile'
Routes.userProfile.slug;  // 'user-profile'
```

A formatter can target a built-in property (`value`, `display`) or invent a new one (`slug`) that then exists on every member with full inference.

## Next

- [Lookup & subsets](/core/lookup) — finding members and scoping enums down.
- [Serialization & transport](/core/serialization) — moving enums across the wire.
