// Bottom-sheet of moderation actions for an in-memory user report:
// temporary suspension, permanent deactivation, or dismissal.

import { Modal, Pressable, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/shared/animated-pressable';
import GlassCard from '@/components/shared/glass-card';
import { REPORT_REASON_LABELS, UserReport } from '@/constants/mock-reports';
import { useAppTheme } from '@/hooks/use-app-theme';
import { sheetReasonCard, makeStyles } from '@/styles/tabs/admin-reports.styles';

import { SUSPENSION_OPTIONS } from './report-config';

export default function UserReportActionSheet({
  report,
  visible,
  onClose,
  onSuspend,
  onDeactivate,
  onDismiss,
  styles,
  colors,
}: {
  report: UserReport | null;
  visible: boolean;
  onClose: () => void;
  onSuspend: (days: number) => void;
  onDeactivate: () => void;
  onDismiss: () => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Acción sobre el usuario</Text>
          <Text style={styles.sheetReported}>{report?.reportedUserName}</Text>

          <GlassCard style={sheetReasonCard.card} intensity={28}>
            <Text style={[sheetReasonCard.reasonLabel, { color: colors.textMuted }]}>Motivo del reporte</Text>
            <Text style={[sheetReasonCard.reasonValue, { color: colors.textPrimary }]}>
              {report ? REPORT_REASON_LABELS[report.reason] : ''}
            </Text>
            <Text style={[sheetReasonCard.reasonDetails, { color: colors.textSecondary }]} numberOfLines={3}>
              {report?.details}
            </Text>
          </GlassCard>

          <Text style={styles.sheetSection}>Suspender cuenta temporalmente</Text>
          <View style={styles.suspensionRow}>
            {SUSPENSION_OPTIONS.map((opt) => (
              <Pressable key={opt.days} style={styles.suspensionChip} onPress={() => onSuspend(opt.days)}>
                <Text style={styles.suspensionChipText}>{opt.label}</Text>
              </Pressable>
            ))}
          </View>

          <AnimatedPressable pressedScale={0.98} onPress={onDeactivate}>
            <View style={styles.btnDeactivate}>
              <Text style={styles.btnDeactivateText}>Desactivar cuenta permanentemente</Text>
            </View>
          </AnimatedPressable>

          <AnimatedPressable pressedScale={0.98} onPress={onDismiss}>
            <View style={styles.btnDismiss}>
              <Text style={styles.btnDismissText}>Desestimar reporte</Text>
            </View>
          </AnimatedPressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
