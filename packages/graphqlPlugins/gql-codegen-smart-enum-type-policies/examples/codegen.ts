import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './examples/schema.graphql',
  generates: {
    './examples/generated/graphql-types.ts': {
      plugins: ['typescript'],
    },
    './examples/generated/graphql-smart-enums.ts': {
      plugins: ['../gql-codegen-smart-enum/dist/index.js'],
      config: {
        emitDescriptionsAsDisplay: true,
      },
    },
    './examples/generated/graphql-smart-enum-type-policies.ts': {
      plugins: ['./dist/index.js'],
      config: {
        enumImportPath: './graphql-smart-enums',
      },
    },
  },
};

export default config;
