import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export const stepStyles = StyleSheet.create({
  dot:   { width: 28, height: 28, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#fff' },
  line:  { flex: 1, width: 2, minHeight: 16, marginTop: 4 },
  label: { fontSize: 14, fontFamily: Fonts.headingBold },
  sub:   { fontSize: 12, fontFamily: Fonts.sans, marginTop: 3, lineHeight: 17 },
  stepRow: { flexDirection: 'row', gap: 14 },
  dotColumn: { alignItems: 'center', width: 28 },
  textColumn: { flex: 1, paddingTop: 2 },
  notFoundText: { fontSize: 14 },
  spacerRight: { width: 38 },
});

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.screenBg },
    header:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Brand.grid.margin, paddingVertical: 12, backgroundColor: c.screenBg },
    backBtn:     { width: 38, height: 38, borderRadius: 19, backgroundColor: c.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.border, ...withElevation(100) },
    headerTitle: { flex: 1, textAlign: 'center', color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 16 },
    content:     { paddingHorizontal: Brand.grid.margin, paddingBottom: 32, gap: 14 },
    card:        { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 12 },
    label:       { fontSize: 11, color: c.textMuted, fontFamily: Fonts.headingBold, textTransform: 'uppercase' },
    infoRow:     { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    infoCell:    { flex: 1 },
    infoKey:     { fontSize: 10, color: c.textMuted, fontFamily: Fonts.sans, textTransform: 'uppercase', marginBottom: 2 },
    infoValue:   { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.heading },
    feedbackBox: { borderRadius: Brand.radius[12], padding: 12, gap: 6, backgroundColor: '#ff7c2a18', borderWidth: 1, borderColor: '#ff7c2a44' },
    feedbackTitle: { fontSize: 12, color: '#ff7c2a', fontFamily: Fonts.headingBold },
    feedbackText:  { fontSize: 12, color: c.textSecondary, fontFamily: Fonts.sans, lineHeight: 18 },
    resubmitBtn: { borderRadius: 999, backgroundColor: Brand.colors.green.normal, alignItems: 'center', paddingVertical: 13 },
    resubmitText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    backBtnFull: { borderRadius: 999, borderWidth: 1, borderColor: c.border, backgroundColor: c.surfaceAlt, alignItems: 'center', paddingVertical: 13 },
    backBtnFullText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
  });
}
