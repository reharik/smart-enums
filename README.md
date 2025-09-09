# Smart Enums

A TypeScript library for creating type-safe, feature-rich enumerations with built-in utility methods. Stop juggling between constants, arrays, objects, and string unions - use Smart Enums instead.

## Why Smart Enums?

Traditional approaches to enums in JavaScript/TypeScript have limitations:
- Plain objects `{ME: "me", YOU: "you"}` lack utility methods
- Constants `const ME = "me"` are scattered and hard to iterate
- Arrays `["me", "you"]` don't provide lookups
- String unions `type No = "please" | "pretty please"` are compile-time only

Smart Enums give you the best of all worlds:

```typescript
const Colors = enumeration({
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

## Quick Start

### Creating Enums from Arrays

The simplest way to create a Smart Enum:

```typescript
import { enumeration, Enumeration } from 'smart-enums';

const input = ['pending', 'active', 'completed', 'archived'] as const;

type Status = Enumeration<typeof Status, typeof input>;
const Status = enumeration({ input });

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

type Priority = Enumeration<typeof Priority, typeof input>;
const Priority = enumeration({ input });

console.log(Priority.urgent.level); // 4
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

type Routes = Enumeration<typeof Routes, typeof input>;
const Routes = enumeration({ input, propertyAutoFormatters });

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
const UserStatus = enumeration({
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

const Colors = enumeration<
  typeof colorsInput,
  ColorExtension,
  ExtraExtensionMethods
>({
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

type Pages = Enumeration<typeof Pages, typeof input>;
const Pages = enumeration<typeof input, PageExtensions>({ input });

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
    <select value={selected.value} onChange={(e) => setSelected(Colors.fromValue(e.target.value))}>
      {Colors.toOptions().map((option) => (
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

const statusInput = ['pending', 'active', 'completed'] as const
const Status = enumeration({ input: statusInput });
type Status = Enumeration<typeof Status, typeof statusInput>;

const colorInput: ['red', 'blue', 'green'] as const 
const Color = enumeration({ input: colorInput});
type Color = Enumeration<typeof Color, type of colorInput>;

const dto = {
  id: '123',
  status: Status.active,
  favoriteColor: Color.red,
  history: [Status.pending, Status.completed],
};

// Inferred serialized type
const wire = serializeSmartEnums(dto);

// Inferred revived type (map keys with as const)
const revived = reviveSmartEnums(
  wire,
  { status: Status, favoriteColor: Color } as const,
);

// Explicit return types (optional)
type MyWire = { id: string; status: string };
const wireExplicit = serializeSmartEnums<MyWire>(dto);

type MyRevived = RevivedSmartEnums<
  typeof wire,
  { status: typeof Status; favoriteColor: typeof Color }
>;
const revivedExplicit = reviveSmartEnums<MyRevived>(
  wire,
  { status: Status, favoriteColor: Color } as const,
);
```

Notes:
- Serialization uses a non-enumerable Symbol tag to detect enum items; JSON stays clean.
- Reviving is opt-in per field name. If no mapping is provided for a field, the string is left as-is.
- Use `as const` on the mapping object so keys remain literal for best inference.
- Cyclic references are preserved during serialization.

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

### `enumeration(props)`

Main factory function for creating Smart Enums.

**Parameters:**
- `input` - Array of strings, object with BaseEnum values, or existing enum
- `propertyAutoFormatters` - Optional custom formatters for auto-generated properties
- `extraExtensionMethods` - Optional factory for adding custom methods

**Returns:** An enum object with all items as properties plus extension methods

### Extension Methods

| Method | Description | Returns |
|--------|-------------|---------|
| `fromValue(value)` | Get item by value (throws if not found) | `EnumItem` |
| `tryFromValue(value)` | Get item by value (safe) | `EnumItem \| undefined` |
| `fromKey(key)` | Get item by key (throws if not found) | `EnumItem` |
| `tryFromKey(key)` | Get item by key (safe) | `EnumItem \| undefined` |
| `fromDisplay(display)` | Get item by display text (throws if not found) | `EnumItem` |
| `tryFromDisplay(display)` | Get item by display text (safe) | `EnumItem \| undefined` |
| `tryFromCustomField(field, value, filter?)` | Get item by custom field | `EnumItem \| undefined` |
| `toOptions(filter?, options?)` | Convert to dropdown options | `DropdownOption[]` |
| `toValues(filter?, options?)` | Get all values | `string[]` |
| `toKeys(filter?, options?)` | Get all keys | `string[]` |
| `toDisplays(filter?, options?)` | Get all display texts | `string[]` |
| `toEnumItems(filter?, options?)` | Get all items as array | `EnumItem[]` |
| `toCustomFieldValues(field, filter?, options?)` | Get values from custom field | `T[]` |

### Filter Options

| Option | Type | Description |
|--------|------|-------------|
| `showEmpty` | `boolean` | Include items with null/undefined values |
| `showDeprecated` | `boolean` | Include deprecated items |

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
const Colors = enumeration({
  input: ['red', 'blue', 'green'] as const,
});

// Usage changes from COLORS.RED to Colors.red.value
```

### From String Unions

```typescript
// Before
type Status = 'pending' | 'active' | 'completed';

// After
const Status = enumeration({
  input: ['pending', 'active', 'completed'] as const,
});

type StatusItem = (typeof Status)[keyof typeof Status];
```

## Best Practices

1. **Always use `as const`** for array inputs to preserve literal types
   
2. **Use `tryFrom*` methods** when dealing with external data
3. **Leverage filtering** to hide deprecated items from users
4. **Add custom properties** for domain-specific needs

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT

## Support

- 📧 Email: harik.raif@gmail.com
- 🐛 Issues: [GitHub Issues](https://github.com/reharik/smart-enums/issues)
- 📖 Docs: [Full Documentation](https://docs.reharik.com/smart-enums)