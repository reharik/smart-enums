import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/core.ts', 'src/transport.ts', 'src/database.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
});
