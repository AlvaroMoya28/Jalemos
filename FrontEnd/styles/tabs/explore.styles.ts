import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  exploreTitleText: {
    fontFamily: Fonts.rounded,
  },
  reactLogoImage: {
    width: 100,
    height: 100,
    alignSelf: 'center',
  },
  monoText: {
    fontFamily: Fonts.mono,
  },
});
