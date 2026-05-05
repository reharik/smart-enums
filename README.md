```markdown
# @reharik/smart-enum

Type-safe, feature-rich enumerations for TypeScript. Every enum member is a frozen object with a key, a wire value, a display string, an index, and whatever custom fields you need — plus lookup, iteration, serialization, and database revival built in.

## Why not just use TypeScript enums?

TypeScript's built-in `enum` gives you a name-to-value mapping and nothing else. You can't iterate members, attach metadata, look up by value at runtime, or serialize/revive across a network boundary without writing boilerplate every time.

The common workarounds each solve one piece:

- **Plain objects** (`{ ACTIVE: 'active' }`) — no iteration, no type narrowing, no metadata, annoying text duplication.
- **String unions** (`type Status = 'active' | 'inactive'`) — compile-time only. No runtime lookup, no `.display`, no `.items()`.
- **Arrays** (`['active', 'inactive'] as const`) — iterable, but no keyed access or metadata.
- **Constants** (const ME = "me") — scattered and hard to iterate

Smart Enums give you all of it in one construct:

```typescript
import { enumeration, type Enumeration } from '@reharik/smart-enum';

const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;

Status.active;
// { key: 'active', value: 'ACTIVE', display: 'Active', index: 1 }

Status.fromValue('ACTIVE'); // Status.active
Status.tryFromValue('NOPE'); // undefined
Status.items(); // all members as a frozen array
Status.values(); // ['PENDING', 'ACTIVE', 'COMPLETED']
Status.keys(); // ['pending', 'active', 'completed']
```

Type safety works the way you'd expect — a function that takes `Status` won't accept a member from a different enum, even if the shapes look similar.

## Install

```bash
npm install @reharik/smart-enum
```

## Creating enums

### From an array

The simplest form. Keys are the array values, wire values are auto-derived as `CONSTANT_CASE`, display strings as `Title Case`.

```typescript
const Color = enumeration('Color', {
  input: ['red', 'blue', 'green'] as const,
});
type Color = Enumeration<typeof Color>;

Color.red.key; // 'red'
Color.red.value; // 'RED'
Color.red.display; // 'Red'
Color.red.index; // 0
```

> **`as const` is required** on array inputs. Without it, TypeScript widens the type to `string[]` and you lose literal inference on keys and values.

### From an object

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

Priority.high.value; // 'P1' (explicit)
Priority.low.value; // 'LOW' (auto-derived from key)
Priority.urgent.display; // 'Urgent!!!'
```

If you omit `value`, it's derived from the key via `constantCase`. If you omit `display`, it's derived via `capitalCase`. You can override either or both per member.

### Custom fields

Any extra properties you put on a member are preserved with full type inference:

```typescript
const AppError = enumeration('AppError', {
  input: {
    notFound: { source: 'api', httpStatus: 404 },
    unauthorized: { source: 'auth', httpStatus: 401 },
    serverError: { source: 'api', httpStatus: 500 },
  } as const,
});

AppError.notFound.source; // 'api' (literal type)
AppError.notFound.httpStatus; // 404 (literal type)

// You can Extract by custom fields:
type ApiErrors = Extract<Enumeration<typeof AppError>, { source: 'api' }>;
```

### Custom auto-formatters

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
Routes.userProfile.slug; // 'user-profile'
```

## Lookup methods

Every enum object has these methods. Return types are fully narrowed to the enum's member union.

| Method                | Description                                           |
| --------------------- | ----------------------------------------------------- |
| `fromValue(value)`    | Find by wire value. Throws if not found.              |
| `tryFromValue(value)` | Find by wire value. Returns `undefined` if not found. |
| `fromKey(key)`        | Find by key. Throws if not found.                     |
| `tryFromKey(key)`     | Find by key. Returns `undefined` if not found.        |
| `items()`             | All members as a frozen array.                        |
| `values()`            | All wire values as an array.                          |
| `keys()`              | All keys as an array.                                 |

## Subsetting by a custom field

Filter an enum down to members matching a property value. The result is a new enum-like object with its own `fromValue`, `items`, etc., scoped to the subset:

```typescript
import { getSubsetByProp, subsetByProp } from '@reharik/smart-enum';

const apiErrors = getSubsetByProp(AppError, 'source', 'api' as const);

apiErrors.notFound; // same object as AppError.notFound
apiErrors.items(); // only api-source members
apiErrors.fromValue('500'); // works, scoped to subset
// apiErrors.unauthorized → not present (source is 'auth')

// Curried form:
const bySource = subsetByProp('source');
const authErrors = bySource(AppError, 'auth' as const);
```

## Tree-shaking

The package has multiple entry points so you only pay for what you import:

```typescript
// Core only — enumeration + type guards + subset helpers (~149 bytes)
import { enumeration } from '@reharik/smart-enum/core';

// Core + transport serialization/revival (~406 bytes)
import { serializeForTransport } from '@reharik/smart-enum/transport';

// Core + database serialization/revival (~379 bytes)
import { prepareForDatabase } from '@reharik/smart-enum/database';

// Everything (~598 bytes)
import {
  enumeration,
  serializeSmartEnums,
  prepareForDatabase,
} from '@reharik/smart-enum';
```

## Serialization and transport

Smart enum items serialize to self-describing `{ __smart_enum_type, value }` objects for JSON transport. On the receiving end, a registry maps them back to live enum instances.

```typescript
import { serializeSmartEnums, reviveSmartEnums } from '@reharik/smart-enum';

const dto = { id: '1', status: Status.active, color: Color.red };

// Serialize
const wire = serializeSmartEnums(dto);
// { id: '1',
//   status: { __smart_enum_type: 'Status', value: 'ACTIVE' },
//   color: { __smart_enum_type: 'Color', value: 'RED' } }

// Revive
const revived = reviveSmartEnums(wire, { Status, Color });
// revived.status === Status.active ✓
```

### Global transport registry

For app-wide setup (e.g. Express middleware), register all enums once at startup:

```typescript
import {
  initializeSmartEnumMappings,
  serializeForTransport,
  reviveAfterTransport,
} from '@reharik/smart-enum/transport';

// At startup
initializeSmartEnumMappings({
  enumRegistry: { Status, Priority, Color },
});

// In a handler
const wire = serializeForTransport(responseData);
const revived = reviveAfterTransport(requestBody);
```

## Database utilities

**Outbound:** `prepareForDatabase` recursively replaces enum items with their `.value` strings. Each item also has a `.toPostgres()` method for PostgreSQL drivers that honor it.

**Inbound:** Database columns are plain strings — they don't carry type information. Revival requires you to declare which columns map to which enums.

```typescript
import {
  prepareForDatabase,
  reviveRowFromDatabase,
  revivePayloadFromDatabase,
} from '@reharik/smart-enum/database';

// Write
const dbRow = prepareForDatabase({ name: 'Alice', status: Status.active });
// { name: 'Alice', status: 'ACTIVE' }

// Read — flat row
const revived = reviveRowFromDatabase(row, {
  fieldEnumMapping: { status: Status, priority: Priority },
  strict: true, // throw on unknown values instead of keeping raw string
});

// Read — nested payload (e.g. JSONB column)
const doc = revivePayloadFromDatabase(payload, {
  pathEnumMapping: {
    'user.status': Status,
    'items[].kind': ItemKind,
  },
});
```

`strict: true` throws `EnumRevivalError` when a mapped string doesn't match any member. Without it, unrecognized values are left as-is.

## Type guards

```typescript
import { isSmartEnumItem, isSmartEnum } from '@reharik/smart-enum';

isSmartEnumItem(Status.active); // true
isSmartEnumItem({ key: 'x' }); // false (plain object)

isSmartEnum(Status); // true  (the enum object)
isSmartEnum(Status.active); // false (a member, not the enum)
```

## GraphQL integration

### Server-side: resolvers returning smart-enum instances

Out of the box, if a GraphQL resolver returns a smart-enum item, the default `serialize` on `GraphQLEnumType` doesn't know how to extract the string value — it just passes the object through, which breaks the response.

`patchSchemaEnumSerializers` walks your executable schema at startup and patches every `GraphQLEnumType.serialize` to call `.value` on smart-enum instances. After that, resolvers can return smart-enum items directly:

```typescript
import { patchSchemaEnumSerializers } from '@reharik/smart-enum';
import { makeExecutableSchema } from '@graphql-tools/schema';

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Call once at startup, after schema construction
patchSchemaEnumSerializers(schema);

// Now resolvers can return smart-enum items directly:
const resolvers = {
  Query: {
    order: () => ({
      id: '1',
      status: PaymentStatus.paid, // no .value needed
      type: OrderType.online,
    }),
  },
};
```

The patched `serialize` does `val?.value ?? val` — smart-enum items return their `.value` string, and raw strings pass through unchanged. This means you can adopt it incrementally without breaking existing resolvers that already return strings.

### Client-side: Apollo cache rehydration

The [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) package includes a second codegen plugin that generates Apollo `typePolicies` with `read` functions for every enum field. Spread the output into your `InMemoryCache` and components receive smart-enum instances from queries instead of raw strings:

```typescript
import { InMemoryCache } from '@apollo/client';
import { smartEnumTypePolicies } from './generated/graphql-smart-enum-type-policies';

const cache = new InMemoryCache({
  typePolicies: {
    ...smartEnumTypePolicies,
  },
});

// In a component:
const { data } = useQuery(GET_ORDER);
data.order.status.display; // 'Paid' — not just 'PAID'
```

See the [`type-policies` plugin README](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) for setup details.

## React

```tsx
function StatusPicker() {
  const [selected, setSelected] = useState(Status.pending);

  return (
    <select
      value={selected.value}
      onChange={e => setSelected(Status.fromValue(e.target.value))}
    >
      {Status.items().map(item => (
        <option key={item.value} value={item.value}>
          {item.display}
        </option>
      ))}
    </select>
  );
}
```

## The `enumType` string

The first argument to `enumeration()` is a string name used for serialization identity (`__smart_enum_type`) and `toJSON()`. It must be unique across your app and consistent between serialization and revival.

For hand-authored enums, keep it matching the variable name by convention:

```typescript
const Status = enumeration('Status', { input: ... });
//    ^^^^^^                 ^^^^^^  ← keep these in sync
```

If you use the [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) codegen plugin, this is handled automatically — the GraphQL enum type name becomes the `enumType` string.

## Logging

Transport initialization supports pluggable logging:

```typescript
initializeSmartEnumMappings({
  enumRegistry: { Status, Priority },
  logLevel: 'debug', // 'debug' | 'info' | 'warn' | 'error'
  logger: {
    debug: (msg, ...args) => myLogger.debug(msg, ...args),
    info: (msg, ...args) => myLogger.info(msg, ...args),
    warn: (msg, ...args) => myLogger.warn(msg, ...args),
    error: (msg, ...args) => myLogger.error(msg, ...args),
  },
});
```

Default is `console` at `'error'` level.

## Related packages

| Package                                                                                                                  | Purpose                                                         |
| ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex)                                     | Knex query-level enum revival via `postProcessResponse`         |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum)               | Generate smart-enum definitions from GraphQL schema enums       |
| [`@reharik/graphql-codegen-smart-enum/type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Generate Apollo `typePolicies` for client-side enum rehydration |

## License

MIT

```

