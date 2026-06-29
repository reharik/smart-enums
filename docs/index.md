---
layout: home

hero:
  name: smart-enum
  text: Type-safe enums for TypeScript, fully loaded
  tagline: Every member is a frozen object with a key, wire value, display string, index, and your own custom fields — plus lookup, serialization, database revival, and end-to-end GraphQL codegen.
  actions:
    - theme: brand
      text: Get started
      link: /guide/introduction
    - theme: alt
      text: Quick start
      link: /guide/quick-start
    - theme: alt
      text: GitHub
      link: https://github.com/reharik/smart-enums

features:
  - title: More than a name-to-value map
    details: enumeration('Status', ...) gives you keys, wire values, display strings, indexes, and arbitrary metadata per member — with full literal type inference, not just a string union.
  - title: Runtime lookup, built in
    details: fromValue, fromKey, items, values, keys, and prop-based subsetting — all narrowed to the enum's own member union, no boilerplate per enum.
  - title: Survives the wire
    details: Self-describing { __smart_enum_type, value } serialization with a registry that revives plain JSON back into live enum instances on the other side.
  - title: Database revival
    details: prepareForDatabase on the way out, reviveRowFromDatabase / revivePayloadFromDatabase on the way back — scalar columns, JSONB paths, and Postgres text[] arrays.
  - title: GraphQL, end to end
    details: Codegen turns schema enums into smart-enum definitions, Apollo type policies rehydrate the cache, and a preset wires resolvers and operations with zero per-enum config.
  - title: Tree-shakeable
    details: Separate /core, /transport, /database, and /graphql entry points so you only pay for the surface you import.
---
