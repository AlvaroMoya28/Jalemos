import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';

export const myRidesInline = StyleSheet.create({
  scrollContentPadding: { paddingBottom: 26 },
  tripCardWrapper: { position: 'relative' },
  expiredBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    backgroundColor: Brand.colors.alerts.error,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  expiredBadgeText: { color: '#fff', fontSize: 10, fontFamily: Fonts.headingBold },
});

const HERO_HEIGHT = 200;

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    heroWrap: {
      height: HERO_HEIGHT,
      position: "relative",
    },
    heroImage: {
      width: "100%",
      height: HERO_HEIGHT,
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: "rgba(10, 63, 57, 0.38)",
    },
    heroHeader: {
      position: "absolute",
      top: 58,
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "rgba(255, 255, 255, 0.2)",
      borderWidth: 1,
      borderColor: "rgba(255, 255, 255, 0.3)",
    },
    bellDot: {
      position: "absolute",
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: "#ffb13e",
    },
    heroMini: {
      color: Brand.colors.green.light,
      fontSize: 13,
      fontFamily: Fonts.heading,
    },
    heroTitle: {
      color: Brand.colors.black.b1,
      fontSize: 32,
      fontFamily: Fonts.headingHeavy,
    },
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 24,
    },
    statsRow: {
      flexDirection: "row",
      gap: 8,
      paddingHorizontal: Brand.grid.margin,
      marginBottom: 14,
    },
    statCard: {
      flex: 1,
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    statLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    statValue: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: c.textPrimary,
    },
    statValueGreen: {
      marginTop: 2,
      fontSize: 22,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    segment: {
      flexDirection: "row",
      backgroundColor: c.segmentBg,
      borderRadius: Brand.radius[12],
      padding: 4,
      marginHorizontal: Brand.grid.margin,
    },
    segmentBtn: {
      flex: 1,
      borderRadius: 10,
      paddingVertical: 8,
      alignItems: "center",
    },
    segmentBtnActive: {
      backgroundColor: c.segmentActiveBg,
    },
    segmentText: {
      color: c.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    segmentTextActive: {
      color: Brand.colors.green.normal,
    },
    filtersRow: {
      marginTop: 12,
      marginHorizontal: Brand.grid.margin,
      flexDirection: "row",
      gap: 16,
      alignItems: "center",
    },
    radioRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    radioOuter: {
      width: 24,
      height: 24,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: c.radioOuterBg,
    },
    radioOuterActive: {
      backgroundColor: Brand.colors.green.light,
    },
    radioInner: {
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: Brand.colors.green.normal,
    },
    checkBox: {
      width: 28,
      height: 28,
      borderRadius: Brand.radius[4],
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
      alignItems: "center",
      justifyContent: "center",
    },
    checkBoxActive: {
      backgroundColor: Brand.colors.green.normal,
    },
    radioText: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    tripList: {
      marginTop: 12,
      paddingHorizontal: Brand.grid.margin,
      gap: 10,
    },
    tripCard: {
      borderRadius: Brand.radius[16],
      padding: 12,
      ...withElevation(100),
    },
    tripTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      gap: 12,
    },
    routeWrap: {
      flex: 1,
    },
    routeRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
    },
    originDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    routeConnector: {
      height: 8,
      borderLeftWidth: 2,
      borderLeftColor: c.border,
      marginLeft: 3,
      marginVertical: 3,
    },
    routeText: {
      fontSize: 14,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    priceWrap: {
      alignItems: "flex-end",
    },
    priceText: {
      fontSize: 18,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
    },
    badge: {
      marginTop: 4,
      borderRadius: 999,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: "700",
    },
    metaRow: {
      marginTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
    },
    metaText: {
      fontSize: 12,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    tripBottom: {
      borderTopWidth: 1,
      borderTopColor: c.border,
      marginTop: 9,
      paddingTop: 8,
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
    },
    tripCounterpart: {
      fontSize: 12,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    ratingWrap: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
    },
    ratingText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
  });
}
