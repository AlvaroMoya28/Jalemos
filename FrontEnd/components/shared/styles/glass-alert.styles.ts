import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 26,
    alignItems: 'center',
    gap: 0,
    // Shadow / glow
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 40,
    elevation: 20,
  },
  // Thin top rim that catches light — key glassmorphism detail
  rimHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  rimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: {
    fontFamily: Fonts.headingHeavy,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.headingBold,
    fontSize: 14,
  },
  iconMargin: {
    marginBottom: 6,
  },
});
