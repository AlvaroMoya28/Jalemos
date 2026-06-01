/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>', '<rootDir>/../tests/frontend'],
  clearMocks: true,
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/node_modules/**',
    '!<rootDir>/.expo/**',
    '!<rootDir>/coverage/**',
  ],
  coverageDirectory: '<rootDir>/../tests/frontend/coverage',
};
