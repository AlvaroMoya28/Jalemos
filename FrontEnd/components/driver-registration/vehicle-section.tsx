// Vehicle card: make/model/year pickers (with free-text "Otro" mode), colour
// and plate, plus the make/model/year SelectModals.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import SelectModal from '@/components/shared/select-modal';
import { Brand } from '@/constants/theme';
import { VEHICLE_MAKES, VEHICLE_YEARS } from '@/constants/vehicle-data';
import { useAppTheme } from '@/hooks/use-app-theme';
import { useDriverRegistrationForm } from '@/hooks/use-driver-registration-form';
import { makeStyles } from '@/styles/app/driver-registration.styles';

export default function VehicleSection({ form, styles, colors }: {
  form: ReturnType<typeof useDriverRegistrationForm>;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const {
    marca, setMarca, modelo, setModelo, año, vehicleColor, setVehicleColor, placa,
    marcaCustom, setMarcaCustom, modeloCustom, setModeloCustom,
    openPicker, setOpenPicker, modelOptions,
    handleMarcaSelect, handleModeloSelect, handleAñoSelect, handlePlacaChange, err,
  } = form;

  return (
    <>
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
              {marca ? <Text style={styles.dropdownText}>{marca}</Text> : <Text style={styles.dropdownPlaceholder}>Seleccionar marca *</Text>}
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
              disabled={!marca}
            >
              {modelo ? (
                <Text style={styles.dropdownText}>{modelo}</Text>
              ) : (
                <Text style={styles.dropdownPlaceholder}>{marca ? 'Seleccionar modelo *' : 'Selecciona primero la marca'}</Text>
              )}
              <Ionicons name="chevron-down" size={16} color={colors.textMuted} />
            </Pressable>
          )}

          <View style={styles.row}>
            {/* Año */}
            <Pressable style={[styles.dropdownBtn, err('año') && { borderColor: Brand.colors.alerts.error }]} onPress={() => setOpenPicker('año')}>
              {año ? <Text style={styles.dropdownText}>{año}</Text> : <Text style={styles.dropdownPlaceholder}>Año *</Text>}
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

          {/* Placa */}
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

      {/* Pickers */}
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
    </>
  );
}
