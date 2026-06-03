import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';

export const badge = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  text: { fontSize: 11, fontFamily: Fonts.headingBold },
});

export const starsInline = StyleSheet.create({
  row: { flexDirection: 'row', gap: 1 },
});

export const loadingOverlay = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container:     { flex: 1, backgroundColor: c.screenBg },
    heroHeader:    { paddingHorizontal: Brand.grid.margin, paddingTop: 58, paddingBottom: 14 },
    heroMini:      { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle:     { color: Brand.colors.black.b1, fontSize: 28, fontFamily: Fonts.headingHeavy },
    heroSub:       { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading, marginTop: 2 },
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      flex: 1,
    },
    // Single scrollable content area — filters + cards together
    scrollContent: {
      paddingTop: 16,
      paddingBottom: 100,
    },
    // Search
    searchRow:  { paddingHorizontal: Brand.grid.margin, paddingBottom: 12 },
    searchBox: {
      flexDirection: 'row', alignItems: 'center', gap: 8,
      backgroundColor: c.surfaceAlt,
      borderRadius: Brand.radius[12],
      borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 12, paddingVertical: 9,
    },
    searchInput: { flex: 1, color: c.textPrimary, fontFamily: Fonts.sans, fontSize: 14 },
    // Filter groups
    filterGroup: { paddingHorizontal: Brand.grid.margin, paddingBottom: 12 },
    filterLabel: {
      color: c.textMuted, fontSize: 11, fontFamily: Fonts.headingBold,
      textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 7,
    },
    chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: {
      borderRadius: 999, borderWidth: 1,
      paddingHorizontal: 12, paddingVertical: 6,
      overflow: 'hidden',
    },
    filterChipText: { fontSize: 12, fontFamily: Fonts.heading },
    // Clear filters button
    clearRow:   { paddingHorizontal: Brand.grid.margin, paddingBottom: 4 },
    clearBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
      paddingHorizontal: 10, paddingVertical: 5,
      borderRadius: 999, borderWidth: 1,
      overflow: 'hidden',
    },
    clearBtnText: { fontSize: 12, fontFamily: Fonts.heading },
    listDivider: {
      height: StyleSheet.hairlineWidth, backgroundColor: c.border,
      marginHorizontal: Brand.grid.margin, marginTop: 12, marginBottom: 14,
    },
    // Cards
    list:     { paddingHorizontal: Brand.grid.margin, gap: 10 },
    card:          { borderRadius: Brand.radius[16], padding: Brand.spacing[16] },
    cardTop:       { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 8 },
    avatar: {
      width: 44, height: 44, borderRadius: 22,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center', flexShrink: 0,
    },
    avatarText:    { fontSize: 15, color: Brand.colors.green.darker, fontFamily: Fonts.headingBold },
    nameBlock:     { flex: 1 },
    name:          { fontSize: 14, color: c.textPrimary, fontFamily: Fonts.headingBold },
    username:      { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 1 },
    badgeRow:      { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
    divider:       { height: StyleSheet.hairlineWidth, backgroundColor: c.border, marginBottom: 8 },
    statsRow:      { flexDirection: 'row', alignItems: 'center', gap: 14 },
    statItem:      { flexDirection: 'row', alignItems: 'center', gap: 4 },
    statText:      { fontSize: 12, color: c.textSecondary, fontFamily: Fonts.heading },
    // Pagination
    pagination: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 16, paddingVertical: 20,
    },
    pageBtn: {
      borderRadius: Brand.radius[8], borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 16, paddingVertical: 8,
    },
    pageBtnText:   { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 13 },
    pageInfo:      { color: c.textMuted, fontFamily: Fonts.sans, fontSize: 13 },
    // Empty / error
    emptyState:    { alignItems: 'center', paddingVertical: 40, gap: 10 },
    emptyText:     { color: c.textMuted, fontFamily: Fonts.heading, fontSize: 14 },
    // Modal overlay
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.52)',
      justifyContent: 'flex-end',
    },
    sheet: {
      borderTopLeftRadius: 24, borderTopRightRadius: 24,
      paddingBottom: 34, paddingTop: 8,
      ...withElevation(800),
    },
    sheetHandle: {
      width: 40, height: 4, borderRadius: 2,
      alignSelf: 'center', marginBottom: 16,
    },
    sheetTitle:    { fontSize: 16, fontFamily: Fonts.headingBold, paddingHorizontal: 20, marginBottom: 8 },
    sheetEmail:    { fontSize: 12, fontFamily: Fonts.sans, paddingHorizontal: 20, marginBottom: 16 },
    sheetDivider:  { height: StyleSheet.hairlineWidth, marginHorizontal: 20, marginBottom: 8 },
    actionBtn: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingVertical: 14,
    },
    actionLabel:   { fontSize: 15, fontFamily: Fonts.heading },
    cancelBtn: {
      marginHorizontal: 16, marginTop: 8,
      borderRadius: Brand.radius[12], paddingVertical: 14,
      alignItems: 'center',
    },
    cancelText:    { fontSize: 15, fontFamily: Fonts.headingBold },
  });
}
