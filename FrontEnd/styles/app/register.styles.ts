// Static styles for the Register screen.
// Dynamic styles (those that depend on the active colour palette) remain
// inside makeStyles() in register.tsx so they can react to dark/light mode.

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export const styles = StyleSheet.create({
  bg: { flex: 1 },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(10, 63, 57, 0.32)',
  },
  keyboard: { flex: 1 },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Brand.grid.margin,
    paddingVertical: Brand.spacing[24],
  },
  logoBlock: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: -40,
  },
  brand: {
    fontSize: 40,
    color: Brand.colors.green.normal,
    fontFamily: Fonts.headingHeavy,
    textShadowColor: 'rgba(255, 255, 255, 0.85)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  cardWrap: {
    ...withElevation(600),
  },
  card: {
    borderRadius: Brand.radius[24],
    padding: Brand.spacing[16],
    gap: 10,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: Fonts.sans,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cta: {
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingVertical: Brand.buttonSizes.regular.height / 2 - 8,
    alignItems: 'center',
    marginTop: 2,
  },
  ctaText: {
    color: Brand.colors.black.b1,
    fontSize: 15,
    fontFamily: Fonts.headingBold,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  dividerLabel: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: Fonts.sans,
  },
  loginText: {
    textAlign: 'center',
    marginTop: 4,
    fontSize: 13,
    color: '#ffffff',
    fontFamily: Fonts.sans,
  },
  loginLink: {
    textDecorationLine: 'underline',
    color: '#ffffff',
    fontFamily: Fonts.heading,
  },
  policiesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 2,
  },
  checkbox: {
    width: 22, height: 22, borderRadius: 6,
    borderWidth: 2, borderColor: Brand.colors.green.normal,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxChecked: {
    backgroundColor: Brand.colors.green.normal,
  },
  policiesText: {
    flex: 1, fontSize: 12, color: '#ffffff',
    fontFamily: Fonts.sans, lineHeight: 18,
  },
  policiesLink: {
    textDecorationLine: 'underline',
    color: Brand.colors.green.light,
    fontFamily: Fonts.heading,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(166, 25, 42, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(166, 25, 42, 0.4)',
    borderRadius: Brand.radius[8],
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: {
    flex: 1,
    color: Brand.colors.alerts.error,
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
});

export function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return {
    ...styles,
    ...StyleSheet.create({
      title: {
        fontSize: Brand.typography.h4.fontSize,
        color: colors.textPrimary,
        fontFamily: Fonts.headingBold,
      },
      inputWrap: {
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
        borderRadius: Brand.radius[12],
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
        paddingHorizontal: 12,
        paddingVertical: 12,
      },
      inputWrapFlex: {
        flex: 1,
        flexDirection: 'row' as const,
        alignItems: 'center' as const,
        gap: 10,
        borderRadius: Brand.radius[12],
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
        paddingHorizontal: 12,
        paddingVertical: 12,
      },
      input: {
        flex: 1,
        fontSize: 14,
        color: colors.inputText,
        fontFamily: Fonts.sans,
      },
      divider: {
        flex: 1,
        height: 1,
        backgroundColor: colors.border,
      },
      socialBtn: {
        borderRadius: Brand.radius[12],
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surfaceAlt,
        paddingVertical: 11,
        alignItems: 'center' as const,
        justifyContent: 'center' as const,
        flexDirection: 'row' as const,
        gap: 8,
      },
      socialText: {
        color: colors.textPrimary,
        fontFamily: Fonts.heading,
        fontSize: 13,
      },
    }),
  };
}
