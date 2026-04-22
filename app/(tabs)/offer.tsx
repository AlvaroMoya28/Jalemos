import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import GlassCard from '@/components/glass-card';
import { Brand, Fonts, withElevation } from '@/constants/theme';

export default function OfferScreen() {
  const vehicles = [
    { id: 'veh-1', name: 'Toyota Yaris', plate: 'CR-1234', color: 'Gris', primary: true },
    { id: 'veh-2', name: 'Nissan Kicks', plate: 'CR-7788', color: 'Blanco', primary: false },
  ];
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [seats, setSeats] = useState(2);
  const [price, setPrice] = useState(1500);
  const [vehicleId, setVehicleId] = useState(vehicles[0].id);
  const [notes, setNotes] = useState('');
  const [isRecurring, setIsRecurring] = useState(true);
  const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === vehicleId) ?? vehicles[0];

  const estimated = useMemo(() => seats * price, [price, seats]);
  const remaining = Math.max(0, 100 - notes.length);

  const publish = () => {
    if (!from || !to || !date || !time) {
      Alert.alert('Campos incompletos', 'Completa origen, destino, fecha y hora.');
      return;
    }

    Alert.alert('Listo', `Tu viaje se publico correctamente con ${selectedVehicle.name}.`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Ofrece tu viaje</Text>
        <Text style={styles.headerSub}>Comparte ruta y ahorra juntos</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <GlassCard style={styles.card} intensity={42}>
          <View style={styles.stepperWrap}>
            {[0, 1, 2].map((_, idx) => (
              <View key={idx} style={[styles.stepperDot, idx === 1 && styles.stepperDotActive]} />
            ))}
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="radio-button-on" size={15} color={Brand.colors.green.normal} />
            <TextInput
              value={from}
              onChangeText={setFrom}
              placeholder="Origen"
              placeholderTextColor="#778783"
              style={styles.input}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="location-outline" size={16} color={Brand.colors.green.normal} />
            <TextInput
              value={to}
              onChangeText={setTo}
              placeholder="Destino"
              placeholderTextColor="#778783"
              style={styles.input}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputWrap, styles.flex1]}>
              <Ionicons name="calendar-outline" size={16} color={Brand.colors.green.normal} />
              <TextInput
                value={date}
                onChangeText={setDate}
                placeholder="Fecha (YYYY-MM-DD)"
                placeholderTextColor="#778783"
                style={styles.input}
              />
            </View>
            <View style={[styles.inputWrap, styles.flex1]}>
              <Ionicons name="time-outline" size={16} color={Brand.colors.green.normal} />
              <TextInput
                value={time}
                onChangeText={setTime}
                placeholder="Hora (HH:MM)"
                placeholderTextColor="#778783"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.counterBox, styles.flex1]}>
              <View style={styles.counterHead}>
                <Ionicons name="people-outline" size={14} color={Brand.colors.green.normal} />
                <Text style={styles.counterLabel}>Asientos</Text>
              </View>
              <View style={styles.counterRow}>
                <Pressable style={styles.counterBtn} onPress={() => setSeats((prev) => Math.max(1, prev - 1))}>
                  <Text style={styles.counterBtnText}>-</Text>
                </Pressable>
                <Text style={styles.counterValue}>{seats}</Text>
                <Pressable style={styles.counterBtn} onPress={() => setSeats((prev) => Math.min(6, prev + 1))}>
                  <Text style={styles.counterBtnText}>+</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.counterBox, styles.flex1]}>
              <View style={styles.counterHead}>
                <Ionicons name="cash-outline" size={14} color={Brand.colors.green.normal} />
                <Text style={styles.counterLabel}>Precio (CRC)</Text>
              </View>
              <TextInput
                value={String(price)}
                onChangeText={(txt) => setPrice(Number(txt.replace(/[^0-9]/g, '')) || 0)}
                keyboardType="numeric"
                style={styles.priceInput}
              />
            </View>
          </View>

          <View style={styles.vehicleSection}>
            <Text style={styles.sectionLabel}>Vehiculo</Text>
            <Pressable style={styles.vehiclePicker} onPress={() => setVehicleModalOpen(true)}>
              <View>
                <Text style={styles.vehicleName}>{selectedVehicle.name}</Text>
                <Text style={styles.vehicleMeta}>{selectedVehicle.plate} · {selectedVehicle.color}</Text>
              </View>
              <Ionicons name="chevron-down" size={18} color={Brand.colors.green.dark} />
            </Pressable>
            <Text style={styles.helperText}>Se usara el vehiculo seleccionado para publicar el viaje.</Text>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Viaje recurrente</Text>
            <Pressable
              style={[styles.toggle, isRecurring ? styles.toggleActive : styles.toggleInactive]}
              onPress={() => setIsRecurring((v) => !v)}
            >
              <View style={[styles.toggleKnob, !isRecurring && styles.toggleKnobInactive]} />
            </Pressable>
          </View>

          <View style={[styles.inputWrap, styles.textAreaWrap]}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={16}
              color={Brand.colors.green.normal}
              style={styles.textAreaIcon}
            />
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder="Notas para los pasajeros (opcional)"
              placeholderTextColor="#778783"
              style={styles.textArea}
              multiline
              numberOfLines={4}
              maxLength={100}
              textAlignVertical="top"
            />
          </View>
          <Text style={styles.counterText}>Maximo 100 caracteres - {remaining} restantes</Text>
        </GlassCard>

        <GlassCard style={styles.summary} intensity={34}>
          <View>
            <Text style={styles.summaryLabel}>Ganancia estimada</Text>
            <Text style={styles.summaryValue}>₡{estimated.toLocaleString()}</Text>
          </View>
          <View>
            <Text style={styles.summaryMath}>
              {seats} x ₡{price.toLocaleString()}
            </Text>
            <Text style={styles.summaryVehicle}>{selectedVehicle.name}</Text>
          </View>
        </GlassCard>

        <Pressable style={styles.cta} onPress={publish}>
          <Text style={styles.ctaText}>Publicar viaje</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={vehicleModalOpen} transparent animationType="fade" onRequestClose={() => setVehicleModalOpen(false)}>
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setVehicleModalOpen(false)} />
          <GlassCard style={styles.modalCard} intensity={40}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Elegir vehiculo</Text>
              <Pressable onPress={() => setVehicleModalOpen(false)}>
                <Ionicons name="close" size={20} color={Brand.colors.black.b10} />
              </Pressable>
            </View>

            <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
              {vehicles.map((vehicle) => {
                const active = vehicle.id === vehicleId;

                return (
                  <Pressable
                    key={vehicle.id}
                    style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                    onPress={() => {
                      setVehicleId(vehicle.id);
                      setVehicleModalOpen(false);
                    }}
                  >
                    <View style={styles.vehicleTopRow}>
                      <View>
                        <Text style={styles.vehicleName}>{vehicle.name}</Text>
                        <Text style={styles.vehicleMeta}>{vehicle.plate} · {vehicle.color}</Text>
                      </View>
                      {active ? <Ionicons name="checkmark-circle" size={18} color={Brand.colors.green.normal} /> : null}
                    </View>
                    <Text style={styles.vehicleTag}>{vehicle.primary ? 'Principal' : 'Disponible'}</Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Brand.colors.black.b3,
  },
  header: {
    backgroundColor: Brand.colors.green.dark,
    borderBottomLeftRadius: Brand.radius[24],
    borderBottomRightRadius: Brand.radius[24],
    paddingTop: 58,
    paddingHorizontal: Brand.grid.margin,
    paddingBottom: 26,
  },
  headerTitle: {
    color: Brand.colors.black.b1,
    fontSize: 24,
    fontFamily: Fonts.headingHeavy,
  },
  headerSub: {
    color: Brand.colors.green.light,
    fontSize: 13,
    fontFamily: Fonts.sans,
    marginTop: 4,
  },
  content: {
    paddingHorizontal: Brand.grid.margin,
    paddingTop: 12,
    paddingBottom: 22,
  },
  card: {
    borderRadius: Brand.radius[16],
    padding: 12,
    gap: 10,
    ...withElevation(200),
  },
  stepperWrap: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 2,
  },
  stepperDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Brand.colors.black.b6,
  },
  stepperDotActive: {
    backgroundColor: Brand.colors.green.normal,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Brand.radius[12],
  },
  sectionLabel: {
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.headingBold,
    textTransform: 'uppercase',
  },
  vehicleSection: {
    gap: 8,
  },
  vehiclePicker: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    paddingHorizontal: 12,
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  vehicleCard: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    padding: 11,
    gap: 6,
  },
  vehicleCardActive: {
    borderColor: Brand.colors.green.normal,
    backgroundColor: 'rgba(255, 255, 255, 0.86)',
  },
  vehicleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  vehicleName: {
    color: Brand.colors.black.b10,
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
  vehicleMeta: {
    color: Brand.colors.black.b7,
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: 2,
  },
  vehicleTag: {
    alignSelf: 'flex-start',
    color: Brand.colors.green.dark,
    fontSize: 11,
    fontFamily: Fonts.heading,
  },
  helperText: {
    color: Brand.colors.black.b7,
    fontSize: 11,
    fontFamily: Fonts.sans,
    marginTop: -2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 36, 32, 0.42)',
    justifyContent: 'center',
    paddingHorizontal: Brand.grid.margin,
  },
  modalCard: {
    borderRadius: Brand.radius[16],
    padding: 14,
    gap: 12,
    maxHeight: '74%',
    ...withElevation(400),
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalTitle: {
    color: Brand.colors.black.b10,
    fontSize: 16,
    fontFamily: Fonts.headingBold,
  },
  modalList: {
    gap: 10,
    paddingBottom: 6,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: Brand.colors.black.b10,
    fontFamily: Fonts.sans,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  flex1: {
    flex: 1,
  },
  counterBox: {
    borderRadius: Brand.radius[12],
    borderWidth: 1,
    borderColor: Brand.colors.green.light,
    backgroundColor: 'rgba(255, 255, 255, 0.68)',
    padding: 10,
  },
  counterHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  counterLabel: {
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.heading,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  counterBtn: {
    width: 27,
    height: 27,
    borderRadius: 8,
    backgroundColor: Brand.colors.green.normal,
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterBtnText: {
    color: Brand.colors.black.b1,
    fontFamily: Fonts.headingBold,
    fontSize: 16,
    marginTop: -1,
  },
  counterValue: {
    fontSize: 20,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.black.b10,
  },
  priceInput: {
    fontSize: 20,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.black.b10,
    paddingVertical: 0,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 13,
    color: Brand.colors.black.b9,
    fontFamily: Fonts.heading,
  },
  toggle: {
    width: Brand.toggle.width,
    height: Brand.toggle.height,
    borderRadius: 999,
    paddingHorizontal: Brand.toggle.inset,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: Brand.colors.green.dark,
  },
  toggleInactive: {
    backgroundColor: Brand.colors.green.light,
  },
  toggleKnob: {
    width: Brand.toggle.knobWidth,
    height: Brand.toggle.knobHeight,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    alignSelf: 'flex-end',
  },
  toggleKnobInactive: {
    alignSelf: 'flex-start',
  },
  textAreaWrap: {
    alignItems: 'flex-start',
  },
  textAreaIcon: {
    marginTop: 4,
  },
  textArea: {
    flex: 1,
    minHeight: 72,
    fontSize: 14,
    color: Brand.colors.black.b10,
    fontFamily: Fonts.sans,
  },
  counterText: {
    alignSelf: 'flex-end',
    fontSize: 11,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.sans,
  },
  summary: {
    marginTop: 10,
    borderRadius: Brand.radius[16],
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...withElevation(100),
  },
  summaryLabel: {
    fontSize: 12,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.sans,
  },
  summaryValue: {
    fontSize: 24,
    fontFamily: Fonts.headingHeavy,
    color: Brand.colors.green.normal,
  },
  summaryMath: {
    fontSize: 12,
    color: Brand.colors.black.b7,
    fontFamily: Fonts.heading,
  },
  summaryVehicle: {
    marginTop: 2,
    fontSize: 11,
    color: Brand.colors.black.b8,
    fontFamily: Fonts.sans,
  },
  cta: {
    marginTop: 10,
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    ...withElevation(100),
  },
  ctaText: {
    color: Brand.colors.black.b1,
    fontSize: 15,
    fontFamily: Fonts.headingBold,
  },
});