// Login / landing screen — the first screen users see when opening the app.
// Displays a branded hero background, a glass-morphism login card with
// username/password fields, social auth options, and a registration link.
// Card colors adapt to the device light/dark mode setting.

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeStyles } from '../styles/app/index.styles';

export default function LoginScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { login } = useAuth();
  const { showLoader, hideLoader } = useLoading();
  const { setDriverRegistered } = useUserMode();

  const [showPassword, setShowPassword] = useState(false);
  const [user, setUser] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!user.trim() || !password) {
      setError('Completá usuario y contraseña');
      return;
    }
    showLoader('Iniciando sesión...');
    try {
      const result = await login(user.trim(), password);
      if (!result.success) {
        // Account exists but email isn't verified → send the user to the code screen.
        if (result.needsVerification && result.userId) {
          setError('');
          router.push({ pathname: '/verify-email', params: { userId: result.userId, email: result.email } });
          return;
        }
        setError(result.error ?? 'Error al iniciar sesión');
        return;
      }
      setError('');
      if (result.user?.role === 'passenger+driver') {
        setDriverRegistered(true);
      }
      // Redirect based on role: admins go to applications, regular users go to search.
      router.replace(result.user?.role === 'admin' ? '/(tabs)/admin-applications' : '/(tabs)/search');
    } finally {
      hideLoader();
    }
  };

  // Animated values for the card entrance animation (fade + slide up)
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslate = useRef(new Animated.Value(16)).current;

  // Animated value for the logo bounce
  const logoY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(cardOpacity, { toValue: 1, duration: 350, useNativeDriver: true }),
      Animated.timing(cardTranslate, { toValue: 0, duration: 350, useNativeDriver: true }),
    ]).start();

    // Infinite gentle bounce: float up 7px then back down
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoY, {
          toValue: -7,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(logoY, {
          toValue: 0,
          duration: 700,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [cardOpacity, cardTranslate, logoY]);

  return (
    <ImageBackground
      source={isDark ? require('../assets/images/tropical-bg-dark.jpg') : require('../assets/images/tropical-bg.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
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
            <View style={{ alignItems: 'center' }}>
              {([ [-1,-1],[0,-1],[1,-1],[-1,0],[1,0],[-1,1],[0,1],[1,1] ] as [number,number][]).map(([x,y], i) => (
                <Text key={i} style={[styles.brandOutline, { transform: [{ translateX: x }, { translateY: y }] }]}>Jalemos</Text>
              ))}
              <Text style={styles.brand}>Jalemos</Text>
            </View>
          </View>

          <Animated.View style={[styles.cardWrap, { opacity: cardOpacity, transform: [{ translateY: cardTranslate }] }]}>
            <GlassCard style={styles.card} intensity={48}>
              <View style={styles.cardHeader}>
                <Text style={styles.title}>¡Pura Vida!</Text>
                <Text style={styles.subtitle}>Ingresa a tu cuenta</Text>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={user}
                  onChangeText={setUser}
                  placeholder="Usuario"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword((prev) => !prev)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Brand.colors.green.normal} />
                </Pressable>
              </View>

              <Pressable style={styles.forgotButton}>
                <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
              </Pressable>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Brand.colors.alerts.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable style={styles.cta} onPress={handleLogin}>
                <Text style={styles.ctaText}>Ingresar</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerLabel}>o continúa con</Text>
                <View style={styles.divider} />
              </View>

              <Pressable style={styles.socialBtn}>
                <Ionicons name="logo-google" size={18} color={Brand.colors.green.dark} />
                <Text style={styles.socialText}>Google</Text>
              </Pressable>

              <Pressable style={styles.socialBtn}>
                <Ionicons name="logo-apple" size={18} color={Brand.colors.green.dark} />
                <Text style={styles.socialText}>Apple</Text>
              </Pressable>

              <Text style={styles.registerText}>
                ¿No tienes cuenta?{' '}
                <Text style={styles.registerLink} onPress={() => router.push('/register')}>
                  Regístrate aquí
                </Text>
              </Text>
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
