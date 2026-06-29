# @reharik/graphql-codegen-smart-enum-preset

A [GraphQL Code Generator](https://the-guild.dev/graphql/codegen) preset that wires smart enums across your whole codegen setup — definitions, resolver types, operation types, and Apollo policies — and auto-derives the `enumValues` map from your schema, so adding a new enum needs zero codegen-config changes.

📖 **Full documentation:** https://reharik.github.io/smart-enums/graphql/preset

## The problem it removes

Integrating smart enums end-to-end by hand means repeating an `enumValues` map in every codegen target — server, client, each pointing every enum at your contracts package. Add an enum to the schema and there are three places to update; miss one and the generated types silently fall back to plain TypeScript enums. The preset reads the schema and fills that map for you. You write `enumImportPath` once per target; new enums just work.

## Install

```bash
npm install @reharik/smart-enum
npm install -D @reharik/graphql-codegen-smart-enum-preset @graphql-codegen/cli graphql
# plus whichever plugins your modes use (typescript, typescript-resolvers, etc.)
```

## The shape of it

```yaml
generates:
  ./src/graphql/generated/types.generated.ts:
    preset: '@reharik/graphql-codegen-smart-enum-preset'
    presetConfig:
      mode: with-enum-values
      enumImportPath: '@packages/contracts'
    plugins:
      - typescript
      - typescript-resolvers
    config:
      # your existing config, untouched — the preset adds enumValues automatically
```

Three modes cover the stack: `enums` (generate the definitions + registry), `type-policies` (Apollo rehydration), and `with-enum-values` (the auto-derived map for resolver/operation types). A complete contracts + server + client setup, every option, and the hand-authored-enum path are in the [docs](https://reharik.github.io/smart-enums/graphql/preset).

## Related packages

| Package | Purpose |
| --- | --- |
| [`@reharik/smart-enum`](https://www.npmjs.com/package/@reharik/smart-enum) | Core library |
| [`@reharik/graphql-codegen-smart-enum`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum) | Definitions (used by `enums` mode) |
| [`@reharik/graphql-codegen-smart-enum-type-policies`](https://www.npmjs.com/package/@reharik/graphql-codegen-smart-enum-type-policies) | Apollo policies (used by `type-policies` mode) |

## License

MIT
