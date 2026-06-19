import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  overlay:      { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 20, paddingTop: 8, paddingBottom: 36,
  },
  handleWrap:   { alignItems: 'center', paddingVertical: 8 },
  handle:       { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc' },
  title:        { fontFamily: Fonts.headingBold, fontSize: 18, marginBottom: 4, textAlign: 'center' },
  subtitle:     { fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center', marginBottom: 16 },
  typeRow:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  typeBtn: {
    flex: 1, borderRadius: 12, borderWidth: 1.5, paddingVertical: 12,
    alignItems: 'center', gap: 6,
  },
  typeBtnLabel: { fontFamily: Fonts.headingBold, fontSize: 12 },
  inputLabel:   { fontFamily: Fonts.headingBold, fontSize: 13, marginBottom: 6 },
  input: {
    borderRadius: 12, borderWidth: 1, padding: 12,
    fontFamily: Fonts.sans, fontSize: 14,
    minHeight: 90, textAlignVertical: 'top',
  },
  charCount:    { fontFamily: Fonts.sans, fontSize: 11, textAlign: 'right', marginTop: 4, marginBottom: 16 },
  submitBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    justifyContent: 'center', flexDirection: 'row', gap: 8,
  },
  submitBtnText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15 },
  cancelLink:   { alignItems: 'center', paddingVertical: 12 },
  cancelText:   { fontFamily: Fonts.sans, fontSize: 13 },
  formContent:  { gap: 0, paddingBottom: 8 },
  successWrap:  { alignItems: 'center', paddingVertical: 24, gap: 12 },
  successTitle: { fontFamily: Fonts.headingBold, fontSize: 18 },
  successBody:  { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center' },
  doneBtn:      { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, marginTop: 8 },
  doneBtnText:  { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15 },
});
