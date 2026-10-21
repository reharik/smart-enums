import { readFileSync } from 'node:fs';
import { defineConfig } from 'tsup';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as {
  version: string;
};

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  // `require('@reharik/eslint-plugin-smart-enum')` returns the plugin, not `{ default }`.
  // (tsup only applies the runtime half of cjsInterop when splitting is on.)
  cjsInterop: true,
  splitting: true,
  dts: { resolve: true },
  sourcemap: true,
  clean: true,
  outDir: 'dist',
  target: 'es2022',
  define: { __PACKAGE_VERSION__: JSON.stringify(pkg.version) },
});
