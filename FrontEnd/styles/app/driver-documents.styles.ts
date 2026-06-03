import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';
import { StyleSheet } from 'react-native';

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 63, 57, 0.35)' },
    keyboard: { flex: 1 },
    container: {
      flexGrow: 1,
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 60,
      paddingBottom: Brand.spacing[24],
      gap: 14,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 4 },
    backText: { color: '#ffffff', fontFamily: Fonts.heading, fontSize: 14 },
    title: { color: '#ffffff', fontFamily: Fonts.headingHeavy, fontSize: 28 },
    subtitle: { color: 'rgba(255,255,255,0.75)', fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
    cardWrap: { ...withElevation(400) },
    card: { borderRadius: Brand.radius[24], padding: Brand.spacing[16], gap: 10 },
    sectionLabel: {
      fontSize: 11, color: c.textPrimary, fontFamily: Fonts.heading,
      textTransform: 'uppercase', marginBottom: 2, marginTop: 4,
    },
    row: { flexDirection: 'row', gap: 10 },
    inputFlex: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, fontSize: 14, color: c.inputText, fontFamily: Fonts.sans },
    photoRow: { flexDirection: 'row', gap: 10 },
    photoBtn: {
      flex: 1, height: 110, borderRadius: Brand.radius[12],
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      backgroundColor: c.inputBg,
      alignItems: 'center', justifyContent: 'center', gap: 6,
      overflow: 'hidden',
    },
    photoBtnFull: {
      height: 110, borderRadius: Brand.radius[12],
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      backgroundColor: c.inputBg,
      alignItems: 'center', justifyContent: 'center', gap: 6,
      overflow: 'hidden',
    },
    photoBtnDone: { borderColor: Brand.colors.green.normal, borderStyle: 'solid' },
    photoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoLabel: { fontSize: 12, fontFamily: Fonts.heading, color: c.textMuted },
    photoSublabel: { fontSize: 10, fontFamily: Fonts.sans, color: c.textMuted },
    photoDoneIcon: { position: 'absolute', top: 6, right: 6 },
    retakeOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 4, alignItems: 'center',
    },
    infoBox: {
      flexDirection: 'row', gap: 10,
      backgroundColor: Brand.colors.green.light + '33',
      borderRadius: Brand.radius[12], padding: 12,
      borderWidth: 1, borderColor: Brand.colors.green.light,
    },
    infoText: { flex: 1, color: '#ffffff', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
    cta: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999, paddingVertical: 14, alignItems: 'center',
      ...withElevation(400),
    },
    ctaText: { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.headingBold },
  });
}
