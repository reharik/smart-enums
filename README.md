# Smart Enums

A TypeScript library for creating type-safe, feature-rich enumerations with built-in utility methods. Stop juggling between constants, arrays, objects, and string unions - use Smart Enums instead.

## CAVEAT?

While I believe this library is super useful, I am currently refining it via dogfood, trying to get as smooth a process down as possible. This is leading to somewhat frequent releases with possibly breaking changes. As it is a new library, and I presume no one is using it I"m not being very considerate. If you discover this library and want to use it, please tell me and I will stop breaking it :) and employ better release practices.

## Changelog

See [CHANGELOG.md](packages/core/CHANGELOG.md) for a detailed list of changes and version history.

## Why Smart Enums?

Traditional approaches to enums in JavaScript/TypeScript have limitations:

- Plain objects `{ME: "me", YOU: "you"}` lack utility methods
- Constants `const ME = "me"` are scattered and hard to iterate
- Arrays `["me", "you"]` don't provide lookups
- String unions `type No = "please" | "pretty please"` are compile-time only

Smart Enums give you the best of all worlds:

```typescript
const Colors = enumeration('Colors', {
  input: ['red', 'blue', 'green'] as const,
});

// You get a rich object structure:
Colors.red; // { key: "red", value: "RED", display: "Red", index: 0 }
Colors.blue; // { key: "blue", value: "BLUE", display: "Blue", index: 1 }

// Plus powerful utility methods:
Colors.fromValue('RED'); // Returns Colors.red
Colors.items(); // Returns all enum items
Colors.values(); // Returns ['RED', 'BLUE', 'GREEN']
```

## Installation

```bash
npm install ts-smart-enum
# or
yarn add ts-smart-enum
# or
pnpm add ts-smart-enum
```

The npm package name is **`ts-smart-enum`** (it was previously published as `smart-enums`).

## Tree-Shaking Support

Smart Enums supports tree-shaking with multiple entry points for optimal bundle sizes:

```typescript
// Core functionality only (smallest bundle)
import { enumeration, isSmartEnumItem } from 'ts-smart-enum/core';

// Core + API transport utilities
import {
  enumeration,
  serializeForTransport,
  reviveAfterTransport,
} from 'ts-smart-enum/transport';

// Core + database utilities
import {
  enumeration,
  prepareForDatabase,
  reviveRowFromDatabase,
} from 'ts-smart-enum/database';

// Full API (backward compatible)
import {
  enumeration,
  serializeSmartEnums,
  prepareForDatabase,
} from 'ts-smart-enum';
```

**Bundle Size Comparison:**

- `ts-smart-enum/core`: ~149 bytes (minimal)
- `ts-smart-enum/transport`: ~406 bytes (core + serialization)
- `ts-smart-enum/database`: ~379 bytes (core + database utilities)
- `ts-smart-enum`: ~598 bytes (everything)

### Knex (optional)

For Knex, use [`@ts-smart-enum/knex`](packages/knex/README.md): it adds `withEnumRevival` and `createSmartEnumPostProcessResponse` on top of the same explicit `FieldEnumMapping` + `reviveRowFromDatabase` flow as `ts-smart-enum/database`. Revival is **not** inferred from the schema; you attach mapping per query via `queryContext`.

## Quick Start

### Creating Enums from Arrays

The simplest way to create a Smart Enum:

```typescript
import { enumeration, Enumeration } from 'ts-smart-enum';

const input = ['pending', 'active', 'completed', 'archived'] as const;

const Status = enumeration('Status', { input });
type Status = Enumeration<typeof Status>;

// Use it:
console.log(Status.active.value); // "ACTIVE"
console.log(Status.active.display); // "Active"
```

### Creating Enums from Objects

For more control over the values:

```typescript
import { enumeration, Enumeration } from 'ts-smart-enum';

const input = {
  low: { value: 'LOW', display: 'Low Priority' },
  medium: { value: 'MIDDLE', display: 'Medium Priority' },
  high: { value: 'HIGH', display: 'High Priority' },
  urgent: { value: 'URGENT', display: 'Urgent!!!' },
};

const Priority = enumeration('Priority', { input });
type Priority = Enumeration<typeof Priority>;

console.log(Priority.urgent.value); // "URGENT"
```

## Core Features

### Type Safety

Smart Enums are fully type-safe:

```typescript
function processColor(color: Color) {
  console.log(color.display);
}

processColor(Colors.red); // ✅ Works
processColor(Status.active); // ❌ Type error
```

### Auto-Generated Properties

Each enum item automatically gets:

- `key` - The original key (e.g., "red")
- `value` - Constant case version (e.g., "RED")
- `display` - Human-readable version (e.g., "Red")
- `index` - Position in the enum (e.g., 0, 1, 2)

### Custom Property Formatters

Override or add custom auto-formatting:

```typescript
const input = ['userProfile', 'adminDashboard', 'settingsPage'] as const;
const propertyAutoFormatters = [
  { key: 'path', format: k => `/${k}` },
  { key: 'slug', format: k => k.toLowerCase().replace(/([A-Z])/g, '-$1') },
  { key: 'value', format: k => k.toLowerCase() },
];

const Routes = enumeration('Routes', { input, propertyAutoFormatters });
type Routes = Enumeration<typeof Routes>;

console.log(Routes.userProfile.path); // "/userProfile"
console.log(Routes.userProfile.slug); // "/user-profile"
console.log(Routes.userProfile.value); // "/user-profile"
```

## Utility Methods

### Lookup Methods

```typescript
// Get enum item by value (throws if not found)
const item = Colors.fromValue('RED');

// Safe lookup (returns undefined if not found)
const maybeItem = Colors.tryFromValue('PURPLE');

// Lookup by key
const keyItem = Colors.fromKey('red');
```

### Conversion Methods

```typescript
// Get all values
const values = Colors.values(); // ['RED', 'BLUE', 'GREEN']

// Get all keys
const keys = Colors.keys(); // ['red', 'blue', 'green']

// Get all enum items as array
const items = Colors.items();
```

## Advanced Usage

### Custom Properties

```typescript
const input = {
  red: { hex: '#FF0000', rgb: [255, 0, 0] },
  blue: { hex: '#0000FF', rgb: [0, 0, 255] },
  green: { hex: '#00FF00', rgb: [0, 255, 0] },
};

const Colors = enumeration('Colors', {
  input,
});

console.log(Colors.red.hex); // '#FF0000'
console.log(Colors.blue.rgb); // [0, 0, 255]
```

### Custom Field Values

Extract custom values from enum items:

```typescript
type PageExtensions = { slug: string; title: string };
const input = {
  home: { slug: '/', title: 'Home Page' },
  about: { slug: '/about', title: 'About Us' },
  contact: { slug: '/contact', title: 'Contact' },
};

const Pages = enumeration('Pages', { input });
type Pages = Enumeration<typeof Pages>;

const slug = Pages.about.slug; // '/about'

// Get all slugs
const slugs = Pages.items().map(item => item.slug);
// Returns: ['/', '/about', '/contact']

// Filter out undefined values
const titles = Pages.items()
  .map(item => item.title)
  .filter(Boolean);
```

### React/Frontend Usage

Perfect for form selects and dropdowns:

```tsx
function ColorSelector() {
  const [selected, setSelected] = useState(Colors.red);

  return (
    <select
      value={selected.value}
      onChange={e => setSelected(Colors.fromValue(e.target.value))}
    >
      {Colors.items().map(item => (
        <option key={item.value} value={item.value}>
          {item.display}
        </option>
      ))}
    </select>
  );
}
```

### Serialization and Reviving (Transformations)

When sending data over the wire or persisting to a database, replace enum items with strings and revive them back.

```ts
import {
  serializeSmartEnums,
  reviveSmartEnums,
  enumeration,
  type Enumeration,
} from 'ts-smart-enum';

const statusInput = ['pending', 'active', 'completed'] as const;
const Status = enumeration('Status', { input: statusInput });
type Status = Enumeration<typeof Status>;

const colorInput = ['red', 'blue', 'green'] as const;
const Color = enumeration('Color', { input: colorInput });
type Color = Enumeration<typeof Color>;

const dto = {
  id: '123',
  status: Status.active,
  favoriteColor: Color.red,
  history: [Status.pending, Status.completed],
};

// Serialize enum items to self-describing objects
const wire = serializeSmartEnums(dto);
// Result: {
//   id: '123',
//   status: { __smart_enum_type: 'Status', value: 'ACTIVE' },
//   favoriteColor: { __smart_enum_type: 'Color', value: 'RED' },
//   history: [
//     { __smart_enum_type: 'Status', value: 'PENDING' },
//     { __smart_enum_type: 'Status', value: 'COMPLETED' }
//   ]
// }

// Revive using registry
const revived = reviveSmartEnums(wire, { Status, Color });
// Result: {
//   id: '123',
//   status: Status.active,        // Full enum item restored
//   favoriteColor: Color.red,     // Full enum item restored
//   history: [Status.pending, Status.completed]
// }
```

Notes:

- All enums now require an `enumType` parameter for serialization/revival
- Serialization creates self-describing objects with `__smart_enum_type` and `value`
- Reviving uses a registry to map enum types back to their instances
- Cyclic references are preserved during serialization
- Use `as const` on the registry object for best type inference

## Transport Utilities

For API communication, use the transport utilities to serialize enums for sending over the wire and revive them on the receiving end.

### Basic Transport Usage

```typescript
import { enumeration } from 'ts-smart-enum/core';
import {
  initializeSmartEnumMappings,
  serializeForTransport,
  reviveAfterTransport,
} from 'ts-smart-enum';

// Create enums
const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active', 'suspended'] as const,
});

const Priority = enumeration('Priority', {
  input: ['low', 'medium', 'high', 'urgent'] as const,
});

// Required once before calling reviveAfterTransport
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
});

// API endpoint - serialize for sending
const apiData = {
  user: {
    id: '123',
    status: UserStatus.active,
    profile: {
      priority: Priority.high,
    },
  },
  orders: [
    { id: 'o1', status: UserStatus.pending },
    { id: 'o2', status: UserStatus.active },
  ],
};

// Serialize for transport (creates self-describing objects)
const wireData = serializeForTransport(apiData);
// Result: {
//   user: {
//     id: '123',
//     status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' },
//     profile: {
//       priority: { __smart_enum_type: 'Priority', value: 'HIGH' }
//     }
//   },
//   orders: [
//     { id: 'o1', status: { __smart_enum_type: 'UserStatus', value: 'PENDING' } },
//     { id: 'o2', status: { __smart_enum_type: 'UserStatus', value: 'ACTIVE' } }
//   ]
// }

// Client-side - revive after receiving
const revivedData = reviveAfterTransport(wireData);
// Result: Original apiData with full enum items restored
```

### Express.js Integration

```typescript
import express from 'express';
import {
  initializeSmartEnumMappings,
  serializeForTransport,
  reviveAfterTransport,
} from 'ts-smart-enum';

const app = express();

initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
});

// Middleware to revive enums from incoming requests
app.use(express.json());
app.use((req, res, next) => {
  if (req.body) {
    req.body = reviveAfterTransport(req.body);
  }
  next();
});

// API endpoint
app.get('/api/users/:id', (req, res) => {
  const user = getUserById(req.params.id);

  // Serialize for response
  res.json(serializeForTransport(user));
});

// POST endpoint
app.post('/api/users', (req, res) => {
  // req.body is automatically revived with enum items
  const { status, priority } = req.body;

  // Use enum items directly
  if (status === UserStatus.active) {
    // Handle active user
  }

  const newUser = createUser(req.body);
  res.json(serializeForTransport(newUser));
});
```

### React/Fetch Integration

```typescript
// API client with automatic enum handling
class ApiClient {
  async get<T>(url: string): Promise<T> {
    const response = await fetch(url);
    const data = await response.json();

    // Revive enums in response
    return reviveAfterTransport(data) as T;
  }

  async post<T>(url: string, data: any): Promise<T> {
    // Serialize enums for sending
    const serializedData = serializeForTransport(data);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(serializedData),
    });

    const result = await response.json();
    return reviveAfterTransport(result) as T;
  }
}

// Usage in React component
function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState<User | null>(null);
  const apiClient = new ApiClient();

  useEffect(() => {
    apiClient.get<User>(`/api/users/${userId}`).then(setUser);
  }, [userId]);

  const updateStatus = async (newStatus: typeof UserStatus.active) => {
    const updatedUser = await apiClient.post<User>(`/api/users/${userId}`, {
      status: newStatus, // Enum item sent directly
    });
    setUser(updatedUser);
  };

  return (
    <div>
      <h2>{user?.name}</h2>
      <p>Status: {user?.status.display}</p>
      <button onClick={() => updateStatus(UserStatus.active)}>
        Activate User
      </button>
    </div>
  );
}
```

## Database utilities

**Outbound serialization is generic:** `prepareForDatabase` walks your payload and replaces smart enum items with their `.value` strings. You can also bind `someItem.toPostgres()` for PostgreSQL drivers that honor that hook (outbound only; it does not revive reads).

**Inbound deserialization is not automatic:** a plain string column does not say which enum type it belongs to, and the same property name (e.g. `status`) is not unique across your schema. The previous **learned / global-registry database revival model has been removed**.

**Recommended approach:** at the repository or query boundary, pass **explicit metadata**: map column names (or full paths for nested JSON) to the **actual enum object** (anything with `tryFromValue`), not to type name strings.

### `reviveRowFromDatabase` (flat rows)

Shallow-clones the row. For each entry in `fieldEnumMapping`, if the value is a string, `tryFromValue` is called; on success the string is replaced by the enum item. `strict: true` throws `EnumRevivalError` when a mapped string is invalid; otherwise the raw value is kept.

```typescript
import { enumeration } from 'ts-smart-enum/core';
import { reviveRowFromDatabase } from 'ts-smart-enum/database';

const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active'] as const,
});

const row = { id: '1', status: 'ACTIVE' };
const revived = reviveRowFromDatabase(row, {
  fieldEnumMapping: { status: UserStatus },
  strict: true,
});
```

### `revivePayloadFromDatabase` (explicit paths only)

Deep-clones with `structuredClone`, then revives only the paths you list (e.g. `status`, `profile.priority`, `items[].kind`). No leaf-name guessing and no registry.

```typescript
import { revivePayloadFromDatabase } from 'ts-smart-enum/database';

const doc = await loadJsonColumn();
const out = revivePayloadFromDatabase(doc, {
  pathEnumMapping: {
    'user.status': UserStatus,
    'lines[].kind': LineKind,
  },
});
```

### Transport vs database

`initializeSmartEnumMappings` / `reviveAfterTransport` are for **wire payloads** that include `__smart_enum_type`. They are exported from `ts-smart-enum/transport` (and the root package), not from the old database utilities.

## Logging

The library includes a flexible logging system that allows you to integrate with your preferred logging solution. By default, it uses console logging.

### Basic Usage

```typescript
import { enumeration, initializeSmartEnumMappings } from 'ts-smart-enum';

// Console logging is enabled by default with 'error' level (minimal output)
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
});

// Enable debug logging for development
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'debug',
});
// [ts-smart-enum:info] Initialized smart enum mappings { enumCount: 2, enumTypes: ['UserStatus', 'Priority'], logLevel: 'debug' }
```

### Log Level Configuration

```typescript
import { initializeSmartEnumMappings, type LogLevel } from 'ts-smart-enum';

// Available log levels (default: 'error')
const logLevels: LogLevel[] = ['debug', 'info', 'warn', 'error'];

// Production: minimal logging (errors only)
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'error', // default
});

// Development: verbose logging
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'debug',
});

// Custom logger with log level filtering
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'info',
  logger: {
    debug: (msg, ...args) => console.debug(`[my-app] ${msg}`, ...args),
    info: (msg, ...args) => console.info(`[my-app] ${msg}`, ...args),
    warn: (msg, ...args) => console.warn(`[my-app] ${msg}`, ...args),
    error: (msg, ...args) => console.error(`[my-app] ${msg}`, ...args),
  },
});
```

### Custom Logger Integration

```typescript
import { initializeSmartEnumMappings, type Logger } from 'ts-smart-enum';
import winston from 'winston';

// Create your logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [new winston.transports.Console()],
});

// Use custom logger with ts-smart-enum
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'debug',
  logger: {
    debug: (msg, ...args) => logger.debug(`[ts-smart-enum] ${msg}`, ...args),
    info: (msg, ...args) => logger.info(`[ts-smart-enum] ${msg}`, ...args),
    warn: (msg, ...args) => logger.warn(`[ts-smart-enum] ${msg}`, ...args),
    error: (msg, ...args) => logger.error(`[ts-smart-enum] ${msg}`, ...args),
  },
});
```

### Log Levels

- **`debug`**: Reserved for future verbose transport diagnostics
- **`info`**: General information (e.g. registry initialization)
- **`warn`**: Warning messages (missing configurations, failed operations)
- **`error`**: Error conditions (missing enum types, invalid data)

### Disabling Logging

To disable logging in production, you can set a no-op logger:

```typescript
import { initializeSmartEnumMappings } from 'ts-smart-enum';

// Disable logging for production
initializeSmartEnumMappings({
  enumRegistry: { UserStatus, Priority },
  logLevel: 'error', // minimal logging
  logger: {
    debug: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  },
});
```

### Logging events

- **Initialization**: When `initializeSmartEnumMappings` is called (transport registry)
- **Warnings / errors**: Emitted by other helpers when misconfigured (see JSDoc per API)

### Prisma Integration

```typescript
import { PrismaClient } from '@prisma/client';
import {
  prepareForDatabase,
  reviveRowFromDatabase,
} from 'ts-smart-enum/database';

const prisma = new PrismaClient();

// Create user with enum data
async function createUser(userData: {
  name: string;
  status: typeof UserStatus.active;
  priority: typeof Priority.high;
}) {
  // Convert enums to strings for database
  const dbData = prepareForDatabase(userData);

  return prisma.user.create({
    data: {
      name: dbData.name,
      status: dbData.status, // 'ACTIVE'
      priority: dbData.priority, // 'HIGH'
    },
  });
}

// Get user and revive enums
async function getUser(id: string) {
  const dbUser = await prisma.user.findUnique({
    where: { id },
  });

  if (!dbUser) return null;

  // Revive enums from database strings
  return reviveRowFromDatabase(dbUser as Record<string, unknown>, {
    fieldEnumMapping: {
      status: UserStatus,
      priority: Priority,
    },
  });
}

// Usage
const user = await getUser('123');
if (user) {
  console.log(user.status.display); // "Active"
  console.log(user.priority.value); // "HIGH"
}
```

### TypeORM Integration

```typescript
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';
import {
  prepareForDatabase,
  reviveRowFromDatabase,
} from 'ts-smart-enum/database';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  status: string; // Stores enum value as string

  @Column()
  priority: string; // Stores enum value as string
}

// Repository with enum handling
export class UserRepository {
  constructor(private repository: Repository<User>) {}

  async save(userData: {
    name: string;
    status: typeof UserStatus.active;
    priority: typeof Priority.high;
  }) {
    const dbData = prepareForDatabase(userData);
    return this.repository.save(dbData);
  }

  async findById(id: number) {
    const dbUser = await this.repository.findOne({ where: { id } });
    if (!dbUser) return null;

    return reviveRowFromDatabase(dbUser as Record<string, unknown>, {
      fieldEnumMapping: {
        status: UserStatus,
        priority: Priority,
      },
    });
  }
}
```

### Validation & Type Guards

```typescript
function processStatus(statusValue: string) {
  const status = Status.tryFromValue(statusValue);

  if (!status) {
    throw new Error(`Invalid status: ${statusValue}`);
  }

  // Now status is typed as a valid enum item
  switch (status.key) {
    case 'pending':
      // Handle pending
      break;
    case 'active':
      // Handle active
      break;
    // TypeScript ensures all cases are handled
  }
}
```

## JSDoc and IDE Support

All public APIs are documented with JSDoc. In supported editors (VS Code, WebStorm, etc.) you get:

- **Hover tooltips** with descriptions and parameter/return types
- **`@example` blocks** on key functions (e.g. `enumeration`, `serializeSmartEnums`, `reviveSmartEnums`, `isSmartEnumItem`, `isSmartEnum`, `prepareForDatabase`, `reviveRowFromDatabase`, transport and database helpers) so you can copy-paste or follow patterns without leaving the editor

Import from the entry point you use (`ts-smart-enum`, `ts-smart-enum/core`, `ts-smart-enum/transport`, or `ts-smart-enum/database`) and hover over symbols to see the inline docs and examples.

## API Reference

### `enumeration(enumType, props)`

Main factory function for creating Smart Enums.

**Parameters:**

- `enumType` - String identifier for the enum type (required for serialization/revival)
- `props.input` - Array of strings, object with BaseEnum values, or existing enum
- `props.propertyAutoFormatters` - Optional custom formatters for auto-generated properties

**Returns:** An enum object with all items as properties plus extension methods

### Extension Methods

| Method                | Description                             | Returns                    |
| --------------------- | --------------------------------------- | -------------------------- |
| `fromValue(value)`    | Get item by value (throws if not found) | `Enumeration`              |
| `tryFromValue(value)` | Get item by value (safe)                | `Enumeration \| undefined` |
| `fromKey(key)`        | Get item by key (throws if not found)   | `Enumeration`              |
| `tryFromKey(key)`     | Get item by key (safe)                  | `Enumeration \| undefined` |
| `items()`             | Get all items as array                  | `Enumeration[]`            |
| `values()`            | Get all values                          | `string[]`                 |
| `keys()`              | Get all keys                            | `string[]`                 |

## Migration Guide

### From Plain Objects

```typescript
// Before
const COLORS = {
  RED: 'red',
  BLUE: 'blue',
  GREEN: 'green',
};

// After
const Colors = enumeration('Colors', {
  input: ['red', 'blue', 'green'] as const,
});

// Usage changes from COLORS.RED to Colors.red.value
```

### From String Unions

```typescript
// Before
type Status = 'pending' | 'active' | 'completed';

// After
const Status = enumeration('Status', {
  input: ['pending', 'active', 'completed'] as const,
});
type Status = Enumeration<typeof Status>;
```

## Best Practices

1. **Always use `as const`** for array inputs to preserve literal types
2. **Always provide `enumType`** parameter for serialization/revival support
3. **Use `tryFrom*` methods** when dealing with external data
4. **Leverage filtering** to hide deprecated items from users
5. **Add custom properties** for domain-specific needs

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT

## Support

- 📧 Email: harik.raif@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/reharik/smart-enums/issues)
- 📖 Docs: [Full Documentation](https://docs.reharik.com/ts-smart-enum)
