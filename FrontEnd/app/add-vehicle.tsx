// Formulario para que un conductor registrado solicite agregar un vehículo adicional.
// El admin recibe la solicitud igual que una de conductor, pero con badge "Nuevo vehículo".
// Al aprobarse se crea el vehículo directo en la tabla vehicles sin cambiar el rol del usuario.
// Updated by Claude Sonnet 4.6: make/model/year dropdowns, ABC123 plate format enforcement.

import GlassCard from '@/components/glass-card';
import SelectModal from '@/components/select-modal';
import { VEHICLE_MAKES, VEHICLE_MODELS, VEHICLE_YEARS } from '@/constants/vehicle-data';
import { Brand } from '@/constants/theme';
import { useApplications } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { makeStyles } from '../styles/app/add-vehicle.styles';

export default function AddVehicleScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { submitVehicleApplication } = useApplications();

  const [brand,   setBrand]   = useState('');
  const [model,   setModel]   = useState('');
  const [year,    setYear]    = useState('');
  const [color,   setColor]   = useState('');
  const [plate,   setPlate]   = useState('');
  const [loading, setLoading] = useState(false);
  const [done,    setDone]    = useState(false);

  const [brandCustom, setBrandCustom] = useState(false);
  const [modelCustom, setModelCustom] = useState(false);
  const [openPicker, setOpenPicker] = useState<'brand' | 'model' | 'year' | null>(null);

  const modelOptions = useMemo(
    () => (!brandCustom && brand && VEHICLE_MODELS[brand]) ? VEHICLE_MODELS[brand] : [],
    [brand, brandCustom]
  );

  const handleBrandSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') {
      setBrandCustom(true);
      setBrand('');
      setModel('');
      setModelCustom(false);
    } else {
      setBrandCustom(false);
      setBrand(value);
      setModel('');
      setModelCustom(false);
    }
  };

  const handleModelSelect = (value: string) => {
    setOpenPicker(null);
    if (value === '__custom__') {
      setModelCustom(true);
      setModel('');
    } else {
      setModelCustom(false);
      setModel(value);
    }
  };

  // Accepts ABC123 (3 letters + 3 digits) or 123456 (6 digits). Format is inferred from first char.
  const handlePlateChange = (text: string) => {
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleaned) { setPlate(''); return; }
    if (/[0-9]/.test(cleaned[0])) {
      setPlate(cleaned.replace(/[^0-9]/g, '').slice(0, 6));
    } else {
      let letters = '';
      let digits  = '';
      for (const ch of cleaned) {
        if (letters.length < 3 && /[A-Z]/.test(ch))                             { letters += ch; }
        else if (letters.length === 3 && digits.length < 3 && /[0-9]/.test(ch)) { digits  += ch; }
      }
      setPlate(letters + digits);
    }
  };

  const handleSubmit = async () => {
    const trimmedBrand = brand.trim();
    const trimmedModel = model.trim();
    const trimmedColor = color.trim();
    const trimmedPlate = plate.trim().toUpperCase();

    if (!trimmedBrand) { Alert.alert('Campos requeridos', 'Seleccioná la marca del vehículo.'); return; }
    if (!trimmedModel) { Alert.alert('Campos requeridos', 'Seleccioná el modelo del vehículo.'); return; }
    if (!year)         { Alert.alert('Campos requeridos', 'Seleccioná el año del vehículo.');   return; }
    if (!trimmedColor) { Alert.alert('Campos requeridos', 'Ingresá el color del vehículo.');    return; }
    if (!/^([A-Z]{3}[0-9]{3}|[0-9]{6})$/.test(trimmedPlate)) {
      Alert.alert('Placa inválida', 'Usá el formato ABC123 (3 letras + 3 números) o 123456 (6 números).');
      return;
    }

    setLoading(true);
    try {
      await submitVehicleApplication({
        vehicleBrand: trimmedBrand,
        vehicleModel: trimmedModel,
        vehicleYear:  parseInt(year, 10),
        vehicleColor: trimmedColor,
        vehiclePlate: trimmedPlate,
      });
      setDone(true);
    } catch (e: any) {
      Alert.alert('Error', e?.message ?? 'No se pudo enviar la solicitud.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bottomSurface }]}>
        <View style={styles.successWrap}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={38} color={Brand.colors.green.normal} />
          </View>
          <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
          <Text style={styles.successSub}>
            El administrador revisará tu vehículo. Cuando sea aprobado aparecerá en tu perfil de conductor.
          </Text>
          <Pressable style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backBtnText}>Volver al perfil</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerMini}>Modo conductor</Text>
        <Text style={styles.headerTitle}>Agregar vehículo</Text>
      </View>

      <View style={styles.surface}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <View style={styles.infoBox}>
              <Ionicons name="information-circle-outline" size={18} color={Brand.colors.green.normal} />
              <Text style={styles.infoText}>
                La solicitud será revisada por el administrador. Una vez aprobada, el vehículo quedará disponible para ofrecer viajes.
              </Text>
            </View>

            <GlassCard style={styles.card}>
              <Text style={styles.sectionLabel}>Datos del vehículo</Text>

              {/* Marca */}
              {brandCustom ? (
                <View style={styles.inputRow}>
                  <Ionicons name="car-outline" size={18} color={Brand.colors.green.normal} />
                  <TextInput
                    style={styles.input}
                    placeholder="Marca del vehículo"
                    placeholderTextColor={colors.textPlaceholder}
                    value={brand}
                    onChangeText={setBrand}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <Pressable onPress={() => { setBrandCustom(false); setBrand(''); setModel(''); }} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Pressable style={styles.dropdownBtn} onPress={() => setOpenPicker('brand')}>
                  <Ionicons name="car-outline" size={18} color={Brand.colors.green.normal} />
                  {brand
                    ? <Text style={styles.dropdownText}>{brand}</Text>
                    : <Text style={styles.dropdownPlaceholder}>Seleccionar marca</Text>}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              )}

              {/* Modelo */}
              {modelCustom ? (
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    placeholder="Modelo del vehículo"
                    placeholderTextColor={colors.textPlaceholder}
                    value={model}
                    onChangeText={setModel}
                    autoCapitalize="words"
                    autoFocus
                  />
                  <Pressable onPress={() => { setModelCustom(false); setModel(''); }} hitSlop={10}>
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  style={[styles.dropdownBtn, !brand && { opacity: 0.5 }]}
                  onPress={() => brand ? setOpenPicker('model') : undefined}
                  disabled={!brand}>
                  {model
                    ? <Text style={styles.dropdownText}>{model}</Text>
                    : <Text style={styles.dropdownPlaceholder}>
                        {brand ? 'Seleccionar modelo' : 'Selecciona primero la marca'}
                      </Text>}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>
              )}

              <View style={styles.row2}>
                {/* Año */}
                <Pressable style={[styles.dropdownBtn, { flex: 1 }]} onPress={() => setOpenPicker('year')}>
                  {year
                    ? <Text style={styles.dropdownText}>{year}</Text>
                    : <Text style={styles.dropdownPlaceholder}>Año</Text>}
                  <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
                </Pressable>

                {/* Color */}
                <View style={[styles.inputRow, { flex: 1 }]}>
                  <TextInput
                    style={styles.input}
                    placeholder="Color"
                    placeholderTextColor={colors.textPlaceholder}
                    value={color}
                    onChangeText={setColor}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {/* Placa ABC123 */}
              <View style={styles.inputRow}>
                <Ionicons name="card-outline" size={18} color={Brand.colors.green.normal} />
                <TextInput
                  style={styles.input}
                  placeholder="Placa (ej. ABC123 o 123456)"
                  placeholderTextColor={colors.textPlaceholder}
                  value={plate}
                  onChangeText={handlePlateChange}
                  autoCapitalize="characters"
                  maxLength={6}
                />
              </View>
              <Text style={styles.plateHint}>Formatos válidos: ABC123 (letras + números) o 123456 (solo números)</Text>
            </GlassCard>

            <Pressable style={[styles.cta, loading && { opacity: 0.6 }]} onPress={handleSubmit} disabled={loading}>
              {loading
                ? <ActivityIndicator color={Brand.colors.black.b1} />
                : <>
                    <Ionicons name="send-outline" size={16} color={Brand.colors.black.b1} />
                    <Text style={styles.ctaText}>Enviar solicitud</Text>
                  </>
              }
            </Pressable>

          </ScrollView>
        </KeyboardAvoidingView>
      </View>

      {/* Pickers modales */}
      <SelectModal
        visible={openPicker === 'brand'}
        title="Seleccionar marca"
        options={[...VEHICLE_MAKES]}
        onSelect={handleBrandSelect}
        onClose={() => setOpenPicker(null)}
        allowCustom
      />
      <SelectModal
        visible={openPicker === 'model'}
        title="Seleccionar modelo"
        options={modelOptions}
        onSelect={handleModelSelect}
        onClose={() => setOpenPicker(null)}
        allowCustom
      />
      <SelectModal
        visible={openPicker === 'year'}
        title="Seleccionar año"
        options={VEHICLE_YEARS}
        onSelect={(v) => { setYear(v); setOpenPicker(null); }}
        onClose={() => setOpenPicker(null)}
      />
    </View>
  );
}
