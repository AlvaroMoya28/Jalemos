// Static styles for the Profile tab screen.
// Theme-dependent styles remain in profile.tsx via makeStyles(colors).

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    heroWrap: { height: 200, position: 'relative' },
    heroImage: { width: '100%', height: 200 },
    heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(10, 63, 57, 0.38)' },
    heroHeader: {
      position: 'absolute', top: 58,
      left: Brand.grid.margin, right: Brand.grid.margin,
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    heroMini: { color: Brand.colors.green.light, fontSize: 13, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 32, fontFamily: Fonts.headingHeavy },
    bellBtn: {
      width: 40, height: 40, borderRadius: 20,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderWidth: 1, borderColor: 'rgba(255,255,255,0.3)',
    },
    bellDot: {
      position: 'absolute', top: 10, right: 10,
      width: 7, height: 7, borderRadius: 4, backgroundColor: '#ffb13e',
    },
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4, paddingTop: 18, paddingBottom: 24,
    },
    profileCard: {
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16],
      padding: 14,
      ...withElevation(200),
    },
    profileTop: { flexDirection: 'row', gap: 10 },
    avatar: {
      width: 62, height: 62, borderRadius: 31,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden',
    },
    avatarText: { color: Brand.colors.black.b1, fontSize: 23, fontFamily: Fonts.headingHeavy },
    avatarPhoto: { width: 62, height: 62, borderRadius: 31 },
    // Edit badge overlaid on the avatar
    avatarEditBadge: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', paddingVertical: 3,
    },
    profileMain: { flex: 1 },
    nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    name: { fontSize: 17, color: c.textPrimary, fontFamily: Fonts.headingBold },
    email: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans, marginTop: 1 },
    ratingRow: { marginTop: 3, flexDirection: 'row', alignItems: 'center', gap: 4 },
    rating: { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 12 },
    ratingSub: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    statsRow: {
      marginTop: 10, borderTopWidth: 1, borderTopColor: c.borderSubtle,
      paddingTop: 10, flexDirection: 'row', justifyContent: 'space-between',
    },
    statItem: { alignItems: 'center', flex: 1 },
    statValue: { fontFamily: Fonts.headingBold, color: c.textPrimary, fontSize: 16 },
    statValueGreen: { fontFamily: Fonts.headingBold, color: Brand.colors.green.normal, fontSize: 16 },
    statLabel: { fontSize: 11, color: c.textMuted, fontFamily: Fonts.sans, marginTop: 2 },
    // Mode toggle
    modeToggleWrap: {
      marginHorizontal: Brand.grid.margin,
      marginTop: 10,
      flexDirection: 'row',
      backgroundColor: c.inputBg,
      borderRadius: 999,
      padding: 4,
      borderWidth: 1,
      borderColor: c.border,
    },
    modeBtn: {
      flex: 1, flexDirection: 'row', alignItems: 'center',
      justifyContent: 'center', gap: 6,
      paddingVertical: 8, borderRadius: 999,
    },
    modeBtnActive: { backgroundColor: Brand.colors.green.normal },
    modeBtnText: { fontSize: 13, fontFamily: Fonts.headingBold, color: c.textMuted },
    modeBtnTextActive: { color: Brand.colors.black.b1 },
    // Action buttons
    favButton: {
      marginTop: 10, marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16], padding: 12,
      flexDirection: 'row', alignItems: 'center', gap: 10,
      ...withElevation(100),
    },
    favIconWrap: {
      width: 38, height: 38, borderRadius: 12,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
    },
    favTextWrap: { flex: 1 },
    favTitle: { color: c.textPrimary, fontFamily: Fonts.headingBold, fontSize: 14 },
    favSub: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    shareButton: {
      marginTop: 10, marginHorizontal: Brand.grid.margin,
      borderRadius: 999, backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
      flexDirection: 'row', gap: 8, paddingVertical: 12,
    },
    shareButtonText: { color: Brand.colors.black.b1, fontSize: 14, fontFamily: Fonts.headingBold },
    // Section cards
    sectionWrap: { marginTop: 12, marginHorizontal: Brand.grid.margin },
    sectionTitle: {
      marginBottom: 6, marginLeft: 2, fontSize: 11,
      color: c.textMuted, textTransform: 'uppercase', fontFamily: Fonts.heading,
    },
    sectionCard: { borderRadius: Brand.radius[16], overflow: 'hidden', ...withElevation(100) },
    vehicleSectionHeader: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 8 },
    vehicleSectionTitle: { color: c.textPrimary, fontSize: 14, fontFamily: Fonts.headingBold },
    vehicleSectionSub: { color: c.textMuted, fontSize: 11, fontFamily: Fonts.sans, marginTop: 2 },
    sectionItem: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      paddingHorizontal: 12, paddingVertical: 11,
    },
    sectionItemBorder: { borderBottomWidth: 1, borderBottomColor: c.borderSubtle },
    sectionDivider: { height: 1, backgroundColor: c.borderSubtle },
    vehicleList: { gap: 8, padding: 12 },
    vehicleCard: {
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.vehicleCardBg, padding: 10,
    },
    vehicleRowTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    vehicleTextWrap: { flex: 1 },
    vehicleNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
    primaryBadge: {
      fontSize: 10, color: Brand.colors.green.dark, fontFamily: Fonts.headingBold,
      borderRadius: 999, borderWidth: 1, borderColor: c.border,
      paddingHorizontal: 8, paddingVertical: 2,
    },
    itemIconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center',
    },
    itemTextWrap: { flex: 1 },
    itemLabel: { color: c.textPrimary, fontFamily: Fonts.heading, fontSize: 14 },
    itemDesc: { color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    walletWrapInPayment: {
      marginVertical: 10, marginHorizontal: 12,
      flexDirection: 'row', justifyContent: 'space-between', gap: 12,
    },
    walletCard: {
      flex: 1, borderRadius: Brand.radius[16],
      backgroundColor: Brand.colors.green.dark,
      padding: 14, minHeight: 120, justifyContent: 'space-between',
      ...withElevation(400),
    },
    walletBrand: { alignSelf: 'flex-end', color: Brand.colors.black.b1, fontSize: 10, fontFamily: Fonts.sans },
    walletNumber: { color: Brand.colors.black.b1, letterSpacing: 1, fontSize: 12, fontFamily: Fonts.sans },
    walletDate: { alignSelf: 'flex-end', color: Brand.colors.black.b1, fontSize: 12, fontFamily: Fonts.sans },
    walletCounter: {
      width: 116, borderRadius: Brand.radius[16], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.walletCounterBg,
      padding: 10, justifyContent: 'center', alignItems: 'center',
      ...withElevation(100),
    },
    walletAmount: { color: Brand.colors.green.normal, fontSize: 28, fontFamily: Fonts.headingHeavy, marginBottom: 8 },
    counterButtons: { flexDirection: 'row', gap: 12 },
    counterCircle: {
      width: 32, height: 32, borderRadius: 16,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center', justifyContent: 'center',
    },
    logoutBtn: {
      marginTop: 14, marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: Brand.colors.alerts.error, backgroundColor: c.logoutBg,
      alignItems: 'center', justifyContent: 'center',
      gap: 6, flexDirection: 'row', paddingVertical: 12,
    },
    logoutText: { color: Brand.colors.alerts.error, fontFamily: Fonts.headingBold, fontSize: 14 },
    sendQrBtn: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
      gap: 8, borderRadius: 12, borderWidth: 1,
      borderColor: Brand.colors.green.normal, backgroundColor: c.surfaceAlt,
      paddingHorizontal: 20, paddingVertical: 11,
    },
    sendQrBtnText: {
      color: Brand.colors.green.normal, fontFamily: Fonts.headingBold, fontSize: 13,
    },
  });
}

export const staticStyles = StyleSheet.create({
  scrollContentContainer: {
    paddingBottom: 24,
  },
  activityIndicatorWrap: {
    marginVertical: 12,
  },
  updateDocIconWrap: {
    backgroundColor: Brand.colors.green.normal + '22',
  },
  updateDocLabel: {
    color: Brand.colors.green.normal,
  },
  qrSectionCard: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 14,
  },
  qrItemDescCentered: {
    textAlign: 'center',
  },
  qrToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 11,
  },
  qrToggleBtnText: {
    color: '#fff',
    fontFamily: Fonts.headingBold,
    fontSize: 13,
  },
  sendQrBtnDisabled: {
    opacity: 0.5,
  },
});
