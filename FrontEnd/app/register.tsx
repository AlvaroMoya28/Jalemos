// Registration screen — shown when a new user taps "Regístrate aquí" on the login screen.
// Collects name, surname, email, password and confirm-password, then navigates to the
// main tab group on success. Social sign-up (Google / Apple) mirrors the login flow.
// Card entrance animation and floating logo match the login screen for visual consistency.

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
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
import { makeStyles } from '../styles/app/register.styles';

export default function RegisterScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { register } = useAuth();
  const { showLoader, hideLoader } = useLoading();

  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!nombre.trim() || !apellido.trim() || !username.trim() || !email.trim() || !password) {
      setError('Completá todos los campos');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Ingresá un correo válido');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (!acceptedPolicies) {
      setError('Debés aceptar las políticas de uso para continuar');
      return;
    }
    showLoader('Creando tu cuenta...');
    try {
      const result = await register({ username, email, firstName: nombre, lastName: apellido, password });
      if (!result.success) {
        setError(result.error ?? 'Error al crear la cuenta');
        return;
      }
      setError('');
      router.replace({ pathname: '/verify-email', params: { userId: result.userId, email: result.email } });
    } finally {
      hideLoader();
    }
  };

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
  }, [cardOpacity, cardTranslate, logoY]);

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
                <Text style={styles.title}>¡Bienvenido!</Text>
                <Text style={styles.subtitle}>Crea tu cuenta gratis</Text>
              </View>

              <View style={styles.row}>
                <View style={styles.inputWrapFlex}>
                  <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
                  <TextInput
                    value={nombre}
                    onChangeText={setNombre}
                    placeholder="Nombre *"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
                <View style={styles.inputWrapFlex}>
                  <TextInput
                    value={apellido}
                    onChangeText={setApellido}
                    placeholder="Apellido *"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="at-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Nombre de usuario *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="mail-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Correo electrónico *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Contraseña *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(p => !p)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Brand.colors.green.normal} />
                </Pressable>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="lock-closed-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Confirmar contraseña *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  secureTextEntry={!showConfirm}
                />
                <Pressable onPress={() => setShowConfirm(p => !p)}>
                  <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={18} color={Brand.colors.green.normal} />
                </Pressable>
              </View>

              {/* Aceptar políticas */}
              <Pressable style={styles.policiesRow} onPress={() => setAcceptedPolicies(v => !v)}>
                <View style={[styles.checkbox, acceptedPolicies && styles.checkboxChecked]}>
                  {acceptedPolicies && <Ionicons name="checkmark" size={14} color={Brand.colors.black.b1} />}
                </View>
                <Text style={styles.policiesText}>
                  He leído y acepto las{' '}
                  <Text
                    style={styles.policiesLink}
                    onPress={() => router.push('/policies')}>
                    Políticas de uso
                  </Text>
                </Text>
              </Pressable>

              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={16} color={Brand.colors.alerts.error} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <Pressable style={styles.cta} onPress={handleRegister}>
                <Text style={styles.ctaText}>Crear cuenta</Text>
              </Pressable>

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.dividerLabel}>o regístrate con</Text>
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

              <Text style={styles.loginText}>
                ¿Ya tienes cuenta?{' '}
                <Text style={styles.loginLink} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
                  Ingresa aquí
                </Text>
              </Text>
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
