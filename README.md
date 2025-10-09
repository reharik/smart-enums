# Smart Enums

A TypeScript library for creating type-safe, feature-rich enumerations with built-in utility methods. Stop juggling between constants, arrays, objects, and string unions - use Smart Enums instead.

## CAVEAT?

While I believe this library is super useful, I am currently refining it via dogfood, trying to get as smooth a process down as possible. This is leading to somewhat frequent releases with possibly breaking changes. As it is a new library, and I presume no one is using it I"m not being very considerate. If you discover this library and want to use it, please tell me and I will stop breaking it :) and employ better release practices.

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
Colors.toOptions(); // Returns dropdown-ready options
Colors.toValues(); // Returns ['RED', 'BLUE', 'GREEN']
```

## Installation

```bash
npm install smart-enums
# or
yarn add smart-enums
# or
pnpm add smart-enums
```

## Tree-Shaking Support

Smart Enums supports tree-shaking with multiple entry points for optimal bundle sizes:

```typescript
// Core functionality only (smallest bundle)
import { enumeration, isSmartEnumItem } from 'smart-enums/core';

// Core + API transport utilities
import {
  enumeration,
  serializeForTransport,
  reviveAfterTransport,
} from 'smart-enums/transport';

// Core + database utilities
import {
  enumeration,
  prepareForDatabase,
  reviveFromDatabase,
} from 'smart-enums/database';

// Full API (backward compatible)
import {
  enumeration,
  serializeSmartEnums,
  prepareForDatabase,
} from 'smart-enums';
```

**Bundle Size Comparison:**

- `smart-enums/core`: ~149 bytes (minimal)
- `smart-enums/transport`: ~406 bytes (core + serialization)
- `smart-enums/database`: ~379 bytes (core + database utilities)
- `smart-enums`: ~598 bytes (everything)

## Quick Start

### Creating Enums from Arrays

The simplest way to create a Smart Enum:

```typescript
import { enumeration, Enumeration } from 'smart-enums';

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
import { enumeration, Enumeration } from 'smart-enums';

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

// Lookup by display text
const displayItem = Colors.fromDisplay('Red');

// Lookup by key
const keyItem = Colors.fromKey('red');

// Lookup by custom field
const customItem = Priority.tryFromCustomField('level', 3);
```

### Conversion Methods

```typescript
// Get dropdown options (for select elements)
const options = Priority.toOptions();
// Returns: [
//   { value: 'LOW', label: 'Low Priority' },
//   { value: 'MED', label: 'Medium Priority' },
//   ...
// ]

// Get all values
const values = Colors.toValues(); // ['RED', 'BLUE', 'GREEN']

// Get all keys
const keys = Colors.toKeys(); // ['red', 'blue', 'green']

// Get all display texts
const displays = Colors.toDisplays(); // ['Red', 'Blue', 'Green']

// Get all enum items as array
const items = Colors.toEnumItems();
```

### Filtering

Most methods support filtering:

```typescript
const UserStatus = enumeration('UserStatus', {
  input: {
    active: { value: 'ACTIVE' },
    inactive: { value: 'INACTIVE' },
    banned: { value: 'BANNED', deprecated: true },
    deleted: { value: 'DELETED', deprecated: true },
  },
});

// Exclude deprecated items
const activeOptions = UserStatus.toOptions(item => !item.deprecated);

// With filter options
const allOptions = UserStatus.toOptions(undefined, { showDeprecated: true });
```

## Advanced Usage

### Custom Extensions

Add domain-specific properties and methods:

```typescript
interface ColorExtension {
  hex: string;
  rgb: [number, number, number];
}
const input = {
  red: { hex: '#FF0000', rgb: [255, 0, 0] },
  blue: { hex: '#0000FF', rgb: [0, 0, 255] },
  green: { hex: '#00FF00', rgb: [0, 255, 0] },
};

interface ExtraExtensionMethods {
  getMixedColor: (c1: any, c2: any) => string;
  getPrimaryColors: () => EnumItem<typeof input, ColorExtension>[];
}
const extraExtensionMethods = items => ({
  getMixedColor: (c1, c2) => {
    // Custom color mixing logic
    return `Mixed: ${c1.key} + ${c2.key}`;
  },
  getPrimaryColors: () => items.filter(i => ['red', 'blue'].includes(i.key)),
});

const Colors = enumeration('Colors', {
  input,
  extraExtensionMethods,
});

console.log(Colors.red.hex); // '#FF0000'
console.log(Colors.getMixedColor(Colors.red, Colors.blue)); // 'Mixed: red + blue'
```

### Custom Field Values

Extract values from custom fields:

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
const slugs = Pages.toCustomFieldValues<string>('slug');
// Returns: ['/', '/about', '/contact']

// Filter out undefined values
const titles = Pages.toCustomFieldValues<string>('title', undefined, {
  showEmpty: false,
});
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
      {Colors.toOptions().map(option => (
        <option key={option.value} value={option.value}>
          {option.label}
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
} from 'smart-enums';

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
import { enumeration } from 'smart-enums/core';
import {
  serializeForTransport,
  reviveAfterTransport,
} from 'smart-enums/transport';

// Create enums
const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active', 'suspended'] as const,
});

const Priority = enumeration('Priority', {
  input: ['low', 'medium', 'high', 'urgent'] as const,
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
  serializeForTransport,
  reviveAfterTransport,
} from 'smart-enums/transport';

const app = express();

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
  private enumRegistry = { UserStatus, Priority, OrderStatus };

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

## Database Utilities

For database operations, use the database utilities to convert enums to strings for storage and revive them when loading.

### Basic Database Usage

```typescript
import { enumeration } from 'smart-enums/core';
import { prepareForDatabase, reviveFromDatabase } from 'smart-enums/database';

// Create enums
const UserStatus = enumeration('UserStatus', {
  input: ['pending', 'active', 'suspended'] as const,
});

const Priority = enumeration('Priority', {
  input: ['low', 'medium', 'high', 'urgent'] as const,
});

// Save to database - convert enums to strings
const apiData = {
  user: {
    id: '123',
    status: UserStatus.active,
    profile: {
      priority: Priority.high,
    },
  },
};

const dbData = prepareForDatabase(apiData);
// Result: {
//   user: {
//     id: '123',
//     status: 'ACTIVE',        // String value
//     profile: {
//       priority: 'HIGH'      // String value
//     }
//   }
// }

// Save to database
await db.users.insert(dbData);

// Load from database - revive strings back to enums
const dbRecord = await db.users.findById('123');
const revivedData = reviveFromDatabase(dbRecord, {
  fieldEnumMapping: {
    status: ['UserStatus'], // Try UserStatus first
    priority: ['Priority'], // Try Priority first
  },
});
// Result: Original apiData with full enum items restored
```

### Automatic Field Mapping Learning

The database utilities can automatically learn field-to-enum mappings, eliminating the need for manual configuration.

```typescript
import { enumeration } from 'smart-enums/core';
import {
  initializeSmartEnumMappings,
  prepareForDatabase,
  reviveFromDatabase,
  getLearnedMapping,
} from 'smart-enums/database';

// 1. Initialize learning system
const enumRegistry = {
  UserStatus: enumeration('UserStatus', {
    input: ['pending', 'active', 'suspended'] as const,
  }),
  Priority: enumeration('Priority', {
    input: ['low', 'medium', 'high'] as const,
  }),
  OrderStatus: enumeration('OrderStatus', {
    input: ['draft', 'processing', 'shipped'] as const,
  }),
};

initializeSmartEnumMappings({ enumRegistry });

// 2. Process data - learning happens automatically
const userData = {
  user: {
    status: enumRegistry.UserStatus.active,
    profile: {
      priority: enumRegistry.Priority.high,
    },
  },
};

// This learns: { status: ['UserStatus'], priority: ['Priority'] }
const dbData = prepareForDatabase(userData);

// 3. Later, revive using learned mappings
const revived = reviveFromDatabase(dbData);
// No fieldEnumMapping needed - uses learned mappings!

// 4. Process more data - continues learning
const orderData = {
  orders: [{ status: enumRegistry.OrderStatus.processing }],
};

// This learns: { status: ['UserStatus', 'OrderStatus'] }
const orderDbData = prepareForDatabase(orderData);

// 5. Inspect learned mappings
const learnedMappings = getLearnedMapping();
console.log(learnedMappings);
// { status: ['UserStatus', 'OrderStatus'], priority: ['Priority'] }
```

### Hybrid Field Mapping (Manual + Learning)

For cases where you need to read from the database before any learning has occurred, you can provide manual field mappings as a fallback:

```typescript
// Option 1: Pure learning (uses learned mappings only)
const revived = reviveFromDatabase(dbData);

// Option 2: Manual fallback when no learning has occurred yet
const revived = reviveFromDatabase(dbData, {
  fieldEnumMapping: {
    status: ['UserStatus', 'OrderStatus'], // Try these enum types
    priority: ['Priority'],
    method: ['ContactMethod'],
  },
});

// Option 3: Hybrid - manual mappings + learning
// Manual mappings take precedence, but learned enum types are added if not already present
// This is useful when you want to ensure certain mappings work immediately
// while still benefiting from automatic learning over time
```

The hybrid approach merges manual and learned mappings with deduplication:

- Manual enum types are tried first
- Learned enum types are added if not already in the manual list
- Manual mappings are persisted to the global singleton for future use
- This ensures backward compatibility while providing immediate functionality

### Prisma Integration

```typescript
import { PrismaClient } from '@prisma/client';
import { prepareForDatabase, reviveFromDatabase } from 'smart-enums/database';

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
  return reviveFromDatabase(dbUser, {
    fieldEnumMapping: {
      status: ['UserStatus'],
      priority: ['Priority'],
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
import { prepareForDatabase, reviveFromDatabase } from 'smart-enums/database';

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

    return reviveFromDatabase(dbUser, {
      fieldEnumMapping: {
        status: ['UserStatus'],
        priority: ['Priority'],
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

## API Reference

### `enumeration(enumType, props)`

Main factory function for creating Smart Enums.

**Parameters:**

- `enumType` - String identifier for the enum type (required for serialization/revival)
- `props.input` - Array of strings, object with BaseEnum values, or existing enum
- `props.propertyAutoFormatters` - Optional custom formatters for auto-generated properties
- `props.extraExtensionMethods` - Optional factory for adding custom methods

**Returns:** An enum object with all items as properties plus extension methods

### Extension Methods

| Method                                          | Description                                    | Returns                 |
| ----------------------------------------------- | ---------------------------------------------- | ----------------------- |
| `fromValue(value)`                              | Get item by value (throws if not found)        | `EnumItem`              |
| `tryFromValue(value)`                           | Get item by value (safe)                       | `EnumItem \| undefined` |
| `fromKey(key)`                                  | Get item by key (throws if not found)          | `EnumItem`              |
| `tryFromKey(key)`                               | Get item by key (safe)                         | `EnumItem \| undefined` |
| `fromDisplay(display)`                          | Get item by display text (throws if not found) | `EnumItem`              |
| `tryFromDisplay(display)`                       | Get item by display text (safe)                | `EnumItem \| undefined` |
| `tryFromCustomField(field, value, filter?)`     | Get item by custom field                       | `EnumItem \| undefined` |
| `toOptions(filter?, options?)`                  | Convert to dropdown options                    | `DropdownOption[]`      |
| `toValues(filter?, options?)`                   | Get all values                                 | `string[]`              |
| `toKeys(filter?, options?)`                     | Get all keys                                   | `string[]`              |
| `toDisplays(filter?, options?)`                 | Get all display texts                          | `string[]`              |
| `toEnumItems(filter?, options?)`                | Get all items as array                         | `EnumItem[]`            |
| `toCustomFieldValues(field, filter?, options?)` | Get values from custom field                   | `T[]`                   |

### Filter Options

| Option           | Type      | Description                              |
| ---------------- | --------- | ---------------------------------------- |
| `showEmpty`      | `boolean` | Include items with null/undefined values |
| `showDeprecated` | `boolean` | Include deprecated items                 |

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
- 📖 Docs: [Full Documentation](https://docs.reharik.com/smart-enums)
