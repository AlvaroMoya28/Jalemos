import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    fontSize: 12,
    fontFamily: Fonts.heading,
  },
  // Dropdown is absolutely positioned within the Modal at the measured screen coords.
  // backgroundColor and borderColor are always supplied as inline styles by the component
  // so they adapt to the active theme. Hardcoded colors here would cause white-on-white
  // in dark mode because StyleSheet.create values can win over inline overrides on some RN versions.
  dropdown: {
    position: 'absolute',
    borderRadius: Brand.radius[12],
    overflow: 'hidden',
    borderWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 11,
    paddingHorizontal: 12,
  },
  locationItem: {},
  itemTexts: {
    flex: 1,
    gap: 1,
  },
  mainText: {
    fontFamily: Fonts.heading,
    fontSize: 13,
  },
  secondaryText: {
    fontFamily: Fonts.sans,
    fontSize: 11,
  },
  iconTopOffset: {
    marginTop: 2,
  },
});
