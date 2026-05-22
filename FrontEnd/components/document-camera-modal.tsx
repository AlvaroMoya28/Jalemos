// Full-screen camera modal with a document-guide overlay.
// documentType='license'  — card-shaped frame (ISO ID-1 ratio 85.6×54 mm), back camera,
//                           crops the confirmed photo to the frame area.
// documentType='document' — A4-portrait frame for visual guidance, back camera,
//                           saves the full photo (cropping loses too much detail).
// documentType='face'     — circular oval frame, FRONT camera, saves full photo.
//                           The oval guides the user to keep their face centred and visible.
// EXIF rotation is normalised on every capture so the preview always appears upright.

import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Brand, Fonts } from '@/constants/theme';

const { width: SW, height: SH } = Dimensions.get('window');

// License card: ISO/IEC 7810 ID-1 ratio = 85.6 × 54 mm
const LICENSE_W = SW * 0.82;
const LICENSE_H = LICENSE_W / (85.6 / 54);

// A4 document (portrait) ratio = 210 × 297 mm
const DOC_W = SW * 0.82;
const DOC_H = DOC_W * (297 / 210);

// Face circle — diameter sized to frame a typical adult head with a small margin
const FACE_SIZE = SW * 0.70;

export type DocumentType = 'license' | 'document' | 'face';

interface Props {
  visible: boolean;
  documentType: DocumentType;
  label: string;
  onCapture: (uri: string) => void;
  onClose: () => void;
}

export default function DocumentCameraModal({ visible, documentType, label, onCapture, onClose }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [capturing, setCapturing] = useState(false);
  const [confirming, setConfirming] = useState(false);

  const isFace     = documentType === 'face';
  const isDocument = documentType === 'document';

  // Frame dimensions and position per document type
  const frameW      = isFace ? FACE_SIZE  : documentType === 'license' ? LICENSE_W : DOC_W;
  const frameH      = isFace ? FACE_SIZE  : documentType === 'license' ? LICENSE_H : DOC_H;
  // Full circle radius for face; slight rounding for licence; almost none for A4
  const frameRadius = isFace ? FACE_SIZE / 2 : documentType === 'license' ? 12 : 6;
  const frameX      = (SW - frameW) / 2;
  // Face frame sits slightly above centre so the chin is not cropped
  const frameY      = isFace
    ? (SH - frameH) / 2 - 40
    : (SH - frameH) / 2 - 10;

  const instructions: Record<DocumentType, string> = {
    license:  'Coloca la licencia dentro del recuadro',
    document: 'Coloca el documento dentro del recuadro',
    face:     'Centra tu rostro dentro del óvalo',
  };

  useEffect(() => {
    if (visible && !permission?.granted) {
      requestPermission();
    }
    if (!visible) {
      setPreview(null);
      setPreviewSize(null);
      setCapturing(false);
      setConfirming(false);
    }
  }, [visible]);

  const takePicture = async () => {
    if (!cameraRef.current || capturing) return;
    setCapturing(true);
    try {
      const raw = await cameraRef.current.takePictureAsync({ quality: 0.85, skipProcessing: false });
      if (!raw?.uri) return;
      // Fix EXIF rotation by re-rendering — no transforms applied
      const fixCtx = ImageManipulator.manipulate(raw.uri);
      const fixRef = await fixCtx.renderAsync();
      const fixed  = await fixRef.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
      setPreview(fixed.uri);
      setPreviewSize({ width: fixed.width, height: fixed.height });
    } finally {
      setCapturing(false);
    }
  };

  const confirm = async () => {
    if (!preview || !previewSize) return;
    setConfirming(true);
    try {
      // Face and full-document types: save without cropping
      if (isFace || isDocument) {
        onCapture(preview);
        onClose();
        return;
      }

      // Licence type: crop to the frame rectangle using cover-mode maths
      const { width: pw, height: ph } = previewSize;
      const screenAR = SW / SH;
      const photoAR  = pw / ph;
      let scale: number, offsetX: number, offsetY: number;
      if (photoAR > screenAR) {
        scale   = SH / ph;
        offsetX = (pw * scale - SW) / 2 / scale;
        offsetY = 0;
      } else {
        scale   = SW / pw;
        offsetX = 0;
        offsetY = (ph * scale - SH) / 2 / scale;
      }

      const cx = Math.round(frameX / scale + offsetX);
      const cy = Math.round(frameY / scale + offsetY);
      const cw = Math.round(frameW / scale);
      const ch = Math.round(frameH / scale);

      const safeX = Math.max(0, Math.min(cx, pw - 1));
      const safeY = Math.max(0, Math.min(cy, ph - 1));
      const safeW = Math.min(cw, pw - safeX);
      const safeH = Math.min(ch, ph - safeY);

      const cropCtx = ImageManipulator.manipulate(preview);
      cropCtx.crop({ originX: safeX, originY: safeY, width: safeW, height: safeH });
      const cropRef = await cropCtx.renderAsync();
      const cropped = await cropRef.saveAsync({ compress: 0.9, format: SaveFormat.JPEG });
      onCapture(cropped.uri);
      onClose();
    } finally {
      setConfirming(false);
    }
  };

  const retake = () => setPreview(null);

  if (!visible) return null;

  if (!permission) {
    return (
      <Modal visible animationType="slide">
        <View style={s.center}><ActivityIndicator color={Brand.colors.green.normal} /></View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide">
        <View style={s.center}>
          <Ionicons name="camera-outline" size={48} color={Brand.colors.green.normal} />
          <Text style={s.permText}>Se necesita acceso a la cámara</Text>
          <Pressable style={s.permBtn} onPress={requestPermission}>
            <Text style={s.permBtnText}>Permitir acceso</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={[s.permText, { fontSize: 13 }]}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  // Helper: renders the 4 dark strips + frame outline used in both live and preview modes
  const Overlay = () => (
    <>
      <View style={[s.overlay, { height: frameY, top: 0 }]} />
      <View style={[s.overlay, { height: SH - frameY - frameH, bottom: 0 }]} />
      <View style={[s.overlaySide, { top: frameY, height: frameH, left: 0, width: frameX }]} />
      <View style={[s.overlaySide, { top: frameY, height: frameH, right: 0, width: frameX }]} />
      <View style={[s.frame, {
        width: frameW, height: frameH,
        borderRadius: frameRadius,
        top: frameY, left: frameX,
      }]}>
        {/* Corner brackets only for rectangular frames */}
        {!isFace && (
          <>
            <View style={[s.corner, s.cornerTL]} />
            <View style={[s.corner, s.cornerTR]} />
            <View style={[s.corner, s.cornerBL]} />
            <View style={[s.corner, s.cornerBR]} />
          </>
        )}
      </View>
    </>
  );

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={s.container}>

        {/* Live camera feed or captured photo preview */}
        {preview ? (
          <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} resizeMode="cover" />
        ) : (
          // Front camera for face selfie, rear camera for documents
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing={isFace ? 'front' : 'back'}
          />
        )}

        {/* Dark guide overlay — shown in both live and preview modes */}
        <Overlay />

        {/* Top bar — close button and screen title */}
        <View style={s.topBar}>
          <Pressable style={s.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <Text style={s.topLabel}>{label}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Positioning instruction — hidden during preview */}
        {!preview && (
          <View style={s.instructionWrap}>
            <Text style={s.instruction}>{instructions[documentType]}</Text>
          </View>
        )}

        {/* Bottom action bar — capture button or retake / confirm pair */}
        <View style={s.bottomBar}>
          {preview ? (
            <>
              <Pressable style={s.actionBtn} onPress={retake}>
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={s.actionText}>Reintentar</Text>
              </Pressable>
              <Pressable
                style={[s.captureBtn, s.captureBtnConfirm]}
                onPress={confirm}
                disabled={confirming}>
                {confirming
                  ? <ActivityIndicator color="#fff" />
                  : <Ionicons name="checkmark" size={30} color="#fff" />}
              </Pressable>
              <View style={{ width: 72 }} />
            </>
          ) : (
            <>
              <View style={{ width: 72 }} />
              <Pressable style={s.captureBtn} onPress={takePicture} disabled={capturing}>
                {capturing
                  ? <ActivityIndicator color="#fff" />
                  : <View style={s.captureInner} />}
              </Pressable>
              <View style={{ width: 72 }} />
            </>
          )}
        </View>

      </View>
    </Modal>
  );
}

const CORNER_SIZE   = 24;
const CORNER_BORDER = 3;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  center: { flex: 1, backgroundColor: '#111', alignItems: 'center', justifyContent: 'center', gap: 16 },
  overlay: { position: 'absolute', left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.62)' },
  overlaySide: { position: 'absolute', backgroundColor: 'rgba(0,0,0,0.62)' },
  frame: { position: 'absolute', borderWidth: 2, borderColor: Brand.colors.green.normal },
  framePreview: { borderColor: Brand.colors.green.normal, borderWidth: 2.5 },
  // ── Corner brackets (rectangular frames only) ─────────────────────────────
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE },
  cornerTL: {
    top: -CORNER_BORDER, left: -CORNER_BORDER,
    borderTopWidth: CORNER_BORDER + 1, borderLeftWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderTopLeftRadius: 10,
  },
  cornerTR: {
    top: -CORNER_BORDER, right: -CORNER_BORDER,
    borderTopWidth: CORNER_BORDER + 1, borderRightWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderTopRightRadius: 10,
  },
  cornerBL: {
    bottom: -CORNER_BORDER, left: -CORNER_BORDER,
    borderBottomWidth: CORNER_BORDER + 1, borderLeftWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderBottomLeftRadius: 10,
  },
  cornerBR: {
    bottom: -CORNER_BORDER, right: -CORNER_BORDER,
    borderBottomWidth: CORNER_BORDER + 1, borderRightWidth: CORNER_BORDER + 1,
    borderColor: '#fff', borderBottomRightRadius: 10,
  },
  // ── UI chrome ─────────────────────────────────────────────────────────────
  topBar: {
    position: 'absolute', top: 54, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', paddingHorizontal: 16,
  },
  closeBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  topLabel: { color: '#fff', fontFamily: Fonts.headingBold, fontSize: 15, textAlign: 'center' },
  instructionWrap: {
    position: 'absolute', bottom: 160, left: 0, right: 0, alignItems: 'center',
  },
  instruction: {
    color: '#fff', fontFamily: Fonts.sans, fontSize: 13,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 16, paddingVertical: 6,
    borderRadius: 20, overflow: 'hidden',
  },
  // ── Bottom action bar ─────────────────────────────────────────────────────
  bottomBar: {
    position: 'absolute', bottom: 60, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
  },
  captureBtn: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 3, borderColor: '#fff',
    alignItems: 'center', justifyContent: 'center',
  },
  captureBtnConfirm: { backgroundColor: Brand.colors.green.normal, borderColor: Brand.colors.green.normal },
  captureInner: { width: 54, height: 54, borderRadius: 27, backgroundColor: '#fff' },
  actionBtn: { width: 72, alignItems: 'center', gap: 4 },
  actionText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 11 },
  // ── Permissions screen ────────────────────────────────────────────────────
  permText: { color: '#fff', fontFamily: Fonts.heading, fontSize: 15, textAlign: 'center' },
  permBtn: {
    backgroundColor: Brand.colors.green.normal,
    borderRadius: 999, paddingVertical: 10, paddingHorizontal: 24, marginTop: 8,
  },
  permBtnText: { color: Brand.colors.black.b1, fontFamily: Fonts.headingBold, fontSize: 14 },
});
