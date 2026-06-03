// Driver registration screen — reached from the profile mode-toggle when the user has
// never registered as a driver. Collects vehicle details (make, model, year, plate, colour),
// driver's licence photos (front and back), and Dekra technical-inspection photo.
// On successful submission it sets isDriverRegistered = true, switches mode to 'driver',
// and redirects to the Offer tab.
// Photo capture uses DocumentCameraModal with a card-shaped guide overlay for the licence
// and a full-frame capture for the Dekra document.

import DocumentCameraModal from '@/components/document-camera-modal';
import ExpiryInput, { parseExpiry } from '@/components/expiry-input';
import GlassCard from '@/components/glass-card';
import PlaceSearchInput from '@/components/place-search-input';
import SelectModal from '@/components/select-modal';
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from '@/constants/vehicle-data';
import { Brand } from '@/constants/theme';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
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
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeStyles } from '../styles/app/driver-registration.styles';

type PhotoSlot = { uri: string } | null;

function PhotoPickerBtn({
  photo, label, sublabel, onPress, style, error,
}: {
  photo: PhotoSlot;
  label: string;
  sublabel?: string;
  onPress: () => void;
  style?: object;
  error?: boolean;
}) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      style={[style ?? styles.photoBtn, photo ? styles.photoBtnDone : error && { borderColor: Brand.colors.alerts.error, borderStyle: 'solid' }]}
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
  const { submitApplication, resubmitApplication, myApplication } = useApplications();
  const { showLoader, hideLoader } = useLoading();
  const { user } = useAuth();
  const isResubmit = myApplication?.status === 'needs_correction';

  // Personal info
  const [cedula, setCedula]   = useState(myApplication?.cedula ?? '');
  const [address, setAddress] = useState(myApplication?.address ?? '');

  // Vehicle form fields — make/model/year use dropdown pickers; plate enforces ABC123 format
  const [marca, setMarca] = useState(myApplication?.vehicle.brand ?? '');
  const [modelo, setModelo] = useState(myApplication?.vehicle.model ?? '');
  const [año, setAño] = useState(myApplication?.vehicle.year ?? '');
  const [placa, setPlaca] = useState(myApplication?.vehicle.plate ?? '');
  const [vehicleColor, setVehicleColor] = useState(myApplication?.vehicle.color ?? '');

  // Whether each field is in free-text "Otro" mode
  const [marcaCustom, setMarcaCustom] = useState(
    marca !== '' && !VEHICLE_MAKES.includes(marca as typeof VEHICLE_MAKES[number])
  );
  const [modeloCustom, setModeloCustom] = useState(false);

  // Which SelectModal is open: 'marca' | 'modelo' | 'año' | null
  const [openPicker, setOpenPicker] = useState<'marca' | 'modelo' | 'año' | null>(null);

  const modelOptions = useMemo(
    () => (!marcaCustom && marca && VEHICLE_MODELS[marca]) ? VEHICLE_MODELS[marca] : [],
    [marca, marcaCustom]
  );

  const handleMarcaSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') {
      setMarcaCustom(true);
      setMarca('');
      setModelo('');
      setModeloCustom(false);
    } else {
      setMarcaCustom(false);
      setMarca(value);
      setModelo('');
      setModeloCustom(false);
    }
  };

  const handleModeloSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') {
      setModeloCustom(true);
      setModelo('');
    } else {
      setModeloCustom(false);
      setModelo(value);
    }
  };

  const handleAñoSelect = (value: string) => {
    setOpenPicker(null);
    setAño(value);
  };

  // Accepts ABC123 (3 letters + 3 digits) or 123456 (6 digits). Format is inferred from first char.
  const handlePlacaChange = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleaned) { setPlaca(''); return; }
    if (/[0-9]/.test(cleaned[0])) {
      setPlaca(cleaned.replace(/[^0-9]/g, '').slice(0, 6));
    } else {
      let letters = '';
      let digits  = '';
      for (const ch of cleaned) {
        if (letters.length < 3 && /[A-Z]/.test(ch))                             { letters += ch; }
        else if (letters.length === 3 && digits.length < 3 && /[0-9]/.test(ch)) { digits  += ch; }
      }
      setPlaca(letters + digits);
    }
  };

  // Expiry dates stored as "MM/YY" string
  const initExpiry = (month?: number | null, year?: number | null) =>
    month && year ? `${String(month).padStart(2, '0')}/${String(year).slice(-2)}` : '';
  const [licenseExpiry, setLicenseExpiry] = useState(initExpiry(myApplication?.licenseExpiryMonth, myApplication?.licenseExpiryYear));
  const [dekraExpiry,   setDekraExpiry]   = useState(initExpiry(myApplication?.dekraExpiryMonth,   myApplication?.dekraExpiryYear));

  // Photo slots
  const [facePhoto, setFacePhotoState] = useState<PhotoSlot>(null);
  const [licenciaFront, setLicenciaFront] = useState<PhotoSlot>(null);
  const [licenciaBack, setLicenciaBack] = useState<PhotoSlot>(null);
  const [dekraPhoto, setDekraPhoto] = useState<PhotoSlot>(null);

  // Which camera slot is currently open; null means the modal is closed
  type CameraTarget = 'face' | 'licenciaFront' | 'licenciaBack' | 'dekra';
  const [cameraOpen, setCameraOpen] = useState<CameraTarget | null>(null);

  // Form submission state — used to show error highlights after the first submit attempt
  const [submitted, setSubmitted] = useState(false);

  const licenseExpiryParsed = useMemo(() => parseExpiry(licenseExpiry), [licenseExpiry]);
  const dekraExpiryParsed   = useMemo(() => parseExpiry(dekraExpiry),   [dekraExpiry]);

  const fieldErrors = useMemo(() => ({
    cedula:        !cedula.trim(),
    address:       !address.trim(),
    facePhoto:     !facePhoto,
    marca:         !marca.trim(),
    modelo:        !modelo.trim(),
    año:           !año,
    vehicleColor:  !vehicleColor.trim(),
    placa:         placa.length !== 6,
    licenciaFront: !licenciaFront,
    licenciaBack:  !licenciaBack,
    licenseExpiry: !licenseExpiryParsed.month || !licenseExpiryParsed.year,
    dekraPhoto:    !dekraPhoto,
    dekraExpiry:   !dekraExpiryParsed.month || !dekraExpiryParsed.year,
  }), [cedula, address, facePhoto, marca, modelo, año, vehicleColor, placa,
       licenciaFront, licenciaBack, licenseExpiryParsed, dekraPhoto, dekraExpiryParsed]);

  const err = (field: keyof typeof fieldErrors) => submitted && fieldErrors[field];

  const cameraConfig: Record<CameraTarget, { label: string; type: 'face' | 'license' | 'document' }> = {
    face:          { label: 'Foto de perfil',          type: 'face'     },
    licenciaFront: { label: 'Licencia — Lado frontal', type: 'license'  },
    licenciaBack:  { label: 'Licencia — Lado trasero', type: 'license'  },
    dekra:         { label: 'Revisión técnica Dekra',  type: 'document' },
  };

  const setPhoto = (target: CameraTarget, uri: string) => {
    if (target === 'face')               setFacePhotoState({ uri });
    else if (target === 'licenciaFront') setLicenciaFront({ uri });
    else if (target === 'licenciaBack')  setLicenciaBack({ uri });
    else                                 setDekraPhoto({ uri });
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

  const toBase64 = async (uri: string | null): Promise<string | null> => {
    if (!uri) return null;
    const ref    = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
    const result = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.78, base64: true });
    return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
  };

  const handleRegister = async () => {
    setSubmitted(true);

    const missing = ([
      [fieldErrors.cedula,        'Número de cédula'],
      [fieldErrors.address,       'Dirección de domicilio'],
      [fieldErrors.facePhoto,     'Foto de perfil'],
      [fieldErrors.marca,         'Marca del vehículo'],
      [fieldErrors.modelo,        'Modelo del vehículo'],
      [fieldErrors.año,           'Año del vehículo'],
      [fieldErrors.vehicleColor,  'Color del vehículo'],
      [fieldErrors.placa,         'Placa (formato ABC123 o 123456)'],
      [fieldErrors.licenciaFront, 'Foto frontal de licencia'],
      [fieldErrors.licenciaBack,  'Foto trasera de licencia'],
      [fieldErrors.licenseExpiry, 'Fecha de vencimiento de licencia'],
      [fieldErrors.dekraPhoto,    'Foto de revisión técnica Dekra'],
      [fieldErrors.dekraExpiry,   'Fecha de vencimiento Dekra'],
    ] as [boolean, string][]).filter(([has]) => has).map(([, label]) => `• ${label}`);

    if (missing.length > 0) {
      Alert.alert('Campos requeridos', `Completá los siguientes campos antes de enviar:\n\n${missing.join('\n')}`);
      return;
    }

    showLoader('Subiendo imágenes...');
    try {
      const [faceB64, frontB64, backB64, dekraB64] = await Promise.all([
        toBase64(facePhoto?.uri ?? null),
        toBase64(licenciaFront?.uri ?? null),
        toBase64(licenciaBack?.uri ?? null),
        toBase64(dekraPhoto?.uri ?? null),
      ]);

      showLoader('Enviando solicitud...');
      const payload = {
        cedula:             cedula.trim(),
        address:            address.trim(),
        vehicle:            { brand: marca, model: modelo, year: año, plate: placa, color: vehicleColor },
        facePhoto:          faceB64,
        licensePhotoFront:  frontB64,
        licensePhotoBack:   backB64,
        dekraPhoto:         dekraB64,
        licenseExpiryMonth: licenseExpiryParsed.month,
        licenseExpiryYear:  licenseExpiryParsed.year,
        dekraExpiryMonth:   dekraExpiryParsed.month,
        dekraExpiryYear:    dekraExpiryParsed.year,
      };
      if (isResubmit && myApplication) {
        await resubmitApplication(myApplication.id, payload);
      } else {
        await submitApplication(payload);
      }
      router.replace('/driver-status');
    } catch (err: any) {
      Alert.alert('Error', err?.message ?? 'No se pudo enviar la solicitud. Intentá de nuevo.');
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

          {/* Personal info — name read-only (pulled from profile), cedula and address required */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Información personal</Text>

              {/* Registered name shown as read-only reference for license verification */}
              <View style={[styles.inputWrap, { opacity: 0.65 }]}>
                <Ionicons name="person-outline" size={18} color={Brand.colors.green.normal} />
                <Text style={[styles.input, { color: 'rgba(255,255,255,0.7)' }]}>
                  {user ? `${user.firstName} ${user.lastName}` : '—'}
                </Text>
                <Ionicons name="lock-closed-outline" size={14} color="rgba(255,255,255,0.4)" />
              </View>
              <Text style={[styles.photoSublabel, { marginTop: -6, marginLeft: 2 }]}>
                Este nombre se verificará contra tu licencia
              </Text>

              <View style={[styles.inputWrap, err('cedula') && { borderColor: Brand.colors.alerts.error }]}>
                <Ionicons name="card-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={cedula}
                  onChangeText={setCedula}
                  placeholder="Número de cédula *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  keyboardType="numeric"
                  maxLength={15}
                />
              </View>

              <PlaceSearchInput
                value={address}
                onChangeText={setAddress}
                onSelect={(pred) => setAddress(pred.description)}
                leadingIcon={<Ionicons name="location-outline" size={18} color={Brand.colors.green.normal} />}
                fieldStyle={{ ...styles.inputWrap, ...(err('address') ? { borderColor: Brand.colors.alerts.error } : {}) }}
                placeholder="Dirección de domicilio *"
                placeholderTextColor={colors.textPlaceholder}
                style={styles.input}
              />
            </GlassCard>
          </View>

          {/* Foto de perfil — required for drivers, face must be clearly visible */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Foto de perfil <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
              <PhotoPickerBtn
                photo={facePhoto}
                label="Tu foto de perfil"
                sublabel="Debe mostrar tu rostro claramente"
                onPress={() => openPhotoOptions('face')}
                style={styles.photoBtnFull}
                error={err('facePhoto')}
              />
            </GlassCard>
          </View>

          {/* Vehículo */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Vehículo <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>

              {/* Marca */}
              {marcaCustom ? (
                <View style={[styles.inputWrap, err('marca') && { borderColor: Brand.colors.alerts.error }]}>
                  <Ionicons name="car-outline" size={18} color={Brand.colors.green.normal} />
                  <TextInput
                    value={marca}
                    onChangeText={setMarca}
                    placeholder="Marca del vehículo *"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                    autoFocus
                  />
                  <Pressable onPress={() => { setMarcaCustom(false); setMarca(''); setModelo(''); }} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={[styles.dropdownBtnFull, err('marca') && { borderColor: Brand.colors.alerts.error }]} onPress={() => setOpenPicker('marca')}>
                  <Ionicons name="car-outline" size={18} color={Brand.colors.green.normal} />
                  {marca ? (
                    <Text style={styles.dropdownText}>{marca}</Text>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Seleccionar marca *</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              )}

              {/* Modelo */}
              {modeloCustom ? (
                <View style={[styles.inputWrap, err('modelo') && { borderColor: Brand.colors.alerts.error }]}>
                  <TextInput
                    value={modelo}
                    onChangeText={setModelo}
                    placeholder="Modelo del vehículo *"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                    autoFocus
                  />
                  <Pressable onPress={() => { setModeloCustom(false); setModelo(''); }} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.dropdownBtnFull, (!marca) && { opacity: 0.5 }, err('modelo') && { borderColor: Brand.colors.alerts.error }]}
                  onPress={() => marca ? setOpenPicker('modelo') : undefined}
                  disabled={!marca}>
                  {modelo ? (
                    <Text style={styles.dropdownText}>{modelo}</Text>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>
                      {marca ? 'Seleccionar modelo *' : 'Selecciona primero la marca'}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              )}

              <View style={styles.row}>
                {/* Año */}
                <Pressable style={[styles.dropdownBtn, err('año') && { borderColor: Brand.colors.alerts.error }]} onPress={() => setOpenPicker('año')}>
                  {año ? (
                    <Text style={styles.dropdownText}>{año}</Text>
                  ) : (
                    <Text style={styles.dropdownPlaceholder}>Año *</Text>
                  )}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>

                {/* Color */}
                <View style={[styles.inputFlex, err('vehicleColor') && { borderColor: Brand.colors.alerts.error }]}>
                  <TextInput
                    value={vehicleColor}
                    onChangeText={setVehicleColor}
                    placeholder="Color *"
                    placeholderTextColor={colors.textPlaceholder}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Placa ABC123 */}
              <View style={[styles.inputWrap, err('placa') && { borderColor: Brand.colors.alerts.error }]}>
                <Ionicons name="document-text-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  value={placa}
                  onChangeText={handlePlacaChange}
                  placeholder="Placa (ej. ABC123 o 123456) *"
                  placeholderTextColor={colors.textPlaceholder}
                  style={styles.input}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <Text style={styles.plateHint}>Formatos válidos: ABC123 (letras + números) o 123456 (solo números)</Text>
            </GlassCard>
          </View>

          {/* Pickers modales */}
          <SelectModal
            visible={openPicker === 'marca'}
            title="Seleccionar marca"
            options={[...VEHICLE_MAKES]}
            onSelect={handleMarcaSelect}
            onClose={() => setOpenPicker(null)}
            allowCustom
          />
          <SelectModal
            visible={openPicker === 'modelo'}
            title="Seleccionar modelo"
            options={modelOptions}
            onSelect={handleModeloSelect}
            onClose={() => setOpenPicker(null)}
            allowCustom
          />
          <SelectModal
            visible={openPicker === 'año'}
            title="Seleccionar año"
            options={VEHICLE_YEARS}
            onSelect={handleAñoSelect}
            onClose={() => setOpenPicker(null)}
          />

          {/* Licencia */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Licencia de conducir <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>

              <View style={styles.photoRow}>
                <PhotoPickerBtn
                  photo={licenciaFront}
                  label="Lado frontal *"
                  sublabel="Toca para adjuntar"
                  onPress={() => openPhotoOptions('licenciaFront')}
                  error={err('licenciaFront')}
                />
                <PhotoPickerBtn
                  photo={licenciaBack}
                  label="Lado trasero *"
                  sublabel="Toca para adjuntar"
                  onPress={() => openPhotoOptions('licenciaBack')}
                  error={err('licenciaBack')}
                />
              </View>

              <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Fecha de vencimiento (MM/AA) <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
              <ExpiryInput
                value={licenseExpiry}
                onChangeText={setLicenseExpiry}
                fieldStyle={{ ...styles.inputWrap, ...(err('licenseExpiry') ? { borderColor: Brand.colors.alerts.error } : {}) }}
                inputStyle={styles.input}
              />
            </GlassCard>
          </View>

          {/* Revisión técnica Dekra */}
          <View style={styles.cardWrap}>
            <GlassCard style={styles.card} intensity={48}>
              <Text style={styles.sectionLabel}>Revisión técnica Dekra <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>

              <PhotoPickerBtn
                photo={dekraPhoto}
                label="Foto de la revisión técnica *"
                sublabel="Toca para adjuntar"
                onPress={() => openPhotoOptions('dekra')}
                style={styles.photoBtnFull}
                error={err('dekraPhoto')}
              />

              <Text style={[styles.photoSublabel, { marginBottom: 4 }]}>Fecha de vencimiento (MM/AA) <Text style={{ color: Brand.colors.alerts.error }}>*</Text></Text>
              <ExpiryInput
                value={dekraExpiry}
                onChangeText={setDekraExpiry}
                fieldStyle={{ ...styles.inputWrap, ...(err('dekraExpiry') ? { borderColor: Brand.colors.alerts.error } : {}) }}
                inputStyle={styles.input}
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
