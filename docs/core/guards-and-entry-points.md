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

::: tip Duplicate-package gotcha
The guards rely on a branding symbol. If two copies of `@reharik/smart-enum` end up installed at different versions, they hold different symbol instances and `isSmartEnumItem` can silently return `false` for a genuine member. If a guard is failing on something you're sure is a member, check for duplicate installs (`npm dedupe`, or align versions with a tool like `syncpack`).
:::

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
| `@reharik/smart-enum/core` | `enumeration`, type guards, subset helpers |
| `@reharik/smart-enum/transport` | transport serialization & revival, global registry |
| `@reharik/smart-enum/database` | `prepareForDatabase`, row/payload revival |
| `@reharik/smart-enum/graphql` | `patchSchemaEnumSerializers` |
| `@reharik/smart-enum` | everything, re-exported |
