// State, handlers and submission for the driver registration form. Field
// validation/normalization lives in driver-reg-validation (pure + testable);
// this hook wires it to React state and the applications API.

import { parseExpiry } from '@/components/shared/expiry-input';
import {
  PhotoSlot,
  collectMissing,
  computeFieldErrors,
  initExpiry,
  isCustomMake,
  normalizePlate,
} from '@/components/driver-registration/driver-reg-validation';
import { VEHICLE_MODELS } from '@/constants/vehicle-data';
import { useApplications } from '@/contexts/applications';
import { useAuth } from '@/contexts/auth';
import { useLoading } from '@/contexts/loading';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { ActionSheetIOS, Alert, Platform } from 'react-native';

export type CameraTarget = 'face' | 'licenciaFront' | 'licenciaBack' | 'dekra';

export const CAMERA_CONFIG: Record<CameraTarget, { label: string; type: 'face' | 'license' | 'document' }> = {
  face:          { label: 'Foto de perfil',          type: 'face'     },
  licenciaFront: { label: 'Licencia — Lado frontal', type: 'license'  },
  licenciaBack:  { label: 'Licencia — Lado trasero', type: 'license'  },
  dekra:         { label: 'Revisión técnica Dekra',  type: 'document' },
};

async function pickFromGallery(): Promise<PhotoSlot> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') return null;
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.85, allowsEditing: false });
  if (result.canceled) return null;
  return { uri: result.assets[0].uri };
}

async function toBase64(uri: string | null): Promise<string | null> {
  if (!uri) return null;
  const ref    = await ImageManipulator.manipulate(uri).resize({ width: 1024 }).renderAsync();
  const result = await ref.saveAsync({ format: SaveFormat.JPEG, compress: 0.78, base64: true });
  return result.base64 ? `data:image/jpeg;base64,${result.base64}` : null;
}

export function useDriverRegistrationForm() {
  const { submitApplication, resubmitApplication, myApplication } = useApplications();
  const { showLoader, hideLoader } = useLoading();
  const { user } = useAuth();
  const isResubmit = myApplication?.status === 'needs_correction';

  // Personal info
  const [cedula, setCedula]   = useState(myApplication?.cedula ?? '');
  const [address, setAddress] = useState(myApplication?.address ?? '');

  // Vehicle fields
  const [marca, setMarca]               = useState(myApplication?.vehicle.brand ?? '');
  const [modelo, setModelo]             = useState(myApplication?.vehicle.model ?? '');
  const [año, setAño]                   = useState(myApplication?.vehicle.year ?? '');
  const [placa, setPlaca]               = useState(myApplication?.vehicle.plate ?? '');
  const [vehicleColor, setVehicleColor] = useState(myApplication?.vehicle.color ?? '');
  const [marcaCustom, setMarcaCustom]   = useState(isCustomMake(marca));
  const [modeloCustom, setModeloCustom] = useState(false);
  const [openPicker, setOpenPicker]     = useState<'marca' | 'modelo' | 'año' | null>(null);

  const modelOptions = useMemo(
    () => (!marcaCustom && marca && VEHICLE_MODELS[marca]) ? VEHICLE_MODELS[marca] : [],
    [marca, marcaCustom],
  );

  const handleMarcaSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') { setMarcaCustom(true); setMarca(''); setModelo(''); setModeloCustom(false); }
    else { setMarcaCustom(false); setMarca(value); setModelo(''); setModeloCustom(false); }
  };
  const handleModeloSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') { setModeloCustom(true); setModelo(''); }
    else { setModeloCustom(false); setModelo(value); }
  };
  const handleAñoSelect = (value: string) => { setOpenPicker(null); setAño(value); };
  const handlePlacaChange = (text: string) => setPlaca(normalizePlate(text));

  // Expiry dates ("MM/YY")
  const [licenseExpiry, setLicenseExpiry] = useState(initExpiry(myApplication?.licenseExpiryMonth, myApplication?.licenseExpiryYear));
  const [dekraExpiry,   setDekraExpiry]   = useState(initExpiry(myApplication?.dekraExpiryMonth,   myApplication?.dekraExpiryYear));
  const licenseExpiryParsed = useMemo(() => parseExpiry(licenseExpiry), [licenseExpiry]);
  const dekraExpiryParsed   = useMemo(() => parseExpiry(dekraExpiry),   [dekraExpiry]);

  // Photos
  const [facePhoto, setFacePhoto]         = useState<PhotoSlot>(null);
  const [licenciaFront, setLicenciaFront] = useState<PhotoSlot>(null);
  const [licenciaBack, setLicenciaBack]   = useState<PhotoSlot>(null);
  const [dekraPhoto, setDekraPhoto]       = useState<PhotoSlot>(null);
  const [cameraOpen, setCameraOpen]       = useState<CameraTarget | null>(null);
  const [submitted, setSubmitted]         = useState(false);

  const setPhoto = (target: CameraTarget, uri: string) => {
    if (target === 'face')               setFacePhoto({ uri });
    else if (target === 'licenciaFront') setLicenciaFront({ uri });
    else if (target === 'licenciaBack')  setLicenciaBack({ uri });
    else                                 setDekraPhoto({ uri });
  };

  const openPhotoOptions = (target: CameraTarget) => {
    const openCamera = () => setCameraOpen(target);
    const openGallery = async () => { const photo = await pickFromGallery(); if (photo) setPhoto(target, photo.uri); };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancelar', 'Tomar foto', 'Elegir de galería'], cancelButtonIndex: 0 },
        (index) => { if (index === 1) openCamera(); if (index === 2) openGallery(); },
      );
    } else {
      Alert.alert('Adjuntar foto', '', [
        { text: 'Tomar foto', onPress: openCamera },
        { text: 'Elegir de galería', onPress: openGallery },
        { text: 'Cancelar', style: 'cancel' },
      ]);
    }
  };

  const fieldErrors = useMemo(() => computeFieldErrors({
    cedula, address, facePhoto, marca, modelo, año, vehicleColor, placa,
    licenciaFront, licenciaBack, licenseExpiry: licenseExpiryParsed, dekraPhoto, dekraExpiry: dekraExpiryParsed,
  }), [cedula, address, facePhoto, marca, modelo, año, vehicleColor, placa,
       licenciaFront, licenciaBack, licenseExpiryParsed, dekraPhoto, dekraExpiryParsed]);

  const err = (field: keyof typeof fieldErrors) => submitted && fieldErrors[field];

  const handleRegister = async () => {
    setSubmitted(true);
    const missing = collectMissing(fieldErrors);
    if (missing.length > 0) {
      Alert.alert('Campos requeridos', `Completá los siguientes campos antes de enviar:\n\n${missing.map((m) => `• ${m}`).join('\n')}`);
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
      if (isResubmit && myApplication) await resubmitApplication(myApplication.id, payload);
      else await submitApplication(payload);
      router.replace('/driver-status');
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo enviar la solicitud. Intentá de nuevo.');
    } finally {
      hideLoader();
    }
  };

  return {
    user,
    cedula, setCedula, address, setAddress,
    marca, setMarca, modelo, setModelo, año, vehicleColor, setVehicleColor, placa,
    marcaCustom, setMarcaCustom, modeloCustom, setModeloCustom,
    openPicker, setOpenPicker, modelOptions,
    handleMarcaSelect, handleModeloSelect, handleAñoSelect, handlePlacaChange,
    licenseExpiry, setLicenseExpiry, dekraExpiry, setDekraExpiry,
    facePhoto, licenciaFront, licenciaBack, dekraPhoto,
    cameraOpen, setCameraOpen, setPhoto, openPhotoOptions,
    err, handleRegister,
  };
}
