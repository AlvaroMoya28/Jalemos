// Bottom-sheet of real moderation actions against a driver (suspend N days,
// revoke driver role, or deactivate). Shared by the trip-report and low-rating
// flows.

import { ActivityIndicator, Modal, Pressable, Text, View } from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/shared/animated-pressable';
import { Brand } from '@/constants/theme';
import { makeStyles } from '@/styles/tabs/admin-reports.styles';

import { DriverAction, DriverActionTarget } from '@/hooks/use-admin-reports';
import { SUSPENSION_OPTIONS } from './report-config';

export default function DriverActionSheet({
  target,
  visible,
  driverActing,
  onClose,
  onAction,
  styles,
}: {
  target: DriverActionTarget | null;
  visible: boolean;
  driverActing: boolean;
  onClose: () => void;
  onAction: (action: DriverAction, suspendDays?: number) => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={() => !driverActing && onClose()}>
      <Pressable style={styles.backdrop} onPress={() => !driverActing && onClose()}>
        <Animated.View entering={SlideInDown.duration(280)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
          <View style={styles.sheetHandle} />
          <Text style={styles.sheetTitle}>Acción sobre el conductor</Text>
          <Text style={styles.sheetReported}>{target?.driverName}</Text>

          {driverActing ? (
            <ActivityIndicator color={Brand.colors.green.normal} style={{ marginVertical: 16 }} />
          ) : (
            <>
              <Text style={styles.sheetSection}>Suspender cuenta temporalmente</Text>
              <View style={styles.suspensionRow}>
                {SUSPENSION_OPTIONS.map(opt => (
                  <Pressable key={opt.days} style={styles.suspensionChip} onPress={() => onAction('suspend', opt.days)}>
                    <Text style={styles.suspensionChipText}>{opt.label}</Text>
                  </Pressable>
                ))}
              </View>

              <AnimatedPressable pressedScale={0.98} onPress={() => onAction('revoke_role')}>
                <View style={[styles.btnDeactivate, { backgroundColor: '#9c6bff' }]}>
                  <Text style={styles.btnDeactivateText}>Revocar rol de conductor</Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable pressedScale={0.98} onPress={() => onAction('deactivate')}>
                <View style={styles.btnDeactivate}>
                  <Text style={styles.btnDeactivateText}>Desactivar cuenta permanentemente</Text>
                </View>
              </AnimatedPressable>

              <AnimatedPressable pressedScale={0.98} onPress={onClose}>
                <View style={styles.btnDismiss}>
                  <Text style={styles.btnDismissText}>Cancelar</Text>
                </View>
              </AnimatedPressable>
            </>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}
