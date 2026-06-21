// Search (Buscar) tab — passenger's main screen for finding available rides.
// Thin orchestrator: state/logic live in useTripSearch; the search card, results list
// and date/time picker are extracted components. Tab icon/title are set via
// navigation.setOptions so the NativeTabs pipeline receives the SF Symbol.

import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, Text, View } from 'react-native';

import DateTimePickerModal from '@/components/search/date-time-picker-modal';
import RideResults from '@/components/search/ride-results';
import SearchFormCard from '@/components/search/search-form-card';
import NotificationsModal from '@/components/shared/NotificationsModal';
import UnreadBadge from '@/components/shared/unread-badge';
import { useNotifications } from '@/contexts/notifications';
import { useTripSearch } from '@/hooks/use-trip-search';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/tabs/search.styles';

export default function SearchScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();
  const { unreadCount } = useNotifications();

  const [notifOpen, setNotifOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const {
    from, setFrom, to, setTo, seats, setSeats,
    selectedDate, setSelectedDate, hasSearched,
    filteredRides, noTripsExist,
    refreshTrips, handleSearch, handleRidePress, clearSearch, applyQuickRoute,
  } = useTripSearch();

  useEffect(() => {
    navigation.setOptions({ title: 'Buscar', icon: { sf: 'magnifyingglass' } });
  }, [navigation]);

  // Hero grows as more fields appear so the search card never overflows it.
  const hasOrigin = from.trim().length > 0;
  const hasDestination = to.trim().length > 0;
  const hasDate = selectedDate !== null;
  const visibleBlocks = 1 + (hasOrigin ? 1 : 0) + (hasDestination ? 1 : 0) + (hasDate ? 2 : 0);
  const heroHeight = 280 + visibleBlocks * 62;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic"
        style={{ backgroundColor: colors.bottomSurface }}
      >
        <View style={[styles.heroWrap, { height: heroHeight }]}>
          <Image
            source={isDark
              ? require('../../assets/images/hero-banner-dark.jpg')
              : require('../../assets/images/hero-banner.jpg')}
            style={[styles.heroImage, { height: heroHeight }]}
          />
          <View style={styles.heroOverlay} />

          <View style={styles.heroHeader}>
            <View>
              <Text style={styles.heroMini}>Pura Vida</Text>
              <Text style={styles.heroTitle}>¿A dónde jalamos?</Text>
            </View>
            <Pressable onPress={() => setNotifOpen(true)} style={styles.bellBtn}>
              <Ionicons name="notifications-outline" size={20} color="#ecfff9" />
              <UnreadBadge count={unreadCount} />
            </Pressable>
          </View>

          <View style={styles.searchCardArea}>
            <SearchFormCard
              from={from}
              setFrom={setFrom}
              to={to}
              setTo={setTo}
              seats={seats}
              setSeats={setSeats}
              selectedDate={selectedDate}
              onOpenDate={() => setCalendarOpen(true)}
              onSearch={handleSearch}
              onClear={clearSearch}
              styles={styles}
              colors={colors}
            />
          </View>
        </View>

        <RideResults
          hasSearched={hasSearched}
          filteredRides={filteredRides}
          noTripsExist={noTripsExist}
          onRidePress={handleRidePress}
          onClear={clearSearch}
          onRefresh={refreshTrips}
          applyQuickRoute={applyQuickRoute}
          styles={styles}
          colors={colors}
        />
      </ScrollView>

      <DateTimePickerModal
        visible={calendarOpen}
        initialDate={selectedDate}
        onApply={(date) => { setSelectedDate(date); setCalendarOpen(false); }}
        onClose={() => setCalendarOpen(false)}
        styles={styles}
        colors={colors}
      />

      <NotificationsModal visible={notifOpen} onClose={() => setNotifOpen(false)} />
    </View>
  );
}
