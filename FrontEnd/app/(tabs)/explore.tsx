import { View } from 'react-native';

// Hidden tab — kept only so Expo Router doesn't complain about the registered route.
// The tab bar hides it via href: null in (tabs)/_layout.tsx.
export default function ExploreScreen() {
  return <View />;
}
