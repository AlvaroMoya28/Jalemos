// Slide-up notification center backed by the real API (E1-4).
// Reads from the global NotificationsProvider: lists the user's notifications,
// highlights unread ones, marks a notification read on tap, and supports
// "mark all as read". Adapts to light/dark mode.

import AnimatedPressable from './animated-pressable';
import GlassCard from './glass-card';
import { Brand } from '@/constants/theme';
import { useNotifications } from '@/contexts/notifications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { NotificationKind } from '@/types/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, Text, View } from 'react-native';
import { makeStyles } from './styles/NotificationsModal.styles';

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Map each backend notification type to an icon.
const iconMap: Record<NotificationKind, keyof typeof Ionicons.glyphMap> = {
  booking_received: 'person-add-outline',
  booking_confirmed: 'checkmark-circle-outline',
  booking_cancelled: 'close-circle-outline',
  trip_starting: 'time-outline',
  trip_completed: 'flag-outline',
  rating_received: 'star-outline',
  general: 'notifications-outline',
  trip_boarding: 'people-outline',
  qr_scanned: 'qr-code-outline',
  trip_started: 'car-outline',
  driver_cancelled: 'alert-circle-outline',
  passenger_cancelled: 'person-remove-outline',
  no_show_marked: 'remove-circle-outline',
  payment_reminder: 'card-outline',
  rating_reminder: 'star-half-outline',
  admin_broadcast: 'megaphone-outline',
};

// Lightweight relative-time formatter that returns the Spanish labels shown in the UI.
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const diffMs = Date.now() - then;
  const min = Math.floor(diffMs / 60_000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `Hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'Ayer';
  if (days < 7) return `Hace ${days} días`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { items, unreadCount, isLoading, refresh, markRead, markAllRead, clearAll } = useNotifications();

  // Refresh the feed each time the sheet opens.
  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);

  const confirmClear = () => {
    Alert.alert(
      'Limpiar notificaciones',
      '¿Eliminar todas tus notificaciones? Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Limpiar', style: 'destructive', onPress: () => { clearAll(); } },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <GlassCard style={styles.header} intensity={28}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="notifications-outline" size={18} color={Brand.colors.green.normal} />
            <Text style={styles.headerTitle}>Notificaciones</Text>
            {unreadCount > 0 && <Text style={styles.headerCount}>({unreadCount})</Text>}
          </View>
          <View style={styles.headerActions}>
            {items.length > 0 && (
              <AnimatedPressable onPress={confirmClear} pressedScale={0.95} hitSlop={8}>
                <Ionicons name="trash-outline" size={20} color={colors.textSecondary} />
              </AnimatedPressable>
            )}
            <AnimatedPressable onPress={onClose} pressedScale={0.95}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </AnimatedPressable>
          </View>
        </GlassCard>

        <ScrollView contentContainerStyle={styles.listContent}>
          {isLoading && items.length === 0 ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator color={Brand.colors.green.normal} />
            </View>
          ) : items.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="notifications-off-outline" size={40} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Sin notificaciones</Text>
              <Text style={styles.emptySubtitle}>
                Aquí verás avisos de tus viajes, reservas y novedades.
              </Text>
            </View>
          ) : (
            items.map((item) => (
              <AnimatedPressable
                key={item.id}
                pressedScale={0.99}
                onPress={() => { if (!item.read) markRead(item.id); }}
              >
                <GlassCard style={[styles.card, !item.read && styles.cardUnread]} intensity={34}>
                  <View style={styles.iconWrap}>
                    <Ionicons name={iconMap[item.type] ?? 'notifications-outline'} size={16} color="#f2fffb" />
                  </View>
                  <View style={styles.textWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    {!!item.body && <Text style={styles.cardDesc}>{item.body}</Text>}
                    <Text style={styles.cardTime}>{relativeTime(item.createdAt)}</Text>
                  </View>
                  {!item.read && <View style={styles.dot} />}
                </GlassCard>
              </AnimatedPressable>
            ))
          )}
        </ScrollView>

        {unreadCount > 0 && (
          <GlassCard style={styles.footer} intensity={26}>
            <AnimatedPressable style={styles.footerButton} pressedScale={0.985} onPress={markAllRead}>
              <Text style={styles.footerButtonText}>Marcar todas como leídas</Text>
            </AnimatedPressable>
          </GlassCard>
        )}
      </View>
    </Modal>
  );
}
