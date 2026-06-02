/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
      tsconfig: {
        allowJs: true,
        esModuleInterop: true,
        jsx: 'react-jsx',
        lib: ['DOM', 'ESNext'],
        module: 'commonjs',
        moduleResolution: 'node',
        resolveJsonModule: true,
        skipLibCheck: true,
        strict: false,
        target: 'ESNext',
      },
    }],
  },
  roots: ['<rootDir>', '<rootDir>/../tests/frontend'],
  modulePaths: ['<rootDir>/node_modules'],
  clearMocks: true,
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^expo-secure-store$': '<rootDir>/__stubs__/expo-secure-store.js',
    '^react-native$': '<rootDir>/__stubs__/react-native.js',
  },
  coverageProvider: 'v8',
  collectCoverageFrom: [
    '<rootDir>/**/*.{ts,tsx}',
    '!<rootDir>/**/*.d.ts',
    '!<rootDir>/node_modules/**',
    '!<rootDir>/.expo/**',
    '!<rootDir>/coverage/**',
    '!<rootDir>/__stubs__/**',
  ],
  coverageDirectory: '<rootDir>/../tests/frontend/coverage',
};
