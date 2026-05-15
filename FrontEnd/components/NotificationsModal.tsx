import AnimatedPressable from '@/components/animated-pressable';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Modal, ScrollView, StyleSheet, Text, View } from 'react-native';

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

const notifications: NotificationItem[] = [
  {
    id: 1,
    type: 'ride',
    title: 'Tu viaje a Heredia fue confirmado',
    desc: 'Carlos M. aceptó tu reserva.',
    time: 'Hace 5 min',
    unread: true,
  },
  {
    id: 2,
    type: 'offer',
    title: 'Promo Pura Vida: 20% OFF',
    desc: 'Usa el código JALEMOS en tu próximo viaje.',
    time: 'Hace 1 h',
    unread: true,
  },
  {
    id: 3,
    type: 'message',
    title: 'Nuevo mensaje de Maria R.',
    desc: 'Nos vemos en el punto de encuentro.',
    time: 'Hace 3 h',
    unread: true,
  },
  {
    id: 4,
    type: 'rating',
    title: 'Jose L. te calificó 5 estrellas',
    desc: 'Excelente pasajero, muy puntual.',
    time: 'Ayer',
    unread: false,
  },
  {
    id: 5,
    type: 'ride',
    title: 'Recordatorio: viaje mañana',
    desc: 'Cartago a San Jose, 7:00 AM.',
    time: 'Ayer',
    unread: false,
  },
];

const iconMap: Record<NotificationType, keyof typeof Ionicons.glyphMap> = {
  ride: 'car-outline',
  offer: 'pricetag-outline',
  message: 'chatbubble-ellipses-outline',
  rating: 'star-outline',
};

export default function NotificationsModal({ visible, onClose }: NotificationsModalProps) {
  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <GlassCard style={styles.header} intensity={28}>
          <View style={styles.headerTitleWrap}>
            <Ionicons name="notifications-outline" size={18} color="#0e8d75" />
            <Text style={styles.headerTitle}>Notificaciones</Text>
          </View>
          <AnimatedPressable onPress={onClose} pressedScale={0.95}>
            <Ionicons name="close" size={22} color="#26403b" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.black.b3,
  },
  header: {
    marginHorizontal: Brand.grid.margin,
    marginTop: 58,
    marginBottom: 14,
    borderRadius: Brand.radius[16],
    paddingHorizontal: Brand.grid.margin,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: Fonts.headingBold,
    color: Brand.colors.black.b10,
  },
  listContent: {
    paddingHorizontal: Brand.grid.margin,
    paddingTop: 0,
    paddingBottom: 120,
    gap: 10,
  },
  card: {
    borderRadius: Brand.radius[16],
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    ...withElevation(100),
  },
  cardUnread: {
    borderColor: Brand.colors.green.lightActive,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.colors.green.normal,
  },
  textWrap: {
    flex: 1,
  },
  cardTitle: {
    color: Brand.colors.black.b10,
    fontSize: 14,
    fontFamily: Fonts.heading,
  },
  cardDesc: {
    color: Brand.colors.black.b8,
    fontSize: 12,
    fontFamily: Fonts.sans,
    marginTop: 3,
  },
  cardTime: {
    color: Brand.colors.black.b7,
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 4,
    backgroundColor: Brand.colors.green.normal,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: Brand.spacing[16],
    paddingTop: Brand.spacing[12],
  },
  footerButton: {
    backgroundColor: Brand.colors.green.normal,
    borderRadius: Brand.radius[12],
    alignItems: 'center',
    paddingVertical: 12,
  },
  footerButtonText: {
    color: Brand.colors.black.b1,
    fontSize: 14,
    fontFamily: Fonts.heading,
  },
});