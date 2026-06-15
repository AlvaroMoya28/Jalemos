import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 12 },
  frame: {
    borderRadius: Brand.radius[12],
    borderWidth: 2,
    padding: 10,
    backgroundColor: '#fff',
  },
  label: {
    fontFamily: Fonts.sans,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
});
