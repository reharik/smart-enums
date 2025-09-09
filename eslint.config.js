// eslint.config.js
import eslintJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import importPlugin from 'eslint-plugin-import';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import jestPlugin from 'eslint-plugin-jest';
import prettierPlugin from 'eslint-plugin-prettier';
import eslintConfigPrettier from 'eslint-config-prettier';
import unicorn from 'eslint-plugin-unicorn';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'build/**',
      'coverage/**',
      '.history',
      'eslint.config.js',
      'jest.config.js',
      'jest.config.cjs',
    ],
  },

  eslintJs.configs.recommended,

  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,

  // add unicorn's recommended ruleset
  unicorn.configs['recommended'],

  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    plugins: {
      import: importPlugin,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      'jsx-a11y': jsxA11y,
      jest: jestPlugin,
      prettier: prettierPlugin,
    },
    rules: {
      // TS idioms
      '@typescript-eslint/consistent-type-definitions': ['error', 'type'],
      '@typescript-eslint/no-explicit-any': 'warn',

      // Imports & a11y
      'import/order': ['warn', { 'newlines-between': 'always' }],
      'jsx-a11y/alt-text': 'warn',

      // Unicorn tweaks (their recommended config is strict)
      'unicorn/prevent-abbreviations': 'off', // too noisy for many projects
      'unicorn/filename-case': 'off', // if you don’t want to enforce kebab/pascal
      'unicorn/no-array-reduce': 'off',
      'unicorn/prefer-object-from-entries': 'off',

      // Prettier
      'prettier/prettier': 'warn',
    },
  },

  {
    files: ['**/*.{test,spec}.{ts,tsx,js,jsx}'],
    languageOptions: {
      globals: { ...globals.jest },
    },
    rules: {
      'jest/no-disabled-tests': 'warn',
      'jest/no-focused-tests': 'error',
    },
  },

  eslintConfigPrettier,
];
