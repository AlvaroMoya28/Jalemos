// Tappable card summarising a single driver application.

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { DriverApplication } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { appCardInline, badge, makeStyles } from '@/styles/tabs/admin-applications.styles';
import { formatShortDate } from '@/utils/format';

import ApplicationStatusBadge from './application-status-badge';

export default function ApplicationCard({ app, onPress, styles, colors }: {
  app: DriverApplication;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <AnimatedPressable pressedScale={0.99} onPress={onPress}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardTop}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{app.applicantAvatar}</Text>
          </View>
          <View style={styles.nameBlock}>
            <Text style={styles.name}>{app.applicantName}</Text>
            <Text style={styles.email}>{app.applicantEmail}</Text>
          </View>
          <View style={appCardInline.badgeContainer}>
            {app.applicationType === 'vehicle' && (
              <View style={[badge.wrap, { backgroundColor: Brand.colors.blue.normal + '22', borderColor: Brand.colors.blue.normal + '55' }]}>
                <Text style={[badge.text, { color: Brand.colors.blue.normal }]}>Nuevo vehículo</Text>
              </View>
            )}
            <ApplicationStatusBadge status={app.status} />
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.detailRow}>
          <Text style={styles.vehicleText}>
            {app.vehicle.brand} {app.vehicle.model} {app.vehicle.year}
          </Text>
          <Text style={styles.plateText}>{app.vehicle.plate}</Text>
        </View>
        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatShortDate(app.submittedAt)}</Text>
          {app.attempts > 1 && (
            <>
              <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textMuted }} />
              <Text style={styles.metaText}>Intento #{app.attempts}</Text>
            </>
          )}
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
