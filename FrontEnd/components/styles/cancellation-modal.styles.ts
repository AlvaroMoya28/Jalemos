import { StyleSheet } from 'react-native';
import { Fonts } from '@/constants/theme';

export const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 36,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 8,
  },
  title: { fontFamily: Fonts.headingHeavy, fontSize: 20, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.sans, fontSize: 13, textAlign: 'center' },
  option: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 6,
  },
  radio: {
    width: 18, height: 18, borderRadius: 9, borderWidth: 2,
    borderColor: '#aaa', alignItems: 'center', justifyContent: 'center',
  },
  radioInner: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  optionLabel: { fontFamily: Fonts.heading, fontSize: 14, flex: 1 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: Fonts.sans, fontSize: 13, minHeight: 80, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10, marginTop: 4 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.headingBold, fontSize: 14 },
  scrollView: { maxHeight: 260 },
});
