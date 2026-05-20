// Driver registration screen — reached from the profile mode-toggle when the user has
// never registered as a driver. Collects vehicle details (make, model, year, plate, colour),
// driver's licence photos (front and back), and Dekra technical-inspection photo.
// On successful submission it sets isDriverRegistered = true, switches mode to 'driver',
// and redirects to the Offer tab.
// Photo capture uses DocumentCameraModal with a card-shaped guide overlay for the licence
// and a full-frame capture for the Dekra document.

import DocumentCameraModal from '@/components/document-camera-modal';
import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';
import { useUserMode } from '@/contexts/user-mode';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
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
  TextInput,
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
    backBtn: {
      flexDirection: 'row', alignItems: 'center',
      gap: 6, alignSelf: 'flex-start', marginBottom: 4,
    },
    backText: { color: '#ffffff', fontFamily: Fonts.heading, fontSize: 14 },
    header: { marginBottom: 4 },
    title: { color: '#ffffff', fontFamily: Fonts.headingHeavy, fontSize: 28 },
    subtitle: { color: 'rgba(255,255,255,0.75)', fontFamily: Fonts.sans, fontSize: 13, marginTop: 4 },
    cardWrap: { ...withElevation(400) },
    card: { borderRadius: Brand.radius[24], padding: Brand.spacing[16], gap: 10 },
    sectionLabel: {
      fontSize: 11, color: c.textMuted, fontFamily: Fonts.heading,
      textTransform: 'uppercase', marginBottom: 2, marginTop: 4,
    },
    row: { flexDirection: 'row', gap: 10 },
    inputWrap: {
      flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    inputFlex: {
      flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10,
      borderRadius: Brand.radius[12], borderWidth: 1,
      borderColor: c.border, backgroundColor: c.inputBg,
      paddingHorizontal: 12, paddingVertical: 12,
    },
    input: { flex: 1, fontSize: 14, color: c.inputText, fontFamily: Fonts.sans },
    // Photo picker
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
      backgroundColor: 'rgba(0,0,0,0.4)', paddingVertical: 4,
      alignItems: 'center',
    },
    // Info box
    infoBox: {
      flexDirection: 'row', gap: 10,
      backgroundColor: Brand.colors.green.light + '33',
      borderRadius: Brand.radius[12], padding: 12,
      borderWidth: 1, borderColor: Brand.colors.green.light,
    },
    infoText: { flex: 1, color: c.textPrimary, fontFamily: Fonts.sans, fontSize: 12, lineHeight: 18 },
    cta: {
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 999, paddingVertical: 14, alignItems: 'center',
      ...withElevation(400),
    },
    ctaText: { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.headingBold },
  });
}

type PhotoSlot = { uri: string } | null;

function PhotoPickerBtn({
  photo, label, sublabel, onPress, style,
}: {
  photo: PhotoSlot;
  label: string;
  sublabel?: string;
  onPress: () => void;
  style?: object;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[style ?? styles.photoBtn, photo && styles.photoBtnDone]}
      onPress={onPress}>
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
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsEditing: false,
  });
  if (result.canceled) return null;
  return { uri: result.assets[0].uri };
}

export default function DriverRegistrationScreen() {
  const { isDark, colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { setMode, setDriverRegistered } = useUserMode();

  const [marca, setMarca] = useState('');
  const [modelo, setModelo] = useState('');
  const [año, setAño] = useState('');
  const [placa, setPlaca] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');

  const [licenciaFront, setLicenciaFront] = useState<PhotoSlot>(null);
  const [licenciaBack, setLicenciaBack] = useState<PhotoSlot>(null);
  const [dekraPhoto, setDekraPhoto] = useState<PhotoSlot>(null);

  type CameraTarget = 'licenciaFront' | 'licenciaBack' | 'dekra';
  const [cameraOpen, setCameraOpen] = useState<CameraTarget | null>(null);

  const cameraConfig: Record<CameraTarget, { label: string; type: 'license' | 'document' }> = {
    licenciaFront: { label: 'Licencia — Lado frontal', type: 'license' },
    licenciaBack: { label: 'Licencia — Lado trasero', type: 'license' },
    dekra: { label: 'Revisión técnica Dekra', type: 'document' },
  };

  const setPhoto = (target: CameraTarget, uri: string) => {
    if (target === 'licenciaFront') setLicenciaFront({ uri });
    else if (target === 'licenciaBack') setLicenciaBack({ uri });
    else setDekraPhoto({ uri });
  };

  const openPhotoOptions = (target: CameraTarget) => {
    const openCamera = () => setCameraOpen(target);
    const openGallery = async () => {
      const photo = await pickFromGallery();
      if (photo) setPhoto(target, photo.uri);
    };

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (index) => {
          if (index === 1) openCamera();
          if (index === 2) openGallery();
        }
      );
    } else {
      Alert.alert('Adjuntar foto', '', [
        { text: 'Tomar foto', onPress: openCamera },
        { text: 'Elegir de galería', onPress: openGallery },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const handleRegister = () => {
    // TODO: validate fields + upload photos, then call POST /api/drivers/register
    setDriverRegistered(true);
    setMode('driver');
    router.replace('/(tabs)/offer');
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

          {/* Vehículo */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Vehículo</Text>

              <View style={styles.row}>
                <View style={styles.inputFlex}>
                  <Ionicons name="car-outline" size={18} color={Brand.colors.green.normal} />
                  <TextInput value={marca} onChangeText={setMarca} placeholder="Marca" placeholderTextColor={colors.textPlaceholder} style={styles.input} />
                </View>
                <View style={styles.inputFlex}>
                  <TextInput value={modelo} onChangeText={setModelo} placeholder="Modelo" placeholderTextColor={colors.textPlaceholder} style={styles.input} />
                </View>
              </View>

              <View style={styles.row}>
                <View style={styles.inputFlex}>
                  <TextInput value={año} onChangeText={setAño} placeholder="Año" placeholderTextColor={colors.textPlaceholder} style={styles.input} keyboardType="numeric" maxLength={4} />
                </View>
                <View style={styles.inputFlex}>
                  <TextInput value={vehicleColor} onChangeText={setVehicleColor} placeholder="Color" placeholderTextColor={colors.textPlaceholder} style={styles.input} />
                </View>
              </View>

              <View style={styles.inputWrap}>
                <Ionicons name="document-text-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput value={placa} onChangeText={setPlaca} placeholder="Placa (ej. CR-1234)" placeholderTextColor={colors.textPlaceholder} style={styles.input} autoCapitalize="characters" />
              </View>
            </GlassCard>
          </View>

          {/* Licencia */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Licencia de conducir</Text>

              <View style={styles.photoRow}>
                <PhotoPickerBtn
                  photo={licenciaFront}
                  label="Lado frontal"
                  sublabel="Toca para adjuntar"
                  onPress={() => openPhotoOptions('licenciaFront')}
                />
                <PhotoPickerBtn
                  photo={licenciaBack}
                  label="Lado trasero"
                  sublabel="Toca para adjuntar"
                  onPress={() => openPhotoOptions('licenciaBack')}
                />
              </View>
            </GlassCard>
          </View>

          {/* Revisión técnica Dekra */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Revisión técnica Dekra</Text>

              <PhotoPickerBtn
                photo={dekraPhoto}
                label="Foto de la revisión técnica"
                sublabel="Toca para adjuntar"
                onPress={() => openPhotoOptions('dekra')}
                style={styles.photoBtnFull}
              />
            </GlassCard>
          </View>

          <Pressable style={styles.cta} onPress={handleRegister}>
            <Text style={styles.ctaText}>Registrarme como conductor</Text>
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
