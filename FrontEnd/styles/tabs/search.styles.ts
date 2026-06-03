// Static styles for the Search tab screen.
// Theme-dependent styles remain in search.tsx via makeStyles(colors).

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const PICKER_ITEM_HEIGHT = 36;
const PICKER_VISIBLE_ROWS = 5;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * PICKER_VISIBLE_ROWS;

export function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.screenBg,
    },
    content: {
      paddingBottom: 26,
    },
    heroWrap: {
      position: 'relative',
    },
    heroImage: {
      width: '100%',
    },
    heroOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 63, 57, 0.38)',
    },
    heroHeader: {
      position: 'absolute',
      top: 58,
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
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
    bellBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    bellDot: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: '#ffb13e',
    },
    // Outer wrapper that positions the card + floating suggestions dropdown
    searchCardArea: {
      position: 'absolute',
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      top: 194,
    },
    searchCard: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[12],
      gap: 8,
      ...withElevation(400),
    },
    // Suggestions dropdown — rendered as a sibling outside GlassCard (overflow:hidden)
    suggestionsBox: {
      marginTop: 6,
      borderRadius: Brand.radius[12],
      overflow: 'hidden',
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      ...withElevation(400),
    },
    suggestionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 11,
      paddingHorizontal: 12,
    },
    suggestionDivider: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: c.border,
    },
    suggestionMain: {
      fontFamily: Fonts.heading,
      fontSize: 13,
    },
    suggestionSub: {
      fontFamily: Fonts.sans,
      fontSize: 11,
    },
    verticalField: {
      gap: 5,
    },
    fieldLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontFamily: Fonts.headingBold,
      marginLeft: 2,
    },
    searchField: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
      paddingHorizontal: 10,
      paddingVertical: 9,
      flexDirection: 'row',
      gap: 6,
      alignItems: 'center',
    },
    searchInput: {
      flex: 1,
      fontSize: 12,
      color: c.inputText,
      fontFamily: Fonts.heading,
    },
    placeholderText: {
      color: c.textPlaceholder,
    },
    seatCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.seatCompactBg,
      paddingHorizontal: 10,
      paddingVertical: 9,
    },
    seatAction: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    seatNumber: {
      minWidth: 24,
      textAlign: 'center',
      fontSize: 16,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    actionRow: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
    },
    clearBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: Brand.colors.green.normal,
      backgroundColor: c.clearBtnBg,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    clearBtnText: {
      color: Brand.colors.green.dark,
      fontFamily: Fonts.headingBold,
      fontSize: 12,
    },
    searchBtn: {
      borderRadius: 999,
      backgroundColor: Brand.colors.green.normal,
      paddingHorizontal: 11,
      paddingVertical: 12,
      alignItems: 'center',
      flex: 1,
    },
    searchBtnText: {
      color: Brand.colors.black.b1,
      fontSize: 12,
      fontFamily: Fonts.headingBold,
    },
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 10,
    },
    quickFilters: {
      marginTop: 0,
    },
    quickFiltersContent: {
      paddingHorizontal: Brand.grid.margin,
      gap: 8,
    },
    filterBtn: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      paddingVertical: 8,
      paddingHorizontal: 11,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
    },
    filterText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    section: {
      marginTop: 20,
      paddingHorizontal: Brand.grid.margin,
      gap: 10,
    },
    sectionHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    sectionTitle: {
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 15,
    },
    sectionLink: {
      color: Brand.colors.green.normal,
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    routesRow: {
      gap: 8,
      paddingHorizontal: 2,
      paddingVertical: 2,
    },
    routeChip: {
      borderRadius: 999,
      backgroundColor: Brand.colors.green.normal,
      paddingVertical: 9,
      paddingHorizontal: 13,
    },
    routeChipText: {
      color: Brand.colors.black.b1,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    rideList: {
      gap: 9,
    },
    emptyState: {
      alignItems: 'center',
      paddingVertical: 28,
      gap: 10,
    },
    emptyText: {
      color: c.textMuted,
      fontFamily: Fonts.heading,
      fontSize: 14,
    },
    calendarBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(8, 24, 22, 0.72)',
      justifyContent: 'center',
      paddingHorizontal: Brand.grid.margin,
    },
    calendarCard: {
      borderRadius: Brand.radius[16],
      padding: 14,
      gap: 12,
      backgroundColor: c.calendarBg,
      borderColor: c.calendarBorder,
      borderWidth: 1,
      ...withElevation(400),
    },
    calendarHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    calendarTitle: {
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
      textTransform: 'capitalize',
    },
    weekHeader: {
      flexDirection: 'row',
    },
    weekDay: {
      flex: 1,
      textAlign: 'center',
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Fonts.heading,
    },
    calendarGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      rowGap: 6,
    },
    dayCell: {
      width: '14.2857%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 6,
      borderRadius: 10,
    },
    dayCellEmpty: {
      opacity: 0,
    },
    dayCellActive: {
      backgroundColor: Brand.colors.green.normal,
    },
    dayText: {
      color: c.textPrimary,
      fontSize: 12,
      fontFamily: Fonts.heading,
    },
    dayTextActive: {
      color: Brand.colors.black.b1,
    },
    timeRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'flex-start',
    },
    timeColumn: {
      flex: 1,
      gap: 6,
    },
    timeLabel: {
      color: c.textSecondary,
      fontSize: 11,
      fontFamily: Fonts.headingBold,
      textTransform: 'uppercase',
    },
    wheelWrap: {
      height: PICKER_HEIGHT,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.wheelBg,
      overflow: 'hidden',
    },
    wheelScroll: {
      flex: 1,
    },
    wheelContent: {
      paddingVertical: PICKER_ITEM_HEIGHT * 2,
    },
    wheelItem: {
      height: PICKER_ITEM_HEIGHT,
      alignItems: 'center',
      justifyContent: 'center',
    },
    wheelItemText: {
      color: c.textSecondary,
      fontFamily: Fonts.heading,
      fontSize: 16,
    },
    wheelItemTextActive: {
      color: Brand.colors.green.dark,
      fontFamily: Fonts.headingBold,
    },
    wheelHighlight: {
      position: 'absolute',
      left: 6,
      right: 6,
      top: PICKER_ITEM_HEIGHT * 2,
      height: PICKER_ITEM_HEIGHT,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: 'rgba(26, 158, 143, 0.1)',
    },
    ampmColumn: {
      gap: 6,
    },
    ampmBtn: {
      flex: 1,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.wheelBg,
      alignItems: 'center',
      justifyContent: 'center',
      minWidth: 52,
    },
    ampmBtnActive: {
      backgroundColor: Brand.colors.green.normal + '22',
      borderColor: Brand.colors.green.normal,
    },
    ampmText: {
      fontFamily: Fonts.headingBold,
      fontSize: 14,
      color: c.textSecondary,
    },
    ampmTextActive: {
      color: Brand.colors.green.dark,
    },
    calendarActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 8,
    },
    cancelBtn: {
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: 14,
      paddingVertical: 10,
      backgroundColor: c.clearBtnBg,
    },
    cancelBtnText: {
      color: c.textSecondary,
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    applyBtn: {
      borderRadius: 999,
      backgroundColor: Brand.colors.green.normal,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    applyBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 12,
    },
  });
}

export const staticStyles = StyleSheet.create({
  ampmContainer: {
    height: PICKER_HEIGHT,
    gap: 6,
  },
});
