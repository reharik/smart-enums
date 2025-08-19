module.exports = {
  roots: ['<rootDir>'],
  preset: 'ts-jest/presets/js-with-ts',
  transform: {
    '\\.(ts|tsx)$': ['ts-jest'],
  },
  testEnvironment: 'node',
  moduleDirectories: ['node_modules', '<rootDir>/node_modules', '<rootDir>'],
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  testRegex: '(/__tests__/.*|(\\.|/)(test))\\.tsx?$',
  transformIgnorePatterns: ['node_modules/(?!(case-anything)/)'],
};
