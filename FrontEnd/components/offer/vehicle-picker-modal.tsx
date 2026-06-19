// Modal to pick which registered vehicle the driver offers the trip with.

import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { VehicleOption } from '@/hooks/use-offer-form';
import { makeStyles } from '@/styles/tabs/offer.styles';

export default function VehiclePickerModal({
  visible, onClose, vehicles, vehicleId, onSelect, styles, colors,
}: {
  visible: boolean;
  onClose: () => void;
  vehicles: VehicleOption[];
  vehicleId: string | null;
  onSelect: (id: string) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <GlassCard style={styles.modalCard} intensity={40}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Elegir vehículo</Text>
            <Pressable onPress={onClose}>
              <Ionicons name="close" size={20} color={colors.textPrimary} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.modalList} showsVerticalScrollIndicator={false}>
            {vehicles.map((vehicle) => {
              const active = vehicle.id === vehicleId;
              return (
                <Pressable
                  key={vehicle.id}
                  style={[styles.vehicleCard, active && styles.vehicleCardActive]}
                  onPress={() => onSelect(vehicle.id)}
                >
                  <View style={styles.vehicleTopRow}>
                    <View>
                      <Text style={styles.vehicleName}>{vehicle.name}</Text>
                      <Text style={styles.vehicleMeta}>{vehicle.plate} · {vehicle.color}</Text>
                    </View>
                    {active ? <Ionicons name="checkmark-circle" size={18} color={Brand.colors.green.normal} /> : null}
                  </View>
                  <Text style={styles.vehicleTag}>Disponible</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </GlassCard>
      </View>
    </Modal>
  );
}
