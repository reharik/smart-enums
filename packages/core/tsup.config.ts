import { defineConfig } from 'tsup';

export default defineConfig({
  entry: [
    'src/index.ts',
    'src/core.ts',
    'src/transport.ts',
    'src/database.ts',
    'src/graphql.ts',
  ],
  format: ['esm', 'cjs'],
  splitting: false,
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
});
