// Bottom-sheet for an in-trip report: verify it, escalate to a driver action,
// or dismiss it.

import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { TripReportDto } from '@/services/api';
import { sheetReasonCard, makeStyles } from '@/styles/tabs/admin-reports.styles';
import { formatShortDate } from '@/utils/format';

import { TRIP_TYPE_CONFIG } from './report-config';

export default function TripReportActionSheet({
  report,
  visible,
  updatingStatus,
  onClose,
  onUpdateStatus,
  onActionDriver,
  styles,
  colors,
}: {
  report: TripReportDto | null;
  visible: boolean;
  updatingStatus: boolean;
  onClose: () => void;
  onUpdateStatus: (status: string) => void;
  onActionDriver: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={() => !updatingStatus && onClose()}>
        <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>
            {report ? TRIP_TYPE_CONFIG[report.type]?.label ?? 'Reporte' : ''}
          </Text>
          <Text style={styles.sheetReported}>Durante un viaje activo</Text>

          <GlassCard style={sheetReasonCard.card} intensity={28}>
            <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted }]}>Descripción</Text>
            <Text style={[sheetReasonCard.reasonDetails, { color: colors.textSecondary }]} numberOfLines={5}>
              {report?.description}
            </Text>
            <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted, marginTop: 8 }]}>Fecha</Text>
            <Text style={[sheetReasonCard.reasonValue, { color: colors.textPrimary }]}>
              {report ? formatShortDate(report.createdAt) : ''}
            </Text>
          </GlassCard>

          {updatingStatus ? (
            <ActivityIndicator color={Brand.colors.green.normal} style={{ marginVertical: 8 }} />
          ) : (
            <>
              {report?.status === 'open' && (
                <AnimatedPressable pressedScale={0.98} onPress={() => onUpdateStatus('verified')}>
                  <View style={[styles.btnDeactivate, { backgroundColor: '#f4a522' }]}>
                    <Text style={styles.btnDeactivateText}>Marcar como verificado</Text>
                  </View>
                </AnimatedPressable>
              )}

              {/* Driver actions — only for driver_report type */}
              {report?.type === 'driver_report' && report.driverId && (
                <AnimatedPressable pressedScale={0.98} onPress={onActionDriver}>
                  <View style={[styles.btnDeactivate, { backgroundColor: '#f4a522' }]}>
                    <Text style={styles.btnDeactivateText}>Accionar sobre el conductor</Text>
                  </View>
                </AnimatedPressable>
              )}

              <AnimatedPressable pressedScale={0.98} onPress={() => onUpdateStatus('dismissed')}>
                <View style={styles.btnDismiss}>
                  <Text style={styles.btnDismissText}>Desestimar reporte</Text>
                </View>
              </AnimatedPressable>
            </>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
