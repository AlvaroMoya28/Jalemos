import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

export const androidStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
  },
  sheet: {
    borderTopLeftRadius: Brand.radius[24],
    borderTopRightRadius: Brand.radius[24],
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 12,
  },
  title: {
    fontSize: 16,
    fontFamily: Fonts.heading,
    textAlign: 'center',
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    justifyContent: 'center',
    marginTop: 4,
  },
  btnText: {
    color: '#ffffff',
    fontFamily: Fonts.headingBold,
    fontSize: 14,
  },
  cancelBtn: {
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 4,
  },
  cancelText: {
    fontFamily: Fonts.sans,
    fontSize: 14,
  },
});

export const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapFull: {
    flex: 1,
  },
  noCoordsFallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  noCoordsTitle: {
    fontFamily: Fonts.heading,
    fontSize: 16,
    marginTop: 12,
  },
  noCoordsBody: {
    fontFamily: Fonts.sans,
    color: '#707070',
    textAlign: 'center',
    marginTop: 8,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  routeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    backgroundColor: 'rgba(0,0,0,0.62)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.colors.green.normal,
    flexShrink: 0,
  },
  chipText: {
    color: '#ffffff',
    fontFamily: Fonts.heading,
    fontSize: 12,
    flexShrink: 1,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.62)',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
