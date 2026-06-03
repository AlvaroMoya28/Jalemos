import { StyleSheet } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';

export const badge = StyleSheet.create({
  wrap: { borderRadius: 999, borderWidth: 1, paddingHorizontal: 8, paddingVertical: 3 },
  text: { fontSize: 11, fontFamily: Fonts.headingBold },
});

export const appCardInline = StyleSheet.create({
  badgeContainer: { alignItems: 'flex-end', gap: 4 },
  dot: { width: 3, height: 3, borderRadius: 2 },
});

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container:      { flex: 1 },
    heroHeader:     { paddingHorizontal: Brand.grid.margin, paddingTop: 58, paddingBottom: 14 },
    heroMini:       { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle:      { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    surface:        {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
    },
    scrollContent:  { paddingTop: 16, paddingBottom: 40 },
    chipsRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: Brand.grid.margin, paddingBottom: 14 },
    filterChip:     { borderRadius: 999, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, overflow: 'hidden' },
    filterChipText: { fontSize: 12, fontFamily: Fonts.heading },
    list:           { paddingHorizontal: Brand.grid.margin, gap: 10 },
    card:           { borderRadius: Brand.radius[16], padding: Brand.spacing[16] },
    cardTop:        { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
    avatar:         {
      width: 42, height: 42, borderRadius: 21,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarText:     { fontSize: 15, color: Brand.colors.green.darker, fontFamily: Fonts.headingBold },
    nameBlock:      { flex: 1 },
    name:           { fontSize: 14, color: c.textPrimary, fontFamily: Fonts.headingBold },
    email:          { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 1 },
    divider:        { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginBottom: 10 },
    detailRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
    vehicleText:    { fontSize: 13, color: c.textSecondary, fontFamily: Fonts.heading },
    plateText:      { fontSize: 13, color: c.textPrimary, fontFamily: Fonts.headingBold },
    metaRow:        { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
    metaText:       { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans },
    // Collapsible section header
    sectionHeader:  {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginHorizontal: Brand.grid.margin, marginTop: 18, marginBottom: 10,
      paddingVertical: 10, paddingHorizontal: 14,
      borderRadius: Brand.radius[12], borderWidth: 1, borderColor: c.border,
      backgroundColor: c.surfaceAlt,
    },
    sectionHeaderLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
    sectionHeaderTitle: { fontSize: 13, fontFamily: Fonts.headingBold, color: c.textPrimary },
    sectionHeaderCount: {
      fontSize: 11, fontFamily: Fonts.heading, color: c.textMuted,
      backgroundColor: c.border, borderRadius: 99, paddingHorizontal: 7, paddingVertical: 2,
    },
    // Pagination
    pagination:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 20 },
    pageBtn:        { borderRadius: Brand.radius[8], borderWidth: 1, borderColor: c.border, paddingHorizontal: 16, paddingVertical: 8 },
    pageBtnText:    { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 13 },
    pageInfo:       { color: c.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
    // Empty
    emptyState:     { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText:      { color: c.textMuted, fontFamily: Fonts.heading, fontSize: 14 },
  });
}
