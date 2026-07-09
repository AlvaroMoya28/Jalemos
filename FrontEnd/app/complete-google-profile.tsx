// Complete-your-profile screen — shown after a NEW user signs in with Google.
// Google gives us the email, name and photo, but Jalemos also needs a unique username,
// so we collect it here (name is pre-filled and editable). On submit the backend creates
// the account and returns a JWT, and the user lands on the search tab.

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
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
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeStyles } from '../styles/app/register.styles';

export default function CompleteGoogleProfileScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { completeGoogleProfile } = useAuth();
  const { showLoader, hideLoader } = useLoading();

  const params = useLocalSearchParams<{
    idToken: string;
    email: string;
    firstName: string;
    lastName: string;
    suggestedUsername: string;
    photoUrl: string;
  }>();

  const [nombre, setNombre] = useState(params.firstName ?? '');
  const [apellido, setApellido] = useState(params.lastName ?? '');
  const [username, setUsername] = useState(params.suggestedUsername ?? '');
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!nombre.trim() || !apellido.trim() || !username.trim()) {
      setError('Completá todos los campos');
      return;
    }
    if (username.trim().length < 3) {
      setError('El nombre de usuario debe tener al menos 3 caracteres');
      return;
    }
    if (!acceptedPolicies) {
      setError('Debés aceptar las políticas de uso para continuar');
      return;
    }
    if (!params.idToken) {
      setError('Sesión de Google expirada. Intentá de nuevo.');
      return;
    }
    showLoader('Creando tu cuenta...');
    try {
      const result = await completeGoogleProfile(
        params.idToken,
        username.trim(),
        nombre.trim(),
        apellido.trim(),
      );
      if (!result.success) {
        setError(result.error ?? 'Error al crear la cuenta');
        return;
      }
      setError('');
      router.replace('/(tabs)/search');
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
                <Text style={styles.title}>Ya casi estás</Text>
                <Text style={styles.subtitle}>Completá tu perfil para terminar</Text>
              </View>

              {params.email ? (
                <View style={styles.inputWrap}>
                  <Ionicons name="mail-outline" size={18} color={Brand.colors.green.normal} />
                  <TextInput
                    value={params.email}
                    editable={false}
                    style={[styles.input, { opacity: 0.7 }]}
                  />
                  <Ionicons name="logo-google" size={16} color={Brand.colors.green.dark} />
                </View>
              ) : null}

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

              <Pressable style={styles.policiesRow} onPress={() => setAcceptedPolicies(v => !v)}>
                <View style={[styles.checkbox, acceptedPolicies && styles.checkboxChecked]}>
                  {acceptedPolicies && <Ionicons name="checkmark" size={14} color={Brand.colors.black.b1} />}
                </View>
                <Text style={styles.policiesText}>
                  He leído y acepto las{' '}
                  <Text style={styles.policiesLink} onPress={() => router.push('/policies')}>
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

              <Pressable style={styles.cta} onPress={handleSubmit}>
                <Text style={styles.ctaText}>Crear cuenta</Text>
              </Pressable>

              <Text style={styles.loginText}>
                <Text style={styles.loginLink} onPress={() => router.back()}>
                  Cancelar
                </Text>
              </Text>
            </GlassCard>
          </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
