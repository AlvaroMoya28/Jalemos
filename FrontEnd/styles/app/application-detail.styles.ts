// Styles for the Application Detail screen.
// Static styles (colour-independent) are exported as `styles`.
// Dynamic styles (colour-dependent) are produced by makeStyles(), called with useMemo inside the component.

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export const styles = StyleSheet.create({
  photosRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionRow: { gap: 10 },
  btnPrimary: {
    borderRadius: 999, backgroundColor: Brand.colors.green.normal,
    alignItems: 'center', paddingVertical: 13,
  },
  btnPrimaryText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
  btnWarning: {
    borderRadius: 999, backgroundColor: '#ff7c2a',
    alignItems: 'center', paddingVertical: 13,
  },
  btnWarningText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
  btnDanger: {
    borderRadius: 999,
    borderWidth: 1, borderColor: Brand.colors.alerts.error,
    backgroundColor: Brand.colors.alerts.error + '18',
    alignItems: 'center', paddingVertical: 13,
  },
  btnDangerText: { color: Brand.colors.alerts.error, fontFamily: Fonts.headingBold, fontSize: 14 },
  feedbackBox: {
    borderRadius: Brand.radius[12], padding: 12, gap: 6,
    backgroundColor: '#ff7c2a18', borderWidth: 1, borderColor: '#ff7c2a44',
  },
  feedbackTitle: { fontSize: 12, color: '#ff7c2a', fontFamily: Fonts.headingBold },
});

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return {
    ...styles,
    ...StyleSheet.create({
      container: { flex: 1, backgroundColor: c.screenBg },
      header: {
        flexDirection: 'row' as const, alignItems: 'center' as const,
        paddingHorizontal: Brand.grid.margin, paddingVertical: 12,
        backgroundColor: c.screenBg,
      },
      backBtn: {
        width: 38, height: 38, borderRadius: 19,
        backgroundColor: c.surface,
        alignItems: 'center' as const, justifyContent: 'center' as const,
        borderWidth: 1, borderColor: c.border,
        ...withElevation(100),
      },
      headerTitle: {
        flex: 1, textAlign: 'center' as const,
        color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 16,
      },
      statusBadge: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 5,
        borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1,
      },
      content: { paddingHorizontal: Brand.grid.margin, paddingBottom: 32, gap: 14 },
      card: { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 12 },
      sectionLabel: {
        fontSize: 11, color: c.textMuted,
        fontFamily: Fonts.headingBold, textTransform: 'uppercase' as const,
      },
      infoRow: { flexDirection: 'row' as const, justifyContent: 'space-between' as const, gap: 8 },
      infoCell: { flex: 1 },
      infoKey: { fontSize: 10, color: c.textMuted, fontFamily: Fonts.sans, textTransform: 'uppercase' as const, marginBottom: 2 },
      infoValue: { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.heading },
      divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
      issueItem: {
        flexDirection: 'row' as const, alignItems: 'center' as const, gap: 10,
        paddingVertical: 10, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border,
      },
      issueText: { flex: 1, fontSize: 13, color: c.textSecondary, fontFamily: Fonts.sans },
      checkbox: {
        width: 22, height: 22, borderRadius: 6, borderWidth: 2,
        alignItems: 'center' as const, justifyContent: 'center' as const, flexShrink: 0,
      },
      notesInput: {
        borderRadius: Brand.radius[12], borderWidth: 1,
        borderColor: c.border, backgroundColor: c.inputBg,
        paddingHorizontal: 12, paddingVertical: 10,
        fontSize: 13, color: c.inputText, fontFamily: Fonts.sans,
        minHeight: 80, textAlignVertical: 'top' as const,
      },
      btnSecondary: {
        borderRadius: 999, borderWidth: 1,
        borderColor: c.border, backgroundColor: c.surfaceAlt,
        alignItems: 'center' as const, paddingVertical: 13,
      },
      btnSecondaryText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
      feedbackText: { fontSize: 12, color: c.textSecondary, fontFamily: Fonts.sans, lineHeight: 18 },
    }),
  };
}
