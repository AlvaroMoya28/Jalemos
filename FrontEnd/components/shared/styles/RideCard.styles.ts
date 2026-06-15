import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';
import { StyleSheet } from 'react-native';

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[12],
      ...withElevation(100),
    },
    rowTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      marginBottom: 10,
      gap: 12,
    },
    routeBlock: {
      flex: 1,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    originDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      height: 10,
      borderLeftWidth: 2,
      borderLeftColor: c.border,
      marginLeft: 3,
      marginVertical: 3,
    },
    routeText: {
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
      flexShrink: 1,
    },
    // Update in the price pill styles, now it doesn't interfere with the route info
    pricePill: {
      backgroundColor: Brand.colors.green.light,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 16,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 72,
    },
    pricePillText: {
      fontSize: 16,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.darker,
    },
    priceBlock: {
      alignItems: "center",
    },
    price: {
      fontSize: 19,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    caption: {
      fontSize: 10,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      marginTop: 6,
    },
    detailsRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginBottom: 10,
    },
    detailItem: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },
    detailText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    driverRow: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 10,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    avatar: {
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: Brand.colors.green.light,
      alignItems: "center",
      justifyContent: "center",
    },
    avatarText: {
      fontSize: 12,
      color: Brand.colors.green.darker,
      fontFamily: Fonts.headingBold,
    },
    driverName: {
      flex: 1,
      fontSize: 12,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    ratingRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    ratingText: {
      fontSize: 12,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    statusRow: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      paddingTop: 8,
      marginTop: 8,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusDot: {
      width: 7,
      height: 7,
      borderRadius: 4,
    },
    statusText: {
      fontSize: 11,
      fontFamily: Fonts.headingBold,
    },
  });
}
