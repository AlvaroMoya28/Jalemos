// Email verification screen — shown after registration.
// The user enters the 6-digit code sent to their email address.
// On success the backend returns a JWT and the user is logged in automatically.

import GlassCard from '@/components/shared/glass-card';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  TextInputKeyPressEventData,
  View,
} from 'react-native';
import { makeStyles } from '../styles/app/verify-email.styles';

const CODE_LENGTH = 6;

export default function VerifyEmailScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { verifyEmail } = useAuth();
  const { showLoader, hideLoader } = useLoading();

  const { userId, email } = useLocalSearchParams<{ userId: string; email: string }>();
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [focusedIndex, setFocusedIndex] = useState(0);
  const [error, setError] = useState('');
  const inputRefs = useRef<(TextInput | null)[]>(Array(CODE_LENGTH).fill(null));

  const code = digits.join('');
  const isFull = code.length === CODE_LENGTH && digits.every(d => d !== '');

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;
  const logoY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(logoY, { toValue: -7, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(logoY, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Focus first input on mount
    setTimeout(() => inputRefs.current[0]?.focus(), 300);
  }, [cardOpacity, cardTranslate, logoY]);

  const handleDigitChange = (value: string, index: number) => {
    const digit = value.replace(/[^0-9]/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: NativeSyntheticEvent<TextInputKeyPressEventData>, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
      const next = [...digits];
      next[index - 1] = '';
      setDigits(next);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    if (!isFull || !userId) return;
    showLoader('Verificando código...');
    try {
      const result = await verifyEmail(userId, code);
      if (!result.success) {
        setError(result.error ?? 'Código incorrecto');
        setDigits(Array(CODE_LENGTH).fill(''));
        inputRefs.current[0]?.focus();
        return;
      }
      router.replace('/(tabs)/search');
    } finally {
      hideLoader();
    }
  };

  return (
    <ImageBackground
      source={isDark ? require('../assets/images/tropical-bg-dark.jpg') : require('../assets/images/tropical-bg.jpg')}
      style={styles.bg}
      resizeMode="cover">
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <View style={styles.logoBlock}>
            <Animated.View style={{ transform: [{ translateY: logoY }] }}>
              <Image
                source={require('../assets/images/jalemos-logo2.png')}
                style={[styles.logo, isDark && { tintColor: '#ffffff' }]}
              />
            </Animated.View>
            <Text style={styles.brand}>Jalemos</Text>
          </View>

          <Animated.View style={[styles.cardWrap, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
            <GlassCard style={styles.card} intensity={48}>

              <View style={styles.cardHeader}>
                <View style={styles.mailIconWrap}>
                  <Ionicons name="mail-open-outline" size={28} color="#15a876" />
                </View>
                <Text style={styles.title}>Verificá tu correo</Text>
                <Text style={styles.subtitle}>
                  Enviamos un código de 6 dígitos a{'\n'}
                  <Text style={styles.emailHighlight}>{email}</Text>
                </Text>
              </View>

              {/* 6-digit code inputs */}
              <View style={styles.codeRow}>
                {digits.map((digit, i) => (
                  <View
                    key={i}
                    style={[
                      styles.codeBox,
                      focusedIndex === i ? styles.codeBoxActive : digit ? styles.codeBoxFilled : styles.codeBoxEmpty,
                    ]}>
                    <TextInput
                      ref={ref => { inputRefs.current[i] = ref; }}
                      value={digit}
                      onChangeText={v => handleDigitChange(v, i)}
                      onKeyPress={e => handleKeyPress(e, i)}
                      onFocus={() => setFocusedIndex(i)}
                      onBlur={() => setFocusedIndex(-1)}
                      keyboardType="number-pad"
                      maxLength={1}
                      selectTextOnFocus
                      style={[styles.codeText, styles.codeTextColor, { textAlign: 'center' }]}
                    />
                  </View>
                ))}
              </View>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color="#a6192a" />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable
                style={[styles.cta, !isFull && styles.ctaDisabled]}
                onPress={handleVerify}
                disabled={!isFull}>
                <Text style={styles.ctaText}>Confirmar código</Text>
              </Pressable>

              <Pressable onPress={() => router.replace('/register')}>
                <Text style={styles.backLink}>Volver al registro</Text>
              </Pressable>

            </GlassCard>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
