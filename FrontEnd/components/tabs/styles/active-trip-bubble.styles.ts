import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

/** Styles for the InfoRow sub-component. */
export const infoRowStyles = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 2 },
  label: { fontFamily: Fonts.sans, fontSize: 12, width: 76 },
  value: { fontFamily: Fonts.heading, fontSize: 13, flex: 1 },
});

/** Styles for the ActiveTripBubble component. */
export const styles = StyleSheet.create({
  bubble: {
    position: 'absolute', left: 16, right: 16, zIndex: 9999,
    borderRadius: 20, overflow: 'hidden',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 12, elevation: 10,
  },
  bubbleInner:  { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  dot:          { width: 8, height: 8, borderRadius: 4 },
  bubbleState:  { fontFamily: Fonts.headingBold, fontSize: 11 },
  bubbleRoute:  { fontFamily: Fonts.heading, fontSize: 13 },
  modalBg:      { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36,
    maxHeight: '90%', gap: 14,
  },
  handleWrap:   { alignItems: 'center', paddingVertical: 8 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc' },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20 },
  statusDot:    { width: 8, height: 8, borderRadius: 4 },
  statusText:   { fontFamily: Fonts.headingBold, fontSize: 13 },
  card:         { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  divider:      { height: StyleSheet.hairlineWidth },
  boardedBadge: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, padding: 12, borderRadius: 12 },
  boardedText:  { fontFamily: Fonts.heading, fontSize: 13, flex: 1 },
  qrBtn:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13 },
  qrBtnText:    { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
  cancelLink:   { alignItems: 'center', paddingVertical: 8 },
  cancelLinkText: { fontFamily: Fonts.heading, fontSize: 13 },
  // In-progress map + navigation
  mapWrap:      { borderRadius: 14, overflow: 'hidden', height: 180 },
  mapImage:     { width: '100%', height: 180 },
  mapFallback:  { width: '100%', height: 180, alignItems: 'center', justifyContent: 'center', gap: 8 },
  mapFallbackText: { fontFamily: Fonts.heading, fontSize: 13 },
  mapPin:       { position: 'absolute', top: 10, right: 10, width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  navBtn:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 12, paddingVertical: 13, backgroundColor: '#3182ce' },
  navBtnText:   { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
  enjoyBanner:  { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 12 },
  enjoyText:    { fontFamily: Fonts.headingBold, fontSize: 14, flex: 1 },
});
