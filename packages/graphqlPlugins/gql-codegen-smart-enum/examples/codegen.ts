import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './examples/schema.graphql',
  generates: {
    './examples/generated/graphql-types.ts': {
      plugins: ['typescript'],
    },
    './examples/generated/graphql-smart-enums.ts': {
      plugins: ['./dist/index.js'],
      config: {
        emitDescriptionsAsDisplay: true,
      },
    },
  },
};

export default config;
