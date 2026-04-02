module.exports = {
  roots: ['<rootDir>'],
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.tsx?$',
  testPathIgnorePatterns: ['<rootDir>/.history/'],
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
  transformIgnorePatterns: ['node_modules/(?!(case-anything)/)'],
};
