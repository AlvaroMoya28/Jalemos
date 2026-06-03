// Camera-based QR scanner for the driver boarding flow.
// Uses expo-camera (already installed). Calls onScan once per detected QR.

import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

interface Props {
  visible: boolean;
  onScan: (token: string) => void;
  onClose: () => void;
}

export default function QrScanner({ visible, onScan, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned]           = useState(false);
  const cooldown = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible && !permission?.granted) requestPermission();
  }, [visible, permission?.granted, requestPermission]);

  useEffect(() => {
    if (!visible) setScanned(false);
  }, [visible]);

  const handleBarcode = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    onScan(data);
    // Allow next scan after 2 s
    cooldown.current = setTimeout(() => setScanned(false), 2000);
  };

  return (
    <Modal visible={visible} animationType="slide" statusBarTranslucent onRequestClose={onClose}>
      <View style={s.container}>
        {permission?.granted ? (
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcode}
          />
        ) : (
          <View style={s.noPermission}>
            <Text style={s.noPermText}>Se necesita permiso de cámara para escanear QR.</Text>
            <Pressable style={s.permBtn} onPress={requestPermission}>
              <Text style={s.permBtnText}>Conceder permiso</Text>
            </Pressable>
          </View>
        )}

        {/* Viewfinder overlay */}
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <View style={s.topDim} />
          <View style={s.middle}>
            <View style={s.sideDim} />
            <View style={s.finder}>
              <View style={[s.corner, s.tl]} />
              <View style={[s.corner, s.tr]} />
              <View style={[s.corner, s.bl]} />
              <View style={[s.corner, s.br]} />
            </View>
            <View style={s.sideDim} />
          </View>
          <View style={s.bottomDim}>
            <Text style={s.hint}>Apunta la cámara al QR del pasajero</Text>
          </View>
        </View>

        <Pressable style={s.closeBtn} onPress={onClose} hitSlop={12}>
          <Ionicons name="close" size={24} color="#fff" />
        </Pressable>
      </View>
    </Modal>
  );
}

const FINDER = 240;
const CORNER = 22;
const BORDER = 4;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  noPermission: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 16 },
  noPermText: { color: '#fff', fontFamily: Fonts.sans, fontSize: 15, textAlign: 'center' },
  permBtn: { backgroundColor: Brand.colors.green.normal, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  permBtnText: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 14 },
  topDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  middle: { flexDirection: 'row' },
  sideDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)' },
  finder: { width: FINDER, height: FINDER },
  bottomDim: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', alignItems: 'center', paddingTop: 24 },
  hint: { color: '#fff', fontFamily: Fonts.sans, fontSize: 13 },
  corner: { position: 'absolute', width: CORNER, height: CORNER, borderColor: Brand.colors.green.light, borderWidth: BORDER },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  closeBtn: {
    position: 'absolute', top: 52, right: 20,
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
});
