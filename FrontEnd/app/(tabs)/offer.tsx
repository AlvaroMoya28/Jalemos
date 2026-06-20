// Offer (Ofrecer) tab — driver's screen for publishing a new trip.
// Composes the publish form (useOfferForm), the upcoming-trip strip
// (useUpcomingTrip) and the embedded BoardingScreen when a trip is active.
// Only visible in the tab bar when the user is in driver mode (see UserModeContext).

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeInDown, FadeOut, LinearTransition } from 'react-native-reanimated';

import BoardingScreen from '@/components/offer/boarding-screen';
import DateTimePickerModal from '@/components/offer/date-time-picker-modal';
import OfferForm from '@/components/offer/offer-form';
import UpcomingTripStrip from '@/components/offer/upcoming-trip-strip';
import VehiclePickerModal from '@/components/offer/vehicle-picker-modal';
import { dateLabel, timeLabel } from '@/components/offer/offer-date-utils';
import GlassAlert from '@/components/shared/glass-alert';
import GlassCard from '@/components/shared/glass-card';
import NotificationsModal from '@/components/shared/NotificationsModal';
import PlaceSearchInput from '@/components/shared/place-search-input';
import UnreadBadge from '@/components/shared/unread-badge';
import { Brand } from '@/constants/theme';
import { useActiveTrip } from '@/contexts/active-trip';
import { useNotifications } from '@/contexts/notifications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useOfferForm } from '@/hooks/use-offer-form';
import { useUpcomingTrip } from '@/hooks/use-upcoming-trip';
import { TripStatusResponse } from '@/services/api';
import { makeStyles } from '../../styles/tabs/offer.styles';

export default function OfferScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { driverTrip, refresh: refreshActiveTrip } = useActiveTrip();
  const { unreadCount } = useNotifications();

  const form = useOfferForm();
  // Frozen copy of the trip kept mounted while the driver rates passengers,
  // so the BoardingScreen survives driverTrip becoming null.
  const [completedTrip, setCompletedTrip] = useState<TripStatusResponse | null>(null);
  const activeTrip = driverTrip ?? completedTrip;
  const upcoming = useUpcomingTrip(!!activeTrip, refreshActiveTrip, form.showError);

  const [notifOpen, setNotifOpen]       = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    navigation.setOptions({ title: 'Ofrecer', icon: { sf: 'car' } });
  }, [navigation]);

  const hasOrigin      = form.from.trim().length > 0;
  const hasDestination = form.to.trim().length > 0;
  const visibleBlocks  = 1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0);
  const heroHeight     = 280 + visibleBlocks * 62;

  // While a trip is active (or being rated), the whole tab becomes the BoardingScreen.
  if (activeTrip) {
    return (
      <BoardingScreen
        trip={activeTrip}
        onTripCompleted={(t) => setCompletedTrip(t)}
        onTripEnded={() => { setCompletedTrip(null); refreshActiveTrip(); }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" style={{ backgroundColor: colors.bottomSurface }}>

        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={isDark ? require('../../assets/images/hero-banner-dark.jpg') : require('../../assets/images/hero-banner.jpg')}
            style={[styles.heroImage, { height: heroHeight }]}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>Ofrece tu viaje</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <UnreadBadge count={unreadCount} />
            </Pressable>
          </View>

          <View style={styles.offerCardArea}>
            <GlassCard style={styles.offerCard} intensity={46}>
              <View style={styles.verticalField}>
                <Text style={styles.fieldLabel}>Origen</Text>
                <PlaceSearchInput
                  value={form.from}
                  onChangeText={form.onChangeFrom}
                  onSelect={form.onSelectFrom}
                  leadingIcon={<Ionicons name="radio-button-on" size={12} color={Brand.colors.green.dark} />}
                  fieldStyle={styles.searchField}
                  placeholder="¿De dónde sales?"
                  placeholderTextColor={colors.textPlaceholder}
                />
              </View>

              {hasOrigin ? (
                <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.verticalField}>
                  <Text style={styles.fieldLabel}>Destino</Text>
                  <PlaceSearchInput
                    value={form.to}
                    onChangeText={form.onChangeTo}
                    onSelect={form.onSelectTo}
                    leadingIcon={<Ionicons name="location-outline" size={13} color={Brand.colors.green.normal} />}
                    fieldStyle={styles.searchField}
                    placeholder="¿A dónde vas?"
                    placeholderTextColor={colors.textPlaceholder}
                  />
                </Animated.View>
              ) : null}

              {hasDestination ? (
                <Animated.View entering={FadeInDown.duration(220)} exiting={FadeOut.duration(140)} layout={LinearTransition.duration(220)} style={styles.verticalField}>
                  <Text style={styles.fieldLabel}>Fecha y hora</Text>
                  <Pressable style={styles.searchField} onPress={() => setCalendarOpen(true)}>
                    <Ionicons name="calendar-outline" size={12} color={Brand.colors.green.dark} />
                    <Text style={[styles.searchInput, !form.selectedDate && styles.placeholderText]}>
                      {form.selectedDate
                        ? `${dateLabel(form.selectedDate)} · ${timeLabel(form.selectedDate.getHours(), form.selectedDate.getMinutes())}`
                        : 'Seleccionar fecha y hora'}
                    </Text>
                    <Ionicons name="chevron-down" size={14} color={colors.textMuted} />
                  </Pressable>
                </Animated.View>
              ) : null}
            </GlassCard>
          </View>
        </View>

        <View style={styles.bottomSurface}>
          {upcoming.upcomingTrip && (
            <UpcomingTripStrip
              trip={upcoming.upcomingTrip}
              minsUntilBoarding={upcoming.minsUntilBoarding}
              expanded={upcoming.upcomingExpanded}
              onToggle={() => upcoming.setUpcomingExpanded((p) => !p)}
              startLoading={upcoming.startBoardingLoading}
              onStartBoarding={upcoming.handleStartBoarding}
              colors={colors}
            />
          )}

          <OfferForm form={form} styles={styles} colors={colors} />
        </View>
      </ScrollView>

      <DateTimePickerModal
        visible={calendarOpen}
        initialDate={form.selectedDate}
        onApply={(date) => { form.setSelectedDate(date); setCalendarOpen(false); }}
        onClose={() => setCalendarOpen(false)}
        styles={styles}
        colors={colors}
      />

      <VehiclePickerModal
        visible={form.vehicleModalOpen}
        onClose={() => form.setVehicleModalOpen(false)}
        vehicles={form.vehicles}
        vehicleId={form.vehicleId}
        onSelect={(id) => { form.setVehicleId(id); form.setVehicleModalOpen(false); }}
        styles={styles}
        colors={colors}
      />

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />

      <GlassAlert
        visible={!!form.offerAlert}
        icon={form.offerAlert?.icon ?? 'information-circle'}
        iconColor={form.offerAlert?.iconColor}
        title={form.offerAlert?.title ?? ''}
        body={form.offerAlert?.body ?? ''}
        primaryLabel="Entendido"
        onDismiss={form.dismissAlert}
      />
    </View>
  );
}
