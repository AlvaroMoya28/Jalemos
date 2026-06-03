import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';

export const resolvedLabelInline = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  text: { fontSize: 11, fontFamily: Fonts.headingBold },
});

export const metaDotInline = StyleSheet.create({
  dot: { width: 3, height: 3, borderRadius: 2 },
  pendingActionsContainer: { marginLeft: 'auto' as any },
  pendingActionsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});

export const sheetReasonCard = StyleSheet.create({
  card: { borderRadius: Brand.radius[12], padding: 12, gap: 4 },
  reasonLabel: { fontSize: 12, fontFamily: Fonts.headingBold, textTransform: 'uppercase' },
  reasonValue: { fontSize: 13, fontFamily: Fonts.heading },
  reasonDetails: { fontSize: 12, fontFamily: Fonts.sans, lineHeight: 17, marginTop: 2 },
});

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    heroHeader: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 58, paddingBottom: 14,
    },
    heroMini: { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
    },
    scrollContent: { paddingTop: 16, paddingBottom: 40 },
    chipsRow: {
      flexDirection: 'row', flexWrap: 'wrap', gap: 8,
      paddingHorizontal: Brand.grid.margin, paddingBottom: 14,
    },
    filterChip: {
      borderRadius: 999, borderWidth: 1,
      paddingHorizontal: 12, paddingVertical: 6,
      overflow: 'hidden',
    },
    filterChipText: { fontSize: 12, fontFamily: Fonts.heading },
    list: { paddingHorizontal: Brand.grid.margin, gap: 10 },
    card: { borderRadius: Brand.radius[16], padding: Brand.spacing[16], gap: 10 },
    cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
    avatar: {
      width: 40, height: 40, borderRadius: 20,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarText: { fontSize: 14, color: Brand.colors.green.darker, fontFamily: Fonts.headingBold },
    cardInfo: { flex: 1 },
    reportedName: { fontSize: 14, color: c.textPrimary, fontFamily: Fonts.headingBold },
    reportedRole: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 1 },
    reasonBadge: {
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
      borderWidth: 1,
    },
    reasonText: { fontSize: 11, fontFamily: Fonts.headingBold },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: c.border },
    detailsText: {
      fontSize: 12, color: c.textSecondary,
      fontFamily: Fonts.sans, lineHeight: 17,
    },
    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    metaText: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans },
    resolvedBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3,
    },
    resolvedText: { fontSize: 11, fontFamily: Fonts.headingBold },
    emptyState: { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText: { color: c.textMuted, fontFamily: Fonts.heading, fontSize: 14 },
    // Action sheet
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 16,
      paddingBottom: 32,
      gap: 14,
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: c.border, alignSelf: 'center', marginBottom: 4,
    },
    sheetTitle: { fontSize: 16, color: c.textPrimary, fontFamily: Fonts.headingBold, textAlign: 'center' },
    sheetReported: { fontSize: 13, color: c.textMuted, fontFamily: Fonts.sans, textAlign: 'center', marginTop: -6 },
    sheetSection: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.headingBold, textTransform: 'uppercase' },
    suspensionRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
    suspensionChip: {
      flex: 1, minWidth: 70,
      borderRadius: 999, borderWidth: 1,
      borderColor: '#ff7c2a55', backgroundColor: '#ff7c2a18',
      alignItems: 'center', paddingVertical: 10,
    },
    suspensionChipText: { color: '#ff7c2a', fontFamily: Fonts.headingBold, fontSize: 13 },
    btnDeactivate: {
      borderRadius: 999, backgroundColor: Brand.colors.alerts.error,
      alignItems: 'center', paddingVertical: 13,
    },
    btnDeactivateText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
    btnDismiss: {
      borderRadius: 999, borderWidth: 1,
      borderColor: c.border, backgroundColor: c.surfaceAlt,
      alignItems: 'center', paddingVertical: 13,
    },
    btnDismissText: { color: c.textSecondary, fontFamily: Fonts.heading, fontSize: 14 },
  });
}
