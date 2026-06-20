// Driver registration screen — reached from the profile mode-toggle when the user has
// never registered as a driver. Collects personal info, profile photo, vehicle details,
// licence photos and the Dekra inspection photo, then submits the application.
// Form state + validation live in useDriverRegistrationForm; sections render it.

import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import {
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';

import DocumentCameraModal from '@/components/shared/document-camera-modal';
import DekraSection from '@/components/driver-registration/dekra-section';
import LicenseSection from '@/components/driver-registration/license-section';
import PersonalInfoSection from '@/components/driver-registration/personal-info-section';
import ProfilePhotoSection from '@/components/driver-registration/profile-photo-section';
import VehicleSection from '@/components/driver-registration/vehicle-section';
import { Brand } from '@/constants/theme';
import { useLoading } from '@/contexts/loading';
import { useAppTheme } from '@/hooks/use-app-theme';
import { CAMERA_CONFIG, useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '../styles/app/driver-registration.styles';

export default function DriverRegistrationScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { showLoader, hideLoader } = useLoading();
  const form = useDriverRegistrationForm();

  return (
    <ImageBackground
      source={isDark ? require('../assets/images/tropical-bg-dark.jpg') : require('../assets/images/tropical-bg.jpg')}
      style={styles.bg}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">

          <Pressable style={styles.backBtn} onPress={() => { showLoader(); router.back(); setTimeout(() => hideLoader(), 300); }}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <View style={styles.header}>
            <Text style={styles.title}>Registro de conductor</Text>
            <Text style={styles.subtitle}>Completa tu perfil para poder ofrecer viajes</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color={Brand.colors.green.dark} />
            <Text style={styles.infoText}>
              Tu información es verificada para garantizar la seguridad de todos los usuarios. El proceso puede tomar hasta 24 horas.
            </Text>
          </View>

          <PersonalInfoSection form={form} styles={styles} colors={colors} />
          <ProfilePhotoSection form={form} styles={styles} />
          <VehicleSection form={form} styles={styles} colors={colors} />
          <LicenseSection form={form} styles={styles} />
          <DekraSection form={form} styles={styles} />

          <Pressable style={styles.cta} onPress={form.handleRegister}>
            <Text style={styles.ctaText}>Registrarme como conductor</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {form.cameraOpen && (
        <DocumentCameraModal
          visible
          documentType={CAMERA_CONFIG[form.cameraOpen].type}
          label={CAMERA_CONFIG[form.cameraOpen].label}
          onCapture={(uri) => form.setPhoto(form.cameraOpen!, uri)}
          onClose={() => form.setCameraOpen(null)}
        />
      )}
    </ImageBackground>
  );
}
