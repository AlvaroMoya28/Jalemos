// Reusable liquid-glass alert modal.
// Uses nested BlurViews for a proper glassmorphism look: the backdrop and the card
// both blur independently. The card has a white/translucent rim border and soft glow.

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

interface GlassAlertProps {
  visible: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  title: string;
  body: string;
  primaryLabel?: string;
  onPrimary?: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export default function GlassAlert({
  visible,
  icon = 'information-circle',
  iconColor,
  title,
  body,
  primaryLabel = 'Entendido',
  onPrimary,
  secondaryLabel,
  onSecondary,
  dismissible = true,
  onDismiss,
}: GlassAlertProps) {
  const { isDark } = useAppTheme();
  const ic = iconColor ?? Brand.colors.green.normal;

  const handlePrimary   = () => { onPrimary?.();   onDismiss?.(); };
  const handleSecondary = () => { onSecondary?.(); onDismiss?.(); };

  // Glass card colors — more transparent for true glassmorphism
  const cardBg     = isDark ? 'rgba(15, 15, 20, 0.45)' : 'rgba(255, 255, 255, 0.30)';
  const rimColor   = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.70)';
  const textPrim   = isDark ? '#f0f0f0' : '#0f1d1c';
  const textSec    = isDark ? 'rgba(240,240,240,0.72)' : 'rgba(15,29,28,0.68)';
  const btnSecBg   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const btnSecText = isDark ? 'rgba(240,240,240,0.85)' : 'rgba(15,29,28,0.75)';

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {/* ── Backdrop blur ── */}
      <BlurView
        intensity={isDark ? 55 : 45}
        tint={isDark ? 'dark' : 'light'}
        style={StyleSheet.absoluteFill}
      >
        <Pressable style={s.backdrop} onPress={dismissible ? onDismiss : undefined}>

          {/* ── Glass card with its own blur ── */}
          <Pressable onPress={() => {/* swallow tap so backdrop doesn't close */}}>
            <BlurView
              intensity={isDark ? 80 : 60}
              tint={isDark ? 'dark' : 'extraLight'}
              style={[
                s.card,
                {
                  backgroundColor: cardBg,
                  borderColor: rimColor,
                  // Outer glow
                  shadowColor: isDark ? '#ffffff' : ic,
                  shadowOpacity: isDark ? 0.06 : 0.15,
                },
              ]}
            >
              {/* Top rim highlight — simulates glass edge refraction */}
              <View style={[s.rimHighlight, { backgroundColor: rimColor }]} />

              {/* Icon */}
              <Ionicons name={icon} size={52} color={ic} style={{ marginBottom: 6 }} />

              {/* Title */}
              <Text style={[s.title, { color: textPrim }]}>{title}</Text>

              {/* Body */}
              <Text style={[s.body, { color: textSec }]}>{body}</Text>

              {/* Actions */}
              <View style={s.actions}>
                {secondaryLabel && (
                  <Pressable
                    style={[s.btn, { backgroundColor: btnSecBg, borderColor: rimColor, borderWidth: 1 }]}
                    onPress={handleSecondary}
                  >
                    <Text style={[s.btnText, { color: btnSecText }]}>{secondaryLabel}</Text>
                  </Pressable>
                )}
                <Pressable
                  style={[s.btn, { backgroundColor: ic }]}
                  onPress={handlePrimary}
                >
                  <Text style={[s.btnText, { color: '#fff' }]}>{primaryLabel}</Text>
                </Pressable>
              </View>

              {/* Bottom rim — subtler */}
              <View style={[s.rimBottom, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.35)' }]} />
            </BlurView>
          </Pressable>
        </Pressable>
      </BlurView>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 26,
  },
  card: {
    width: '100%',
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 1,
    paddingHorizontal: 26,
    paddingTop: 32,
    paddingBottom: 26,
    alignItems: 'center',
    gap: 0,
    // Shadow / glow
    shadowOffset: { width: 0, height: 16 },
    shadowRadius: 40,
    elevation: 20,
  },
  // Thin top rim that catches light — key glassmorphism detail
  rimHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1.5,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  rimBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: {
    fontFamily: Fonts.headingHeavy,
    fontSize: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  body: {
    fontFamily: Fonts.sans,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 26,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  btn: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: Fonts.headingBold,
    fontSize: 14,
  },
});
