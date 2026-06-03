import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

/** Static styles for the PipelineStep sub-component. */
export const stepStyles = StyleSheet.create({
  dot: {
    width: 28, height: 28, borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  activePulse: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: Brand.colors.black.b1,
  },
  line: {
    width: 2, flex: 1, minHeight: 24, marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
  sublabel: {
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 2,
    lineHeight: 17,
  },
});

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      flexDirection: 'row', alignItems: 'center',
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: 12,
      backgroundColor: c.screenBg,
    },
    backBtn: {
      width: 38, height: 38, borderRadius: 19,
      backgroundColor: c.surface,
      alignItems: 'center', justifyContent: 'center',
      borderWidth: 1, borderColor: c.border,
      ...withElevation(100),
    },
    headerTitle: {
      flex: 1, textAlign: 'center',
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
    },
    content: {
      paddingHorizontal: Brand.grid.margin,
      paddingBottom: 32,
      gap: 16,
    },
    statusBadge: {
      alignSelf: 'flex-start',
      flexDirection: 'row', alignItems: 'center', gap: 6,
      borderRadius: 999,
      paddingHorizontal: 12, paddingVertical: 6,
      borderWidth: 1,
    },
    statusBadgeText: {
      fontSize: 12,
      fontFamily: Fonts.headingBold,
    },
    card: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[16],
      gap: 12,
    },
    sectionTitle: {
      fontSize: 13,
      color: c.textMuted,
      fontFamily: Fonts.headingBold,
      textTransform: 'uppercase',
      marginBottom: 4,
    },
    issueItem: {
      flexDirection: 'row', alignItems: 'flex-start', gap: 8,
      paddingVertical: 6,
    },
    issueText: {
      flex: 1,
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 18,
    },
    adminNotes: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      lineHeight: 19,
      fontStyle: 'italic',
    },
    divider: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: c.border,
    },
    successIcon: {
      width: 64, height: 64, borderRadius: 32,
      backgroundColor: Brand.colors.green.normal + '22',
      alignItems: 'center', justifyContent: 'center',
      alignSelf: 'center',
      borderWidth: 2,
      borderColor: Brand.colors.green.normal,
    },
    successTitle: {
      fontSize: 18,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      textAlign: 'center',
    },
    successBody: {
      fontSize: 13,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      textAlign: 'center',
      lineHeight: 19,
    },
    primaryBtn: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      alignItems: 'center',
      paddingVertical: 14,
    },
    primaryBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
    secondaryBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      paddingVertical: 13,
    },
    secondaryBtnText: {
      color: c.textSecondary,
      fontFamily: Fonts.heading,
      fontSize: 14,
    },
    cooldownBanner: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
      backgroundColor: Brand.colors.alerts.error + '15',
      borderRadius: Brand.radius[12],
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderWidth: 1,
      borderColor: Brand.colors.alerts.error + '40',
    },
    cooldownText: {
      flex: 1,
      fontSize: 13,
      color: Brand.colors.alerts.error,
      fontFamily: Fonts.heading,
    },
    vehicleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    vehicleLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      textTransform: 'uppercase',
    },
    vehicleValue: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
  });
}
