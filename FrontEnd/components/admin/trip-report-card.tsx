// Card for an API-backed in-trip report (emergency / driver report).

import { Ionicons } from '@expo/vector-icons';
import { Text, View } from 'react-native';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TripReportDto } from '@/services/api';
import { metaDotInline, makeStyles } from '@/styles/tabs/admin-reports.styles';
import { formatShortDate } from '@/utils/format';

import { TRIP_STATUS_CONFIG, TRIP_TYPE_CONFIG } from './report-config';

export default function TripReportCard({ report, onPress, styles, colors }: {
  report: TripReportDto;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const typeConf   = TRIP_TYPE_CONFIG[report.type] ?? TRIP_TYPE_CONFIG.emergency;
  const statusConf = TRIP_STATUS_CONFIG[report.status] ?? { label: report.status, color: colors.textMuted };
  const isOpen     = report.status === 'open' || report.status === 'verified';

  return (
    <AnimatedPressable pressedScale={0.99} onPress={() => isOpen ? onPress() : undefined}>
      <GlassCard style={styles.card} intensity={32}>
        <View style={styles.cardHeader}>
          <View style={[styles.avatar, { backgroundColor: typeConf.color + '22' }]}>
            <Ionicons name={typeConf.icon} size={20} color={typeConf.color} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.reportedName}>{typeConf.label}</Text>
            <Text style={styles.reportedRole}>Durante un viaje activo</Text>
          </View>
          <View style={[styles.reasonBadge, { backgroundColor: statusConf.color + '22', borderColor: statusConf.color + '55' }]}>
            <Text style={[styles.reasonText, { color: statusConf.color }]}>{statusConf.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <Text style={styles.detailsText} numberOfLines={2}>{report.description}</Text>

        <View style={styles.metaRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatShortDate(report.createdAt)}</Text>
          {isOpen && (
            <View style={metaDotInline.pendingActionsContainer}>
              <View style={metaDotInline.pendingActionsRow}>
                <Text style={[styles.metaText, { color: Brand.colors.green.normal }]}>Ver acciones</Text>
                <Ionicons name="chevron-forward" size={12} color={Brand.colors.green.normal} />
              </View>
            </View>
          )}
        </View>
      </GlassCard>
    </AnimatedPressable>
  );
}
