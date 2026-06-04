// Static styles for the Offer tab screen.
// Theme-dependent styles remain in offer.tsx via makeStyles(colors).

import { StyleSheet } from 'react-native';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { AppColors } from '@/hooks/use-app-theme';

const PICKER_ITEM_HEIGHT = 36;
const PICKER_HEIGHT = PICKER_ITEM_HEIGHT * 5;

// Collapsible strip placed at the top of the bottom surface.
// Collapsed: single compact row (route + countdown + chevron).
// Expanded:  departure time + boarding button.
// Does NOT push the hero — it lives inside the scroll surface, not above it.
export const upcomingStyles = StyleSheet.create({
  strip: {
    marginHorizontal: Brand.grid.margin,
    marginBottom: 14,
    borderRadius: Brand.radius[16],
    borderWidth: 1,
    overflow: 'hidden',
    ...withElevation(100),
  },
  // Tap-target for expand / collapse
  stripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  stripDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
  stripRoute: {
    fontFamily: Fonts.heading,
    fontSize: 13,
  },
  stripMeta: {
    fontFamily: Fonts.headingBold,
    fontSize: 11,
    marginTop: 1,
  },
  stripDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 14,
  },
  stripBody: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 10,
  },
  stripTime: {
    fontFamily: Fonts.sans,
    fontSize: 12,
  },
  stripBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    borderRadius: Brand.radius[12],
    paddingVertical: 11,
  },
  stripBtnText: {
    fontFamily: Fonts.headingBold,
    fontSize: 13,
  },
});

export const ampmContainerStyle = StyleSheet.create({
  wrap: {
    height: PICKER_HEIGHT,
    gap: 6,
  },
});

export const noVehiclesWarning = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Brand.colors.alerts.error + '15',
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.alerts.error + '44',
    padding: 12,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontFamily: Fonts.headingBold,
    color: Brand.colors.alerts.error,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: Fonts.sans,
    color: Brand.colors.alerts.error,
    marginTop: 2,
  },
});

const PICKER_ITEM_HEIGHT_LOCAL = 36;
const PICKER_VISIBLE_ROWS_LOCAL = 5;
const PICKER_HEIGHT_LOCAL = PICKER_ITEM_HEIGHT_LOCAL * PICKER_VISIBLE_ROWS_LOCAL;

export function makeStyles(c: AppColors) {
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
      backgroundColor: 'rgba(10, 63, 57, 0.42)',
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
    offerCardArea: {
      position: 'absolute',
      left: Brand.grid.margin,
      right: Brand.grid.margin,
      top: 194,
    },
    offerCard: {
      borderRadius: Brand.radius[16],
      padding: Brand.spacing[12],
      gap: 8,
      ...withElevation(400),
    },
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
    bottomSurface: {
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
      paddingTop: 18,
      paddingBottom: 10,
    },
    section: {
      paddingHorizontal: Brand.grid.margin,
      gap: 10,
    },
    sectionTitle: {
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 15,
      marginBottom: 2,
    },
    sectionLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.headingBold,
      textTransform: 'uppercase',
    },
    flex1: {
      flex: 1,
    },
    countersRow: {
      flexDirection: 'row',
      gap: 8,
    },
    counterBox: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      padding: 10,
    },
    counterHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginBottom: 8,
    },
    counterLabel: {
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.heading,
    },
    counterRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    counterBtn: {
      width: 27,
      height: 27,
      borderRadius: 8,
      backgroundColor: Brand.colors.green.normal,
      alignItems: 'center',
      justifyContent: 'center',
    },
    counterBtnText: {
      color: Brand.colors.black.b1,
      fontFamily: Fonts.headingBold,
      fontSize: 16,
      marginTop: -1,
    },
    counterValue: {
      fontSize: 20,
      fontFamily: Fonts.headingHeavy,
      color: c.textPrimary,
    },
    priceInput: {
      fontSize: 20,
      fontFamily: Fonts.headingHeavy,
      color: c.textPrimary,
      paddingVertical: 0,
    },
    vehicleSection: {
      gap: 8,
    },
    vehiclePicker: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 12,
      paddingVertical: 11,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    vehicleName: {
      color: c.textPrimary,
      fontSize: 14,
      fontFamily: Fonts.headingBold,
    },
    vehicleMeta: {
      color: c.textMuted,
      fontSize: 11,
      fontFamily: Fonts.sans,
      marginTop: 2,
    },
    toggleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    toggleLabel: {
      fontSize: 13,
      color: c.textPrimary,
      fontFamily: Fonts.heading,
    },
    toggle: {
      width: Brand.toggle.width,
      height: Brand.toggle.height,
      borderRadius: 999,
      paddingHorizontal: Brand.toggle.inset,
      justifyContent: 'center',
    },
    toggleActive: {
      backgroundColor: Brand.colors.green.dark,
    },
    toggleInactive: {
      backgroundColor: Brand.colors.green.light,
    },
    toggleKnob: {
      width: Brand.toggle.knobWidth,
      height: Brand.toggle.knobHeight,
      borderRadius: 999,
      backgroundColor: 'rgba(255, 255, 255, 0.94)',
      alignSelf: 'flex-end',
    },
    toggleKnobInactive: {
      alignSelf: 'flex-start',
    },
    notesWrap: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 9,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceAlt,
      paddingHorizontal: 10,
      paddingVertical: 10,
      borderRadius: Brand.radius[12],
    },
    notesIcon: {
      marginTop: 4,
    },
    notesInput: {
      flex: 1,
      minHeight: 60,
      fontSize: 14,
      color: c.textPrimary,
      fontFamily: Fonts.sans,
    },
    charCount: {
      alignSelf: 'flex-end',
      fontSize: 11,
      color: c.textMuted,
      fontFamily: Fonts.sans,
      marginTop: -4,
    },
    summary: {
      marginTop: 14,
      marginHorizontal: Brand.grid.margin,
      borderRadius: Brand.radius[16],
      padding: 14,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      ...withElevation(100),
    },
    summaryLabel: {
      fontSize: 12,
      color: c.textMuted,
      fontFamily: Fonts.sans,
    },
    summaryValue: {
      fontSize: 24,
      fontFamily: Fonts.headingHeavy,
      color: Brand.colors.green.normal,
    },
    summaryMath: {
      fontSize: 12,
      color: c.textMuted,
      fontFamily: Fonts.heading,
    },
    summaryVehicle: {
      marginTop: 2,
      fontSize: 11,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
    },
    cta: {
      marginTop: 10,
      marginHorizontal: Brand.grid.margin,
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      paddingVertical: 14,
      alignItems: 'center',
      ...withElevation(100),
    },
    ctaText: {
      color: Brand.colors.black.b1,
      fontSize: 15,
      fontFamily: Fonts.headingBold,
    },
    // Calendar modal
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
      height: PICKER_HEIGHT_LOCAL,
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
      paddingVertical: PICKER_ITEM_HEIGHT_LOCAL * 2,
    },
    wheelItem: {
      height: PICKER_ITEM_HEIGHT_LOCAL,
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
      top: PICKER_ITEM_HEIGHT_LOCAL * 2,
      height: PICKER_ITEM_HEIGHT_LOCAL,
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
    // Vehicle modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(15, 36, 32, 0.55)',
      justifyContent: 'center',
      paddingHorizontal: Brand.grid.margin,
    },
    modalCard: {
      borderRadius: Brand.radius[16],
      padding: 14,
      gap: 12,
      maxHeight: '74%',
      backgroundColor: c.calendarBg,
      borderColor: c.calendarBorder,
      borderWidth: 1,
      ...withElevation(400),
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    modalTitle: {
      color: c.textPrimary,
      fontSize: 16,
      fontFamily: Fonts.headingBold,
    },
    modalList: {
      gap: 10,
      paddingBottom: 6,
    },
    vehicleCard: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.vehicleCardBg,
      padding: 11,
      gap: 6,
    },
    vehicleCardActive: {
      borderColor: Brand.colors.green.normal,
      backgroundColor: c.vehicleCardActiveBg,
    },
    vehicleTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 8,
    },
    vehicleTag: {
      alignSelf: 'flex-start',
      color: Brand.colors.green.dark,
      fontSize: 11,
      fontFamily: Fonts.heading,
    },
  });
}
