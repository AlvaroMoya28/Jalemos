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
    // Native module stubs (order matters — more specific first)
    '^expo-secure-store$':                    '<rootDir>/__stubs__/expo-secure-store.js',
    '^expo-haptics$':                         '<rootDir>/__stubs__/expo-haptics.js',
    '^expo-router$':                          '<rootDir>/__stubs__/expo-router.js',
    '^expo-web-browser$':                     '<rootDir>/__stubs__/expo-web-browser.js',
    '^expo-symbols$':                         '<rootDir>/__stubs__/expo-symbols.js',
    '^@expo/vector-icons/(.*)$':              '<rootDir>/__stubs__/expo-vector-icons.js',
    '^@expo/vector-icons$':                   '<rootDir>/__stubs__/expo-vector-icons.js',
    '^@react-navigation/elements$':           '<rootDir>/__stubs__/react-navigation-elements.js',
    '^@react-navigation/bottom-tabs$':        '<rootDir>/__stubs__/react-navigation-bottom-tabs.js',
    '^react-native$':                         '<rootDir>/__stubs__/react-native.js',
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
