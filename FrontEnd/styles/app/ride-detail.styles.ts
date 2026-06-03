// Static styles for the Ride Detail screen.
// Theme-dependent styles remain in ride-detail.tsx via makeStyles(colors).

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const MAP_HEIGHT = 220;

export const staticStyles = StyleSheet.create({
  starRatingRow: {
    flexDirection: 'row',
    gap: 1,
  },
});

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: 12,
      backgroundColor: c.screenBg,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: c.surface,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      ...withElevation(100),
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
      marginHorizontal: 8,
    },
    headerSpacer: {
      width: 38,
    },
    // Map
    mapContainer: {
      height: MAP_HEIGHT,
      backgroundColor: c.surfaceAlt,
      overflow: 'hidden',
    },
    mapImage: {
      width: '100%',
      height: MAP_HEIGHT,
    },
    mapFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
    },
    mapFallbackText: {
      fontFamily: Fonts.heading,
      fontSize: 14,
      color: c.textMuted,
    },
    mapExpandBtn: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: 'rgba(0,0,0,0.52)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.25)',
    },
    mapBadgesRow: {
      position: 'absolute',
      bottom: 32,
      left: 12,
      right: 12,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    mapBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: 'rgba(0,0,0,0.58)',
      borderRadius: 999,
      paddingHorizontal: 10,
      paddingVertical: 5,
      maxWidth: '46%',
    },
    mapDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
      flexShrink: 0,
    },
    mapBadgeText: {
      color: '#ffffff',
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    // Surface
    surface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -20,
      paddingTop: 20,
      paddingHorizontal: Brand.grid.margin,
      paddingBottom: 12,
      gap: 12,
    },
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[16],
    },
    // Route inside trip card
    routeRow: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'stretch',
    },
    routeLine: {
      alignItems: 'center',
      paddingTop: 3,
      gap: 0,
    },
    routeDot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      width: 2,
      flex: 1,
      backgroundColor: c.border,
      marginVertical: 4,
      minHeight: 20,
    },
    routePlaces: {
      flex: 1,
      gap: 8,
      paddingBottom: 2,
    },
    routePlaceBlock: {
      gap: 1,
    },
    routeLabel: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
    },
    routePlace: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
      marginVertical: 12,
    },
    // Detail grid 2×2
    detailGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    detailCell: {
      width: '50%',
      alignItems: 'flex-start',
      gap: 4,
      paddingVertical: 10,
      paddingHorizontal: 4,
    },
    detailCellRight: {
      paddingLeft: 16,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.border,
    },
    detailCellBottom: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    detailLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
    },
    detailValue: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    detailValueGreen: {
      color: Brand.colors.green.normal,
    },
    detailIcon: {
      marginBottom: 2,
    },
    notesRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'flex-start',
    },
    notesText: {
      flex: 1,
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 18,
    },
    // Driver card
    driverHeader: {
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
    },
    driverAvatar: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    driverAvatarText: {
      fontSize: 18,
      color: Brand.colors.green.darker,
      fontFamily: Fonts.headingBold,
    },
    driverInfo: {
      flex: 1,
      gap: 4,
    },
    driverNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    driverName: {
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    verifiedBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: Brand.colors.green.normal + '1a',
      borderRadius: 999,
      paddingHorizontal: 7,
      paddingVertical: 2,
      borderWidth: 1,
      borderColor: Brand.colors.green.normal + '44',
    },
    verifiedText: {
      fontSize: 10,
      color: Brand.colors.green.dark,
      fontFamily: Fonts.heading,
    },
    driverRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    driverRatingText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    // Driver stats row
    statsRow: {
      flexDirection: 'row',
    },
    statCell: {
      flex: 1,
      alignItems: 'center',
      gap: 3,
      paddingVertical: 6,
    },
    statCellDivider: {
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: c.border,
    },
    statValue: {
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      textAlign: 'center',
    },
    statLabel: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
      textAlign: 'center',
    },
    // Reviews
    reviewsSection: {
      gap: 8,
    },
    sectionTitle: {
      fontSize: 15,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      marginBottom: 2,
    },
    reviewCard: {
      borderRadius: Brand.radius[12],
      padding: 12,
      gap: 8,
    },
    reviewHeader: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
    },
    reviewAvatar: {
      width: 34,
      height: 34,
      borderRadius: 17,
      backgroundColor: c.surfaceAlt,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.border,
      flexShrink: 0,
    },
    reviewAvatarText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.headingBold,
    },
    reviewMeta: {
      flex: 1,
      gap: 3,
    },
    reviewerName: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    reviewRatingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    reviewDate: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    reviewComment: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 19,
    },
    // Booking panel
    bookingPanel: {
      backgroundColor: c.surface,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 14,
      ...withElevation(400),
    },
    bookingRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      marginBottom: 12,
    },
    bookingGroup: {
      flex: 1,
      gap: 3,
    },
    bookingLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
    },
    seatCounter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    seatBtn: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seatBtnDisabled: {
      backgroundColor: c.surfaceAlt,
      borderWidth: 1,
      borderColor: c.border,
    },
    seatNumber: {
      fontSize: 18,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      minWidth: 24,
      textAlign: 'center',
    },
    totalPrice: {
      fontSize: 22,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
    },
    reserveBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    reserveBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 15,
    },
    // Vehicle card
    vehicleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    vehicleIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    vehicleInfo: {
      flex: 1,
      gap: 6,
    },
    vehicleModel: {
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    vehiclePlateBadge: {
      alignSelf: 'flex-start',
      backgroundColor: c.surfaceAlt,
      borderRadius: Brand.radius[8],
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 10,
      paddingVertical: 3,
    },
    vehiclePlateText: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.heading,
      letterSpacing: 1,
    },
    // Error state
    errorContainer: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 14,
    },
    errorText: {
      fontSize: 16,
      color: c.textSecondary,
      fontFamily: Fonts.heading,
    },
    errorBackBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      paddingHorizontal: 24,
      paddingVertical: 12,
    },
    errorBackBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
  });
}
