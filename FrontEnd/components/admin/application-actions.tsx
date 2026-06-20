// Action buttons for the application detail: approve/correct/reject when
// editable, or cooldown-lift + back when read-only.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import AnimatedPressable from '@/components/shared/animated-pressable';
import { makeStyles } from '@/styles/app/application-detail.styles';

export default function ApplicationActions({
  isEditable, hasCooldown, onApprove, onRequestCorrection, onReject, onLiftCooldown, onBack, styles,
}: {
  isEditable: boolean;
  hasCooldown: boolean;
  onApprove: () => void;
  onRequestCorrection: () => void;
  onReject: () => void;
  onLiftCooldown: () => void;
  onBack: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  if (isEditable) {
    return (
      <Animated.View entering={FadeInDown.duration(200).delay(240)} style={styles.actionRow}>
        <AnimatedPressable pressedScale={0.98} onPress={onApprove}>
          <View style={styles.btnPrimary}><Text style={styles.btnPrimaryText}>Aprobar solicitud</Text></View>
        </AnimatedPressable>
        <AnimatedPressable pressedScale={0.98} onPress={onRequestCorrection}>
          <View style={styles.btnWarning}><Text style={styles.btnWarningText}>Solicitar corrección</Text></View>
        </AnimatedPressable>
        <AnimatedPressable pressedScale={0.98} onPress={onReject}>
          <View style={styles.btnDanger}><Text style={styles.btnDangerText}>Rechazar solicitud</Text></View>
        </AnimatedPressable>
      </Animated.View>
    );
  }

  return (
    <Animated.View entering={FadeInDown.duration(200).delay(200)} style={{ gap: 10 }}>
      {hasCooldown && (
        <AnimatedPressable pressedScale={0.98} onPress={onLiftCooldown}>
          <View style={[styles.btnWarning, { flexDirection: 'row', gap: 8, justifyContent: 'center' }]}>
            <Ionicons name="timer-outline" size={17} color="#fff" />
            <Text style={styles.btnWarningText}>Levantar cooldown</Text>
          </View>
        </AnimatedPressable>
      )}
      <Pressable style={styles.btnSecondary} onPress={onBack}>
        <Text style={styles.btnSecondaryText}>Volver a solicitudes</Text>
      </Pressable>
    </Animated.View>
  );
}
