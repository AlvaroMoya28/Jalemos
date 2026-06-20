// Slide to action — real PanResponder drag: pull the thumb to the right edge to trigger.
// A GlassAlert confirmation appears once the drag threshold is reached.
// Shared component (used by the driver boarding flow).

import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { Animated, PanResponder, Text, View } from 'react-native';

import { useAppTheme } from '@/hooks/use-app-theme';

import GlassAlert from './glass-alert';
import { slideStyles } from './styles/slide-to-action.styles';

const THUMB_SIZE = 62;
const DRAG_THRESHOLD = 0.82; // fraction of track width that triggers confirm

export function SlideToAction({ label, onSlide, disabled, color, insets }: {
  label: string;
  onSlide?: () => void;
  disabled?: boolean;
  color: string;
  insets: { bottom: number };
}) {
  const { colors }     = useAppTheme();
  const x              = useRef(new Animated.Value(0)).current;
  const [, setTrackW] = useState(0);
  const [showConfirm, setShowConfirm] = useState(false);
  // Refs so PanResponder closures always read the latest values
  // (PanResponder.create is called once and captures the initial closure)
  const trackWRef   = useRef(0);
  const disabledRef = useRef(disabled);
  disabledRef.current = disabled;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabledRef.current,
      onMoveShouldSetPanResponder:  () => !disabledRef.current,
      onPanResponderMove: (_, { dx }) => {
        const mX = Math.max(0, trackWRef.current - THUMB_SIZE - 8);
        x.setValue(Math.min(Math.max(0, dx), mX));
      },
      onPanResponderRelease: (_, { dx }) => {
        const mX = Math.max(0, trackWRef.current - THUMB_SIZE - 8);
        if (mX > 0 && dx / mX >= DRAG_THRESHOLD) {
          x.setValue(mX);
          setShowConfirm(true);
        } else {
          Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
        }
      },
    }),
  ).current;

  const resetThumb = () => {
    Animated.spring(x, { toValue: 0, useNativeDriver: true }).start();
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    resetThumb();
    onSlide?.();
  };

  const handleCancel = () => {
    setShowConfirm(false);
    resetThumb();
  };

  return (
    <View style={[slideStyles.wrapper, { paddingBottom: insets.bottom + 12 }]}>
      <View
        style={[slideStyles.track, { backgroundColor: disabled ? colors.border : color + '33' }]}
        onLayout={e => {
          const w = e.nativeEvent.layout.width;
          trackWRef.current = w;
          setTrackW(w);
        }}
      >
        <Animated.View
          style={[slideStyles.thumb, { backgroundColor: disabled ? '#aaa' : color, transform: [{ translateX: x }] }]}
          {...(disabled ? {} : panResponder.panHandlers)}
        >
          <Ionicons name="chevron-forward-outline" size={22} color="#fff" />
        </Animated.View>
        <Text style={[slideStyles.label, { color: disabled ? '#aaa' : color, opacity: disabled ? 0.5 : 1 }]}>
          {label}
        </Text>
      </View>

      <GlassAlert
        visible={showConfirm}
        icon="checkmark-circle"
        iconColor={color}
        title="¿Confirmas esta acción?"
        body={label}
        primaryLabel="Confirmar"
        onPrimary={handleConfirm}
        secondaryLabel="Cancelar"
        onSecondary={handleCancel}
        dismissible={false}
        onDismiss={handleCancel}
      />
    </View>
  );
}
