// Styles for the Add Vehicle screen.
// Static styles go directly in StyleSheet.create; dynamic styles (colour-dependent)
// are produced by makeStyles() which is called inside the component with useMemo.

import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container:   { flex: 1, backgroundColor: c.screenBg },
    header:      { paddingHorizontal: Brand.grid.margin, paddingTop: 58, paddingBottom: 14, backgroundColor: '#0a3f39' },
    headerMini:  { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    headerTitle: { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    surface:     {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
    },
    scroll:      { padding: Brand.grid.margin, gap: 14 },
    infoBox:     {
      flexDirection: 'row', gap: 10, alignItems: 'flex-start',
      backgroundColor: Brand.colors.green.normal + '18',
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: Brand.colors.green.normal + '44',
      padding: 12,
    },
    infoText:    { flex: 1, fontSize: 13, fontFamily: Fonts.sans, color: c.textSecondary, lineHeight: 19 },
    card:        { borderRadius: Brand.radius[16], padding: 16, gap: 12 },
    sectionLabel:{ fontSize: 11, color: c.textMuted, textTransform: 'uppercase', fontFamily: Fonts.heading, marginBottom: 2 },
    inputRow:    {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    input:       { flex: 1, fontSize: 14, color: c.inputText, fontFamily: Fonts.sans },
    row2:        { flexDirection: 'row', gap: 10 },
    // Dropdown trigger
    dropdownBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    dropdownText:       { flex: 1, fontSize: 14, fontFamily: Fonts.sans, color: c.inputText },
    dropdownPlaceholder:{ flex: 1, fontSize: 14, fontFamily: Fonts.sans, color: c.textPlaceholder },
    plateHint:   { fontSize: 10, fontFamily: Fonts.sans, color: c.textMuted, marginTop: -8, marginLeft: 2 },
    cta:         {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999, paddingVertical: 14,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 8, marginTop: 4,
    },
    ctaText:     { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.headingBold },
    // Success state
    successWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Brand.grid.margin, gap: 16 },
    successIcon: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: Brand.colors.green.normal + '22',
      alignItems: 'center', justifyContent: 'center',
    },
    successTitle: { fontSize: 20, fontFamily: Fonts.headingBold, color: c.textPrimary, textAlign: 'center' },
    successSub:   { fontSize: 14, fontFamily: Fonts.sans, color: c.textMuted, textAlign: 'center', lineHeight: 21 },
    backBtn:      {
      borderRadius: 999, borderWidth: 1,
      borderColor: c.border, paddingVertical: 12, paddingHorizontal: 28,
    },
    backBtnText:  { color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 14 },
  });
}
