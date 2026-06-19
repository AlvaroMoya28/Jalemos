// Web fallback for the interactive map modal.
// react-native-maps is native-only, so on web we open the route in Google Maps instead.

import { Ionicons } from "@expo/vector-icons";
import {
    Linking,
    Modal,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";

import { DetailedRide } from "@/constants/mock-rides";
import { Brand, Fonts } from "@/constants/theme";

export interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  ride: DetailedRide;
  polyline: string | null;
}

export default function InteractiveMapModal({
  visible,
  onClose,
  ride,
}: MapModalProps) {
  const hasCoords = !!ride?.fromCoords && !!ride?.toCoords;
  const mapsUrl = hasCoords
    ? `https://www.google.com/maps/dir/${ride.fromCoords.lat},${ride.fromCoords.lng}` +
      `/${ride.toCoords.lat},${ride.toCoords.lng}`
    : null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={s.card}>
          <Ionicons
            name="map-outline"
            size={44}
            color={Brand.colors.green.normal}
          />
          <Text style={s.title}>Mapa interactivo</Text>
          <Text style={s.body}>
            El mapa interactivo está disponible en la app móvil.{"\n"}
            Podés ver la ruta completa en Google Maps.
          </Text>
          <Pressable
            style={s.btn}
            onPress={() => {
              if (mapsUrl) {
                Linking.openURL(mapsUrl);
                onClose();
              }
            }}
            disabled={!mapsUrl}
          >
            <Ionicons name="navigate-outline" size={16} color="#ffffff" />
            <Text style={s.btnText}>Abrir en Google Maps</Text>
          </Pressable>
          <Pressable style={s.cancelBtn} onPress={onClose}>
            <Text style={s.cancelText}>Cerrar</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 28,
    alignItems: "center",
    gap: 12,
    width: "100%",
    maxWidth: 360,
  },
  title: {
    fontSize: 17,
    fontFamily: Fonts.headingBold,
    color: "#262626",
    textAlign: "center",
  },
  body: {
    fontSize: 13,
    fontFamily: Fonts.sans,
    color: "#595959",
    textAlign: "center",
    lineHeight: 20,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999,
    paddingHorizontal: 24,
    paddingVertical: 13,
    width: "100%",
    justifyContent: "center",
    marginTop: 4,
  },
  btnText: {
    color: "#ffffff",
    fontFamily: Fonts.headingBold,
    fontSize: 14,
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelText: {
    color: "#8c8c8c",
    fontFamily: Fonts.sans,
    fontSize: 13,
  },
});
