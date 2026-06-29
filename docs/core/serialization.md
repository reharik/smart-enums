# Serialization & transport

Smart-enum members are objects, not strings — which is exactly what makes them useful in memory and exactly what makes them tricky to send over a network. The transport layer handles both directions: serializing members into self-describing JSON, and reviving that JSON back into live enum instances on the other side.

## The wire format

Members serialize to self-describing `{ __smart_enum_type, value }` objects. The `__smart_enum_type` tag is the [identity string](#the-identity-string) you passed to `enumeration()`; a registry maps it back on revival.

```typescript
import { serializeSmartEnums, reviveSmartEnums } from '@reharik/smart-enum';

const dto = { id: '1', status: Status.active, color: Color.red };

// Serialize
const wire = serializeSmartEnums(dto);
// { id: '1',
//   status: { __smart_enum_type: 'Status', value: 'ACTIVE' },
//   color:  { __smart_enum_type: 'Color',  value: 'RED' } }

// Revive
const revived = reviveSmartEnums(wire, { Status, Color });
// revived.status === Status.active ✓
```

Revival takes a registry — an object mapping identity strings to the enum objects — because the wire data carries only the type *name*, not the live enum.

## Global transport registry

Passing a registry on every call gets tedious in an app. Register all enums once at startup and use the registry-free helpers everywhere else:

```typescript
import {
  initializeSmartEnumMappings,
  serializeForTransport,
  reviveAfterTransport,
} from '@reharik/smart-enum/transport';

// At startup (e.g. Express middleware setup)
initializeSmartEnumMappings({
  enumRegistry: { Status, Priority, Color },
});

// In a handler
const wire = serializeForTransport(responseData);
const revived = reviveAfterTransport(requestBody);
```

## Serialization mode

Each member's `toJSON` can emit either the wrapped `{ __smart_enum_type, value }` shape or a bare `value` string. The wrapped shape is self-describing and revives without a field map; the bare string is what most GraphQL and database pipelines expect.

You can set this per enum, or set a global default. The convention is to call `setDefaultSerializationMode('value')` in **each consuming app's entry point** — not in a shared contracts package, so different consumers can choose independently.

For GraphQL stacks specifically, generated enums are typically emitted with `serializeAs: 'value'` so `JSON.stringify` on a variable produces the right wire format directly. See [the preset's `enums` mode](/graphql/preset#mode-enums).

## The identity string

The first argument to `enumeration()` is a name used for serialization identity (`__smart_enum_type`) and `toJSON()`. It must be **unique across your app** and **consistent between serialization and revival**.

For hand-authored enums, keep it matching the variable name by convention:

```typescript
const Status = enumeration('Status', { input: ... });
//    ^^^^^^                 ^^^^^^  ← keep these in sync
```

If you use the [`@reharik/graphql-codegen-smart-enum`](/graphql/codegen-enums) plugin, this is handled automatically — the GraphQL enum type name becomes the identity string.

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

## Next

- Storing enums in a database instead of sending them over HTTP? → [Database revival](/database/revival)
- Wiring this into a GraphQL stack? → [GraphQL overview](/graphql/overview)
