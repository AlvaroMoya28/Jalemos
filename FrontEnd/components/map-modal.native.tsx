// Native interactive map modal (iOS / Android).
// Uses react-native-maps for a fully interactive map with the route polyline drawn.

import { Ionicons } from "@expo/vector-icons";
import { useMemo, useRef } from "react";
import {
    Modal,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { DetailedRide } from "@/constants/mock-rides";
import { Brand } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";
import { styles as s } from "./styles/map-modal.native.styles";

// Dark style JSON for Android Google Maps — mirrors the app's dark palette.
const DARK_MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b6b6b" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#1a1a1a" }] },
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#2d2d2d" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#3c3c3c" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a9e8f" }],
  },
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#0a3530" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#161616" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#1f1f1f" }],
  },
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#1a1a1a" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#0d2018" }],
  },
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#2a2a2a" }],
  },
];

const LIGHT_MAP_STYLE = [
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#bae2dd" }],
  },
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#f0f7f5" }],
  },
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#dceee9" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#1a9e8f" }],
  },
];

export interface MapModalProps {
  visible: boolean;
  onClose: () => void;
  ride: DetailedRide;
  polyline: string | null;
}

function decodePolyline(
  encoded: string,
): { latitude: number; longitude: number }[] {
  const points: { latitude: number; longitude: number }[] = [];
  let index = 0,
    lat = 0,
    lng = 0;
  while (index < encoded.length) {
    let shift = 0,
      result = 0,
      byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;
    points.push({ latitude: lat / 1e5, longitude: lng / 1e5 });
  }
  return points;
}

export default function InteractiveMapModal({
  visible,
  onClose,
  ride,
  polyline,
}: MapModalProps) {
  const insets = useSafeAreaInsets();
  const { isDark } = useAppTheme();
  const mapRef = useRef<MapView>(null);
  const routeCoords = useMemo(
    () => (polyline ? decodePolyline(polyline) : []),
    [polyline],
  );
  const hasCoords = !!ride?.fromCoords && !!ride?.toCoords;
  const origin = hasCoords
    ? { latitude: ride.fromCoords.lat, longitude: ride.fromCoords.lng }
    : null;
  const destination = hasCoords
    ? { latitude: ride.toCoords.lat, longitude: ride.toCoords.lng }
    : null;

  const fitRoute = () => {
    if (!hasCoords && routeCoords.length === 0) return;
    const coords = routeCoords.length > 0 ? routeCoords : [origin, destination];
    mapRef.current?.fitToCoordinates(coords as any, {
      edgePadding: { top: 100, right: 60, bottom: 80, left: 60 },
      animated: false,
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={s.container}>
        {hasCoords ? (
          <MapView
            ref={mapRef}
            style={s.mapFull}
            provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
            userInterfaceStyle={isDark ? "dark" : "light"}
            customMapStyle={isDark ? DARK_MAP_STYLE : LIGHT_MAP_STYLE}
            initialRegion={{
              latitude:
                ((origin as any).latitude + (destination as any).latitude) / 2,
              longitude:
                ((origin as any).longitude + (destination as any).longitude) /
                2,
              latitudeDelta:
                Math.abs(
                  (origin as any).latitude - (destination as any).latitude,
                ) *
                  1.8 +
                0.02,
              longitudeDelta:
                Math.abs(
                  (origin as any).longitude - (destination as any).longitude,
                ) *
                  1.8 +
                0.02,
            }}
            onMapReady={fitRoute}
            showsUserLocation
            showsCompass
            showsScale
          >
            <Marker
              coordinate={origin as any}
              title={ride.from}
              pinColor="#1a9e8f"
            />
            <Marker
              coordinate={destination as any}
              title={ride.to}
              pinColor="#E53935"
            />
            {routeCoords.length > 0 && (
              <Polyline
                coordinates={routeCoords}
                strokeColor="#1a9e8f"
                strokeWidth={4}
              />
            )}
          </MapView>
        ) : (
          <View style={s.noCoordsFallback}>
            <Ionicons
              name="map-outline"
              size={48}
              color={Brand.colors.green.normal}
            />
            <Text style={s.noCoordsTitle}>
              Coordenadas no disponibles para este viaje.
            </Text>
            <Text style={s.noCoordsBody}>
              No se puede mostrar un mapa interactivo porque la información de
              ubicación no está presente.
            </Text>
          </View>
        )}

        <View style={[s.header, { paddingTop: insets.top + 10 }]}>
          <View style={s.routeChip}>
            <View style={s.originDot} />
            <Text style={s.chipText} numberOfLines={1}>
              {ride.from}
            </Text>
            <Ionicons
              name="arrow-forward"
              size={12}
              color="rgba(255,255,255,0.6)"
            />
            <Ionicons name="location" size={12} color="#E53935" />
            <Text style={s.chipText} numberOfLines={1}>
              {ride.to}
            </Text>
          </View>
          <Pressable style={s.closeBtn} onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={18} color="#ffffff" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

