import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

const SLIDE_HEIGHT = 70;

/** Styles for the main BoardingScreen component. */
export const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12 },
  stateBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  stateDot: { width: 6, height: 6, borderRadius: 3 },
  stateText: { fontFamily: Fonts.headingBold, fontSize: 12 },
  cancelBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  cancelBtnText: { fontFamily: Fonts.heading, fontSize: 12, color: '#e53e3e' },
  routeCard: { marginHorizontal: 16, borderRadius: 12, borderWidth: 1, padding: 14, gap: 8, marginBottom: 16 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  routeText: { fontFamily: Fonts.heading, fontSize: 13, flex: 1 },
  routeDivider: { height: StyleSheet.hairlineWidth, marginLeft: 22 },
  sectionTitle: { fontFamily: Fonts.headingBold, fontSize: 11, paddingHorizontal: 16, marginBottom: 4 },
  graceCard: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginHorizontal: 16 },
  graceText: { fontFamily: Fonts.sans, fontSize: 13, color: '#f4a522' },
  scanBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 16, borderRadius: 14, paddingVertical: 14,
    backgroundColor: Brand.colors.green.dark,
  },
  scanBtnText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15 },
});

/** Styles for the PassengerRow sub-component. */
export const passengerRowStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, borderWidth: 1, padding: 12, marginHorizontal: 16 },
  name: { fontFamily: Fonts.heading, fontSize: 14 },
  seats: { fontFamily: Fonts.sans, fontSize: 11 },
  noShowBtn: { backgroundColor: '#e53e3e', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  noShowText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 11 },
});

/** Styles for the SlideToAction sub-component. */
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
