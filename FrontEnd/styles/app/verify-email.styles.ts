import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

export const staticStyles = StyleSheet.create({
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
    width: 100,
    height: 100,
    marginBottom: -32,
  },
  brand: {
    fontSize: 36,
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
    gap: 14,
  },
  cardHeader: {
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  mailIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Brand.colors.green.normal + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  subtitle: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: Fonts.sans,
    textAlign: 'center',
    lineHeight: 20,
  },
  emailHighlight: {
    color: Brand.colors.green.light,
    fontFamily: Fonts.heading,
  },
  codeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginVertical: 4,
  },
  codeBox: {
    width: 44,
    height: 54,
    borderRadius: Brand.radius[12],
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 24,
    fontFamily: Fonts.headingBold,
  },
  cta: {
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 2,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    color: Brand.colors.black.b1,
    fontSize: 15,
    fontFamily: Fonts.headingBold,
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
  backLink: {
    textAlign: 'center',
    fontSize: 13,
    color: '#ffffff',
    fontFamily: Fonts.sans,
    textDecorationLine: 'underline',
  },
  resendRow: {
    alignItems: 'center',
    gap: 2,
    marginTop: 2,
  },
  resendPrompt: {
    fontSize: 12,
    color: '#ffffff',
    fontFamily: Fonts.sans,
  },
  resendLink: {
    fontSize: 14,
    color: Brand.colors.green.light,
    fontFamily: Fonts.heading,
    textDecorationLine: 'underline',
    paddingVertical: 4,
  },
  resendDisabled: {
    fontSize: 13,
    color: '#ffffffaa',
    fontFamily: Fonts.sans,
    paddingVertical: 4,
  },
});

export function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return {
    ...staticStyles,
    ...StyleSheet.create({
      title: {
        fontSize: Brand.typography.h4.fontSize,
        color: colors.textPrimary,
        fontFamily: Fonts.headingBold,
        textAlign: 'center' as const,
      },
      codeBoxActive: {
        borderColor: Brand.colors.green.normal,
        backgroundColor: colors.inputBg,
      },
      codeBoxFilled: {
        borderColor: Brand.colors.green.dark,
        backgroundColor: Brand.colors.green.normal + '18',
      },
      codeBoxEmpty: {
        borderColor: colors.border,
        backgroundColor: colors.inputBg,
      },
      codeTextColor: {
        color: colors.textPrimary,
      },
    }),
  };
}
