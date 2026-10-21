import type { FlatConfig } from '@typescript-eslint/utils/ts-eslint';
import { noSmartEnumReferenceEquality } from './rules/no-smart-enum-reference-equality.js';

const plugin = {
  meta: {
    name: '@reharik/eslint-plugin-smart-enum',
    version: __PACKAGE_VERSION__,
  },
  rules: {
    'no-smart-enum-reference-equality': noSmartEnumReferenceEquality,
  },
  configs: {} as { recommended: FlatConfig.Config },
};

// No parser / parserOptions here on purpose: the consumer owns type-aware setup.
plugin.configs.recommended = {
  plugins: { 'smart-enum': plugin },
  rules: { 'smart-enum/no-smart-enum-reference-equality': 'error' },
};

export default plugin;
