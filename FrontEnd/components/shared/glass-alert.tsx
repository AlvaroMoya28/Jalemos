// Reusable liquid-glass alert modal.
// Uses nested BlurViews for a proper glassmorphism look: the backdrop and the card
// both blur independently. The card has a white/translucent rim border and soft glow.

import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Modal, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { styles } from './styles/glass-alert.styles';

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
  const isAndroid = Platform.OS === 'android';

  const handlePrimary   = () => { onPrimary?.();   onDismiss?.(); };
  const handleSecondary = () => { onSecondary?.(); onDismiss?.(); };

  // On Android BlurView renders without blur, so use opaque solid colors instead.
  const cardBg     = isAndroid
    ? (isDark ? '#1c1c20' : '#ffffff')
    : (isDark ? 'rgba(15, 15, 20, 0.45)' : 'rgba(255, 255, 255, 0.30)');
  const rimColor   = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.70)';
  const textPrim   = isDark ? '#f0f0f0' : '#0f1d1c';
  const textSec    = isDark ? 'rgba(240,240,240,0.72)' : 'rgba(15,29,28,0.68)';
  const btnSecBg   = isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.06)';
  const btnSecText = isDark ? 'rgba(240,240,240,0.85)' : 'rgba(15,29,28,0.75)';

  // On iOS the BlurView provides the frosted glass effect, while on Android we fall back to solid colors.
  const cardStyle = [
    styles.card,
    {
      backgroundColor: cardBg,
      borderColor: rimColor,
      shadowColor: isDark ? '#ffffff' : ic,
      shadowOpacity: isDark ? 0.06 : 0.15,
    },
  ];

  // The content of the alert card, shared between the Android and iOS implementations.
  const cardChildren = (
    <>
      <View style={[styles.rimHighlight, { backgroundColor: rimColor }]} />
      <Ionicons name={icon} size={52} color={ic} style={styles.iconMargin} />
      <Text style={[styles.title, { color: textPrim }]}>{title}</Text>
      <Text style={[styles.body, { color: textSec }]}>{body}</Text>
      <View style={styles.actions}>
        {secondaryLabel && (
          <Pressable
            style={[styles.btn, { backgroundColor: btnSecBg, borderColor: rimColor, borderWidth: 1 }]}
            onPress={handleSecondary}
          >
            <Text style={[styles.btnText, { color: btnSecText }]}>{secondaryLabel}</Text>
          </Pressable>
        )}
        <Pressable style={[styles.btn, { backgroundColor: ic }]} onPress={handlePrimary}>
          <Text style={[styles.btnText, { color: '#fff' }]}>{primaryLabel}</Text>
        </Pressable>
      </View>
      <View style={[styles.rimBottom, { backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.35)' }]} />
    </>
  );

  // The backdrop content is also shared, but on Android it uses a solid color while on iOS it uses a BlurView.
  const backdropContent = (
    <Pressable style={styles.backdrop} onPress={dismissible ? onDismiss : undefined}>
      <Pressable onPress={() => {}}>
        {isAndroid ? (
          <View style={cardStyle}>{cardChildren}</View>
        ) : (
          <BlurView
            intensity={isDark ? 80 : 60}
            tint={isDark ? 'dark' : 'extraLight'}
            style={cardStyle}
          >
            {cardChildren}
          </BlurView>
        )}
      </Pressable>
    </Pressable>
  );

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {isAndroid ? (
        <View
          style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.75)' : 'rgba(0,0,0,0.45)' }]}
        >
          {backdropContent}
        </View>
      ) : (
        <BlurView
          intensity={isDark ? 55 : 45}
          tint={isDark ? 'dark' : 'light'}
          style={StyleSheet.absoluteFill}
        >
          {backdropContent}
        </BlurView>
      )}
    </Modal>
  );
}

