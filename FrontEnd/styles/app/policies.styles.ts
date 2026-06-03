import { Brand, Fonts } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';
import { StyleSheet } from 'react-native';

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 58,
      paddingBottom: 16,
      backgroundColor: '#0a3f39',
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 2,
    },
    headerText: { flex: 1 },
    heroMini: { color: Brand.colors.green.light, fontSize: 12, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 26, fontFamily: Fonts.headingHeavy },
    surface: {
      flex: 1,
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
    },
    scroll: { flex: 1 },
    scrollContent: { padding: Brand.grid.margin, paddingTop: 20, paddingBottom: 48, gap: 12 },
    introBox: {
      backgroundColor: Brand.colors.green.normal + '18',
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: Brand.colors.green.normal + '40',
      padding: 14,
    },
    introText: {
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
    },
    section: {
      backgroundColor: c.surface,
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      paddingBottom: 10,
    },
    iconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    sectionTitle: {
      flex: 1,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
    sectionDivider: { height: 1, backgroundColor: c.border, marginHorizontal: 14 },
    sectionBody: { padding: 14, paddingTop: 10, gap: 8 },
    bullet: { flexDirection: 'row', gap: 8 },
    bulletDot: {
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: Brand.colors.green.normal,
      marginTop: 7, flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
    },
    footer: {
      marginTop: 4,
      padding: 14,
      backgroundColor: c.surfaceAlt,
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      gap: 4,
    },
    footerText: {
      color: c.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}
