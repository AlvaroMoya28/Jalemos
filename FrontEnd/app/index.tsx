// Login / landing screen — the first screen users see when opening the app.
// Displays a branded hero background, a glass-morphism login card with
// username/password fields, social auth options, and a registration link.
// Card colors adapt to the device light/dark mode setting.

import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
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
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

function makeStyles(colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    bg: {
      flex: 1,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(10, 63, 57, 0.32)',
    },
    keyboard: {
      flex: 1,
    },
    container: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: Brand.grid.margin,
      paddingVertical: Brand.spacing[24],
    },
    logoBlock: {
      alignItems: 'center',
      marginBottom: 18,
    },
    logo: {
      width: 180,
      height: 180,
      marginBottom: -60,
    },
    brand: {
      fontSize: 48,
      color: Brand.colors.green.normal,
      fontFamily: Fonts.headingHeavy,
      letterSpacing: 3,
    },
    brandOutline: {
      fontSize: 48,
      color: '#ffffff',
      fontFamily: Fonts.headingHeavy,
      letterSpacing: 3,
      position: 'absolute',
    },
    cardWrap: {
      ...withElevation(600),
    },
    card: {
      borderRadius: Brand.radius[24],
      padding: Brand.spacing[16],
      gap: 10,
    },
    cardHeader: {
      alignItems: 'center',
      marginBottom: 4,
    },
    title: {
      fontSize: Brand.typography.h4.fontSize,
      color: colors.textPrimary,
      fontFamily: Fonts.headingBold,
    },
    subtitle: {
      color: '#ffffff',
      fontSize: 13,
      fontFamily: Fonts.sans,
    },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.inputBg,
      paddingHorizontal: 12,
      paddingVertical: 12,
    },
    input: {
      flex: 1,
      fontSize: 14,
      color: colors.inputText,
      fontFamily: Fonts.sans,
    },
    forgotButton: {
      alignSelf: 'flex-end',
    },
    forgotText: {
      color: '#ffffff',
      fontFamily: Fonts.heading,
      fontSize: 12,
    },
    cta: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999,
      paddingVertical: Brand.buttonSizes.regular.height / 2 - 8,
      alignItems: 'center',
    },
    ctaText: {
      color: Brand.colors.black.b1,
      fontSize: 15,
      fontFamily: Fonts.headingBold,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginVertical: 4,
    },
    divider: {
      flex: 1,
      height: 1,
      backgroundColor: colors.border,
    },
    dividerLabel: {
      color: '#ffffff',
      fontSize: 11,
      fontFamily: Fonts.sans,
    },
    socialBtn: {
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceAlt,
      paddingVertical: 11,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: 8,
    },
    socialText: {
      color: colors.textPrimary,
      fontFamily: Fonts.heading,
      fontSize: 13,
    },
    registerText: {
      textAlign: 'center',
      marginTop: 4,
      fontSize: 13,
      color: '#ffffff',
      fontFamily: Fonts.sans,
    },
    registerLink: {
      textDecorationLine: 'underline',
      color: '#ffffff',
      fontFamily: Fonts.heading,
    },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(166, 25, 42, 0.12)',
      borderWidth: 1,
      borderColor: 'rgba(166, 25, 42, 0.4)',
      borderRadius: Brand.radius[8],
      paddingHorizontal: 12,
      paddingVertical: 10,
    },
    errorText: {
      flex: 1,
      color: Brand.colors.alerts.error,
      fontFamily: Fonts.sans,
      fontSize: 13,
    },
  });
}

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
        setError(result.error ?? 'Error al iniciar sesión');
        return;
      }
      setError('');
      if (result.user?.role === 'passenger+driver') {
        setDriverRegistered(true);
      }
      router.replace('/(tabs)/search');
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
