import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

const CORNER_SIZE   = 24;
const CORNER_BORDER = 3;

export const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlay: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.62)' },
  overlaySide: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.62)' },
  frame: { position: 'absolute', borderWidth: 2, borderColor: Brand.colors.green.normal },
  framePreview: { borderColor: Brand.colors.green.normal, borderWidth: 2.5 },
  // Corner brackets (rectangular frames only)
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: -CORNER_BORDER, left: -CORNER_BORDER,
    borderTopWidth: CORNER_BORDER + 1, borderLeftWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -CORNER_BORDER, right: -CORNER_BORDER,
    borderTopWidth: CORNER_BORDER + 1, borderRightWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -CORNER_BORDER, left: -CORNER_BORDER,
    borderBottomWidth: CORNER_BORDER + 1, borderLeftWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -CORNER_BORDER, right: -CORNER_BORDER,
    borderBottomWidth: CORNER_BORDER + 1, borderRightWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderBottomRightRadius: 10,
  },
  // UI chrome
  topBar: {
    position: 'absolute', top: 54, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  topLabel: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15, textAlign: 'center' },
  instructionWrap: {
    position: 'absolute', bottom: 160, left: 0, right: 0, alignItems: 'center',
  },
  instruction: {
    color: '#fff', fontFamily: Fonts.sans, fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, overflow: 'hidden',
  },
  // Bottom action bar
  bottomBar: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnConfirm: { backgroundColor: Brand.colors.green.normal, borderColor: Brand.colors.green.normal },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  actionBtn: { width: 72, alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 11 },
  // Permissions screen
  permText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 15, textAlign: 'center' },
  permBtn: {
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24, marginTop: 8,
  },
  permBtnText: { color: Brand.colors.black.b1, fontFamily: Fonts.headingBold, fontSize: 14 },
});
