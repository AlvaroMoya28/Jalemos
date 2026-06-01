// Document renewal screen — lets an approved driver update their license and/or Dekra photos
// and expiry dates. Submits a renewal application (is_renewal: true) that goes through
// the same admin review queue as the original application.

import DocumentCameraModal from '@/components/document-camera-modal';
import ExpiryInput, { parseExpiry } from '@/components/expiry-input';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useApplications } from '@/contexts/applications';
import { useLoading } from '@/contexts/loading';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActionSheetIOS,
  Alert,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    bg: { flex: 1 },
    overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(10, 63, 57, 0.35)' },
    keyboard: { flex: 1 },
    container: {
      flexGrow: 1,
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 60,
      paddingBottom: Brand.spacing[24],
      gap: 14,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start', marginBottom: 4 },
    backText: { color: '#ffffff', fontFamily: Fonts.heading, fontSize: 14 },
    title: { color: '#ffffff', fontFamily: Fonts.headingHeavy, fontSize: 28 },
    subtitle: { color: 'rgba(255,255,255,0.75)', fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
    cardWrap: { ...withElevation(400) },
    card: { borderRadius: Brand.radius[24], padding: Brand.spacing[16], gap: 10 },
    sectionLabel: {
      fontSize: 11, color: c.textPrimary, fontFamily: Fonts.heading,
      textTransform: 'uppercase', marginBottom: 2, marginTop: 4,
    },
    row: { flexDirection: 'row', gap: 10 },
    inputFlex: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, fontSize: 14, color: c.inputText, fontFamily: Fonts.sans },
    photoRow: { flexDirection: 'row', gap: 10 },
    photoBtn: {
      flex: 1, height: 110, borderRadius: Brand.radius[12],
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      backgroundColor: c.inputBg,
      alignItems: 'center', justifyContent: 'center', gap: 6,
      overflow: 'hidden',
    },
    photoBtnFull: {
      height: 110, borderRadius: Brand.radius[12],
      borderWidth: 1.5, borderColor: c.border, borderStyle: 'dashed',
      backgroundColor: c.inputBg,
      alignItems: 'center', justifyContent: 'center', gap: 6,
      overflow: 'hidden',
    },
    photoBtnDone: { borderColor: Brand.colors.green.normal, borderStyle: 'solid' },
    photoThumb: { width: '100%', height: '100%', resizeMode: 'cover' },
    photoLabel: { fontSize: 12, fontFamily: Fonts.heading, color: c.textMuted },
    photoSublabel: { fontSize: 10, fontFamily: Fonts.sans, color: c.textMuted },
    photoDoneIcon: { position: 'absolute', top: 6, right: 6 },
    retakeOverlay: {
      position: 'absolute', bottom: 0, left: 0, right: 0,
      backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 4, alignItems: 'center',
    },
    infoBox: {
      flexDirection: 'row', gap: 10,
      backgroundColor: Brand.colors.green.light + '33',
      borderRadius: Brand.radius[12], padding: 12,
      borderWidth: 1, borderColor: Brand.colors.green.light,
    },
    infoText: { flex: 1, color: '#ffffff', fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
    cta: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999, paddingVertical: 14, alignItems: 'center',
      ...withElevation(400),
    },
    ctaText: { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.headingBold },
  });
}

type PhotoSlot = { uri: string } | null;

function PhotoPickerBtn({ photo, label, sublabel, onPress, style }: {
  photo: PhotoSlot; label: string; sublabel?: string; onPress: () => void; style?: object;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable style={[style ?? styles.photoBtn, photo && styles.photoBtnDone]} onPress={onPress}>
      {photo ? (
        <>
          <Image source={{ uri: photo.uri }} style={styles.photoThumb} />
          <View style={styles.photoDoneIcon}>
            <Ionicons name="checkmark-circle" size={20} color={Brand.colors.green.normal} />
          </View>
          <View style={styles.retakeOverlay}>
            <Ionicons name="camera-outline" size={18} color="#fff" />
          </View>
        </>
      ) : (
        <>
          <Ionicons name="camera-outline" size={26} color={Brand.colors.green.normal} />
          <Text style={styles.photoLabel}>{label}</Text>
          {sublabel ? <Text style={styles.photoSublabel}>{sublabel}</Text> : null}
        </>
      )}
    </Pressable>
  );
}

async function pickFromGallery(): Promise<PhotoSlot> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85 });
  if (result.canceled) return null;
  return { uri: result.assets[0].uri };
}

export default function DriverDocumentsScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { submitApplication } = useApplications();
  const { showLoader, hideLoader } = useLoading();

  const [licenciaFront, setLicenciaFront] = useState<PhotoSlot>(null);
  const [licenciaBack,  setLicenciaBack]  = useState<PhotoSlot>(null);
  const [dekraPhoto,    setDekraPhoto]    = useState<PhotoSlot>(null);
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [dekraExpiry,   setDekraExpiry]   = useState('');

  type CameraTarget = 'licenciaFront' | 'licenciaBack' | 'dekra';
  const [cameraOpen, setCameraOpen] = useState<CameraTarget | null>(null);

  const cameraConfig: Record<CameraTarget, { label: string; type: 'license' | 'document' }> = {
    licenciaFront: { label: 'Licencia — Lado frontal', type: 'license' },
    licenciaBack:  { label: 'Licencia — Lado trasero', type: 'license' },
    dekra:         { label: 'Revisión técnica Dekra',  type: 'document' },
  };

  const setPhoto = (target: CameraTarget, uri: string) => {
    if (target === 'licenciaFront') setLicenciaFront({ uri });
    else if (target === 'licenciaBack') setLicenciaBack({ uri });
    else setDekraPhoto({ uri });
  };

  const openPhotoOptions = (target: CameraTarget) => {
    const openCamera  = () => setCameraOpen(target);
    const openGallery = async () => { const p = await pickFromGallery(); if (p) setPhoto(target, p.uri); };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        i => { if (i === 1) openCamera(); if (i === 2) openGallery(); }
      );
    } else {
      Alert.alert('Adjuntar foto', '', [
        { text: 'Tomar foto',        onPress: openCamera  },
        { text: 'Elegir de galería', onPress: openGallery },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const toBase64 = async (uri: string | null): Promise<string | null> => {
    if (!uri) return null;
    const ref    = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
    const result = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.78, base64: true });
    return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
  };

  const handleSubmit = async () => {
    if (!licenciaFront && !licenciaBack && !dekraPhoto) {
      Alert.alert('Sin fotos', 'Adjuntá al menos una foto para renovar.');
      return;
    }
    showLoader('Subiendo imágenes...');
    try {
      const [frontB64, backB64, dekraB64] = await Promise.all([
        toBase64(licenciaFront?.uri ?? null),
        toBase64(licenciaBack?.uri  ?? null),
        toBase64(dekraPhoto?.uri    ?? null),
      ]);
      showLoader('Enviando renovación...');
      const { month: licM, year: licY } = parseExpiry(licenseExpiry);
      const { month: dkM,  year: dkY  } = parseExpiry(dekraExpiry);
      await submitApplication({
        facePhoto:          null,
        licensePhotoFront:  frontB64,
        licensePhotoBack:   backB64,
        dekraPhoto:         dekraB64,
        licenseExpiryMonth: licM,
        licenseExpiryYear:  licY,
        dekraExpiryMonth:   dkM,
        dekraExpiryYear:    dkY,
        isRenewal:          true,
      });
      Alert.alert(
        'Renovación enviada',
        'Tu solicitud de renovación fue enviada. El administrador la revisará y actualizará tus fechas de vencimiento.',
        [{ text: 'Entendido', onPress: () => router.back() }]
      );
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo enviar la renovación. Intentá de nuevo.');
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

          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={18} color="#ffffff" />
            <Text style={styles.backText}>Volver</Text>
          </Pressable>

          <View>
            <Text style={styles.title}>Actualizar documentos</Text>
            <Text style={styles.subtitle}>Renová tu licencia o revisión técnica Dekra</Text>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={Brand.colors.green.dark} />
            <Text style={styles.infoText}>
              Subí las nuevas fotos y las fechas de vencimiento actualizadas. El administrador verificará los documentos y aprobará la renovación.
            </Text>
          </View>

          {/* Licencia */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Licencia de conducir</Text>
              <View style={styles.photoRow}>
                <PhotoPickerBtn
                  photo={licenciaFront}
                  label="Lado frontal"
                  sublabel="Opcional si no cambió"
                  onPress={() => openPhotoOptions('licenciaFront')}
                />
                <PhotoPickerBtn
                  photo={licenciaBack}
                  label="Lado trasero"
                  sublabel="Opcional si no cambió"
                  onPress={() => openPhotoOptions('licenciaBack')}
                />
              </View>
              <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Nueva fecha de vencimiento (MM/AA)</Text>
              <ExpiryInput value={licenseExpiry} onChangeText={setLicenseExpiry} fieldStyle={styles.inputFlex} inputStyle={styles.input} />
            </GlassCard>
          </View>

          {/* Dekra */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Revisión técnica Dekra</Text>
              <PhotoPickerBtn
                photo={dekraPhoto}
                label="Foto de la revisión técnica"
                sublabel="Opcional si no cambió"
                onPress={() => openPhotoOptions('dekra')}
                style={styles.photoBtnFull}
              />
              <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Nueva fecha de vencimiento (MM/AA)</Text>
              <ExpiryInput value={dekraExpiry} onChangeText={setDekraExpiry} fieldStyle={styles.inputFlex} inputStyle={styles.input} />
            </GlassCard>
          </View>

          <Pressable style={styles.cta} onPress={handleSubmit}>
            <Text style={styles.ctaText}>Enviar renovación</Text>
          </Pressable>

        </ScrollView>
      </KeyboardAvoidingView>

      {cameraOpen && (
        <DocumentCameraModal
          visible
          documentType={cameraConfig[cameraOpen].type}
          label={cameraConfig[cameraOpen].label}
          onCapture={(uri) => setPhoto(cameraOpen, uri)}
          onClose={() => setCameraOpen(null)}
        />
      )}
    </ImageBackground>
  );
}
