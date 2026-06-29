# GraphQL overview

The goal of the GraphQL integration is simple to state and fiddly to achieve: a smart-enum member should flow unbroken from your schema, through resolvers, across the wire, into the Apollo cache, and out to a component — staying a real enum instance the whole way, never collapsing into a bare string you have to look up by hand.

That requires fixing a few seams. This page covers the runtime serializer patching that lives in the core package; the codegen plugins that eliminate hand-written enum files are covered on their own pages.

## The pieces

| Concern | Tool |
| --- | --- |
| Resolvers returning smart-enum members | `patchSchemaEnumSerializers` ([below](#server-side-resolvers-returning-members)) |
| Outgoing client variables that are smart-enums | `patchSchemaEnumSerializers` on the client schema ([below](#client-side-outgoing-variables)) |
| Cache reads returning members, not strings | [Apollo type policies](/graphql/type-policies) |
| Generating the enum definitions themselves | [Enum definitions codegen](/graphql/codegen-enums) |
| Wiring all of it with no per-enum config | [The preset](/graphql/preset) |

## Server-side: resolvers returning members

Out of the box, if a resolver returns a smart-enum member, the default `serialize` on `GraphQLEnumType` doesn't know how to extract the string — it passes the object straight through, breaking the response.

`patchSchemaEnumSerializers` walks your executable schema once at startup and patches every `GraphQLEnumType.serialize` to call `.value` on smart-enum members:

```typescript
import { patchSchemaEnumSerializers } from '@reharik/smart-enum';
import { makeExecutableSchema } from '@graphql-tools/schema';

const schema = makeExecutableSchema({ typeDefs, resolvers });

// Call once at startup, after schema construction
patchSchemaEnumSerializers(schema);

// Now resolvers can return members directly:
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

The patched `serialize` does `val?.value ?? val` — members return their `.value`, and raw strings pass through unchanged. That means you can adopt it incrementally without breaking resolvers that already return strings.

To also patch `parseValue` / `parseLiteral` (so incoming request arguments are revived into members before they reach your resolver), pass the `enumRegistry`:

```typescript
import { enumRegistry } from '@packages/contracts';

patchSchemaEnumSerializers(schema, enumRegistry);
```

The registry is the barrel the [enum-definition codegen](/graphql/codegen-enums) generates. Hand-authored enums must be included in it (via [`externalEnums`](/graphql/codegen-enums#hand-authored-enums)) or their arguments will arrive as raw strings.

## Client-side: outgoing variables

If your Apollo Client uses a link that processes variables against the schema — most commonly [`apollo-link-scalars`](https://www.npmjs.com/package/apollo-link-scalars) — that link calls `serialize` on every variable, including smart-enum members, *before* `JSON.stringify` runs. GraphQL's default enum `serialize` throws on the object:

```
Enum "ReactionEmoji" cannot represent value: { __smart_enum_type: ..., value: ... }
```

The same `patchSchemaEnumSerializers` fixes this. Patch the **client** schema before handing it to the link:

```typescript
import { buildSchema } from 'graphql';
import { ApolloClient, ApolloLink, InMemoryCache } from '@apollo/client';
import { withScalars } from 'apollo-link-scalars';
import { patchSchemaEnumSerializers } from '@reharik/smart-enum/graphql';
import { enumRegistry } from '@packages/contracts';
import sdl from './generated/schema.graphql?raw';

const schema = buildSchema(sdl);
patchSchemaEnumSerializers(schema, enumRegistry);

const scalarLink = withScalars({ schema, typesMap: { /* ... */ } });

export const client = new ApolloClient({
  link: ApolloLink.from([scalarLink, httpLink]),
  cache: new InMemoryCache({ /* ... */ }),
});
```

If you're **not** using a schema-aware link, you don't need this — Apollo's default behavior calls `JSON.stringify` on variables directly, which goes through smart-enum's `toJSON` (with `serializeAs: 'value'`) and produces the correct wire format.

## Client-side: cache rehydration

When Apollo reads a query result from its normalized cache, enum fields come back as plain strings. The [type-policies plugin](/graphql/type-policies) generates `read` functions that revive them into members on the way out of the cache, so components receive `Status.active`, not `'ACTIVE'`.

## Next

- [Enum definitions (codegen)](/graphql/codegen-enums) — generate the smart-enum definitions from your schema.
- [The preset](/graphql/preset) — wire the whole stack with one config block per target.
