import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';
import { StyleSheet } from 'react-native';

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    header: {
      marginHorizontal: Brand.grid.margin,
      marginTop: 58,
      marginBottom: 14,
      borderRadius: Brand.radius[16],
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: 14,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerTitleWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    headerTitle: {
      fontSize: 18,
      fontFamily: Fonts.headingBold,
      color: c.textPrimary,
    },
    listContent: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 0,
      paddingBottom: 120,
      gap: 10,
    },
    card: {
      borderRadius: Brand.radius[16],
      padding: 12,
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
      ...withElevation(100),
    },
    cardUnread: {
      borderColor: Brand.colors.green.lightActive,
    },
    iconWrap: {
      width: 34,
      height: 34,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: Brand.colors.green.normal,
    },
    textWrap: {
      flex: 1,
    },
    cardTitle: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: Fonts.heading,
    },
    cardDesc: {
      color: c.textSecondary,
      fontSize: 12,
      fontFamily: Fonts.sans,
      marginTop: 3,
    },
    cardTime: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Fonts.sans,
      marginTop: 4,
    },
    dot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 4,
      backgroundColor: Brand.colors.green.normal,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: Brand.spacing[16],
      paddingTop: Brand.spacing[12],
    },
    footerButton: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: Brand.radius[12],
      alignItems: 'center',
      paddingVertical: 12,
    },
    footerButtonText: {
      color: Brand.colors.black.b1,
      fontSize: 14,
      fontFamily: Fonts.heading,
    },
  });
}
