# Design notes

A few principles run through the whole ecosystem. They explain why some APIs are explicit where you might expect magic.

## A member is an object, not a string

The central choice is that an enum member is a frozen object carrying a key, wire value, display string, index, and your custom fields — not a bare string. Everything else follows from that. It's what makes `.display` and metadata possible in memory, and it's also the source of the friction the transport, database, and GraphQL layers exist to smooth: the moment a member crosses a boundary that only speaks strings, you need a defined way back.

## Explicit revival over inference

The library never guesses which strings are enums. Reading from a database or a JSON payload requires you to declare the mapping. Inference would be convenient and occasionally wrong — and a wrong revival is a silent data bug. Declaring `{ status: Status }` is a small cost that keeps the boundary honest. The [Knex adapter](/database/knex) leans into this: it's deliberately a thin connector, not a schema scanner.

## Identity is a string you own

Serialization identity is the name you pass to `enumeration()`, and it must be stable across serialize/revive boundaries. Keeping it matching the variable name is convention, not enforcement — but the codegen path removes the chance to get it wrong by deriving it from the GraphQL type name.

## Incremental adoption

The runtime patches (`patchSchemaEnumSerializers`) are written to pass raw strings through unchanged, so you can introduce smart enums into an existing GraphQL server resolver by resolver without a flag day. The codegen and the core library are likewise independent — the plugins don't care whether your enums were generated or hand-authored, only that they exist and expose `.fromValue()`.

## Failure modes worth knowing

A handful of sharp edges come from the object-identity design and the realities of a JS module graph:

- **Duplicate package installs** give two different branding symbols, so `isSmartEnumItem` can return `false` for a real member. Deduplicate installs if a guard misfires.
- **Apollo type-policy merge order** — a later policy for the same type silently overrides the generated enum policy. [Merge explicitly](/graphql/type-policies#wiring-it-into-apollo).
- **`printSchema()` strips `@enumMeta`** — keep `includeDirectives: true` where you emit a `.graphql` file. See [`@enumMeta` metadata](/graphql/enum-meta#caution-schema-pipelines-strip-directives).

## License

MIT.
