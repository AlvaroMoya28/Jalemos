// Re-exports React Native's useColorScheme hook so other files import from a
// consistent alias (@/hooks/use-color-scheme) regardless of platform.
// The .web variant overrides this for web-specific behavior.
export { useColorScheme } from 'react-native';
