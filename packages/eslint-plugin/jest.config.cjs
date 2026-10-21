const { version } = require('./package.json');

module.exports = {
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.tsx?$',
  testPathIgnorePatterns: ['<rootDir>/.history/', '<rootDir>/tests/fixtures/'],
  globalSetup: '<rootDir>/tests/global-setup.cjs',
  globals: { __PACKAGE_VERSION__: version },
  transform: {
    '^.+\\.[tj]s$': [
      '@swc/jest',
      {
        jsc: {
          parser: {
            syntax: 'typescript',
            tsx: false,
          },
          target: 'es2020',
        },
        module: {
          type: 'commonjs',
        },
      },
    ],
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
};
