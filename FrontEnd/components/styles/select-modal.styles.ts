import { Brand, Fonts } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';
import { Platform, StyleSheet } from 'react-native';

export function makeStyles(c: AppColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      maxHeight: '75%',
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    handle: {
      width: 40, height: 4,
      backgroundColor: c.border,
      borderRadius: 99,
      alignSelf: 'center',
      marginTop: 10, marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: {
      fontSize: 15,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: Fonts.sans,
      color: c.inputText,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    optionPressed: { backgroundColor: c.inputBg },
    optionText: {
      fontSize: 14,
      fontFamily: Fonts.sans,
      color: c.textPrimary,
    },
    customOption: { borderBottomWidth: 0 },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customText: {
      fontSize: 14,
      fontFamily: Fonts.heading,
      color: Brand.colors.green.normal,
    },
  });
}
