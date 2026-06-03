// Slide-up modal that displays the user's in-app notifications.
// Currently uses a static mock list; replace with a real API call when the
// Notifications backend module is wired up.
// All surface and text colors adapt to the device light/dark mode setting.

import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Modal, ScrollView, Text, View } from 'react-native';
import { makeStyles } from './styles/NotificationsModal.styles';

type NotificationType = 'ride' | 'offer' | 'message' | 'rating';

interface NotificationItem {
  id: number;
  type: NotificationType;
  title: string;
  desc: string;
  time: string;
  unread: boolean;
}

interface NotificationsModalProps {
  visible: boolean;
  onClose: () => void;
}

// Static mock data — replace with a useFetch / SWR call to GET /api/notifications
const notifications: NotificationItem[] = [
  { id: 1, type: 'ride', title: 'Tu viaje a Heredia fue confirmado', desc: 'Carlos M. aceptó tu reserva.', time: 'Hace 5 min', unread: true },
  { id: 2, type: 'offer', title: 'Promo Pura Vida: 20% OFF', desc: 'Usa el código JALEMOS en tu próximo viaje.', time: 'Hace 1 h', unread: true },
  { id: 3, type: 'message', title: 'Nuevo mensaje de Maria R.', desc: 'Nos vemos en el punto de encuentro.', time: 'Hace 3 h', unread: true },
  { id: 4, type: 'rating', title: 'Jose L. te calificó 5 estrellas', desc: 'Excelente pasajero, muy puntual.', time: 'Ayer', unread: false },
  { id: 5, type: 'ride', title: 'Recordatorio: viaje mañana', desc: 'Cartago a San Jose, 7:00 AM.', time: 'Ayer', unread: false },
];

const iconMap: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  ride: 'car-outline',
  offer: 'pricetag-outline',
  message: 'chatbubble-ellipses-outline',
  rating: 'star-outline',
};

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <GlassCard style={styles.header} intensity={28}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="notifications-outline" size={18} color={Brand.colors.green.normal} />
            <Text style={styles.headerTitle}>Notificaciones</Text>
          </View>
          <AnimatedPressable onPress={onClose} pressedScale={0.95}>
            <Ionicons name="close" size={22} color={colors.textPrimary} />
          </AnimatedPressable>
        </GlassCard>

        <ScrollView contentContainerStyle={styles.listContent}>
          {notifications.map((item) => (
            <GlassCard key={item.id} style={[styles.card, item.unread && styles.cardUnread]} intensity={34}>
              <View style={styles.iconWrap}>
                <Ionicons name={iconMap[item.type]} size={16} color="#f2fffb" />
              </View>
              <View style={styles.textWrap}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardDesc}>{item.desc}</Text>
                <Text style={styles.cardTime}>{item.time}</Text>
              </View>
              {item.unread && <View style={styles.dot} />}
            </GlassCard>
          ))}
        </ScrollView>

        <GlassCard style={styles.footer} intensity={26}>
          <AnimatedPressable style={styles.footerButton} pressedScale={0.985}>
            <Text style={styles.footerButtonText}>Ver todas las notificaciones</Text>
          </AnimatedPressable>
        </GlassCard>
      </View>
    </Modal>
  );
}
