import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

const SLIDE_HEIGHT = 70;

/** Styles for the shared SlideToAction component. */
export const slideStyles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, paddingTop: 8 },
  track: {
    height: SLIDE_HEIGHT, borderRadius: SLIDE_HEIGHT / 2,
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  thumb: {
    position: 'absolute', left: 4, width: SLIDE_HEIGHT - 8, height: SLIDE_HEIGHT - 8,
    borderRadius: (SLIDE_HEIGHT - 8) / 2, alignItems: 'center', justifyContent: 'center',
  },
  label: { fontFamily: Fonts.headingBold, fontSize: 15, textAlign: 'center' },
});
