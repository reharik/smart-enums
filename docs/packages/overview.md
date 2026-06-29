# Ecosystem overview

The smart-enum ecosystem is a core library plus a small family of packages that extend it to a full GraphQL + database stack. Each is independent — adopt only what you need.

## The packages

| Package | npm | What it does |
| --- | --- | --- |
| **smart-enum** | [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) | The core. Enum creation, lookup, subsetting, serialization/transport, database revival, and GraphQL serializer patching. |
| **smart-enum-knex** | [`@reharik/smart-enum-knex`](https://www.npmjs.com/package/@reharik/smart-enum-knex) | Wires explicit row revival into Knex's `postProcessResponse`. |
| **graphql-codegen-smart-enum** | [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Generates smart-enum definitions and the `enumRegistry` barrel from schema `enum` types. |
| **…-type-policies** | [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Generates Apollo `typePolicies` that rehydrate enum fields from the cache. |
| **…-preset** | [`@reharik/graphql-codegen-smart-enum-preset`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-preset) | A codegen preset orchestrating all of the above with zero per-enum config. |

## How they fit together

The core library is self-contained — install it alone and you have better enums in any TypeScript project.

The codegen packages remove the work of keeping hand-authored enum files in sync with a GraphQL schema. The **enum-definition** plugin turns schema enums into definitions; **type-policies** makes the Apollo cache hand back members instead of strings; the **preset** ties both together and auto-derives the `enumValues` maps so resolver and operation types reference your enums without per-enum wiring.

The **Knex adapter** connects core's database revival to Knex's query hooks, so revival happens automatically per query instead of by hand.

## Picking a starting point

- **Plain TypeScript, better enums:** [`@reharik/smart-enum`](/core/creating-enums) — start at [Creating enums](/core/creating-enums).
- **GraphQL stack, end to end:** start at the [GraphQL overview](/graphql/overview), then the [preset](/graphql/preset).
- **Storing enums in Postgres via Knex:** [Database revival](/database/revival) and the [Knex adapter](/database/knex).

## Versions at time of writing

| Package | Version |
| --- | --- |
| `@reharik/smart-enum` | 0.4.6 |
| `@reharik/smart-enum-knex` | 0.0.3 |
| `@reharik/graphql-codegen-smart-enum` | 0.3.8 |
| `@reharik/graphql-codegen-smart-enum-type-policies` | 0.1.3 |
| `@reharik/graphql-codegen-smart-enum-preset` | 0.1.2 |

Check npm for the latest published versions.
