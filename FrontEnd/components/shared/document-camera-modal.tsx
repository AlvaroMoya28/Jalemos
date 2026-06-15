// Full-screen camera modal with a document-guide overlay.
// documentType='license'  — card-shaped frame (ISO ID-1 ratio 85.6×54 mm), back camera,
//                           crops the confirmed photo to the frame area.
// documentType='document' — A4-portrait frame for visual guidance, back camera,
//                           saves the full photo (cropping loses too much detail).
// documentType='face'     — circular oval frame, FRONT camera, saves full photo.
//                           The oval guides the user to keep their face centred and visible.
// EXIF rotation is normalised on every capture so the preview always appears upright.

import { Brand } from '@/constants/theme';
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
import { styles } from './styles/document-camera-modal.styles';

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
  }, [visible, permission?.granted, requestPermission]);

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
        <View style={styles.center}><ActivityIndicator color={Brand.colors.green.normal} /></View>
      </Modal>
    );
  }

  if (!permission.granted) {
    return (
      <Modal visible animationType="slide">
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={48} color={Brand.colors.green.normal} />
          <Text style={styles.permText}>Se necesita acceso a la cámara</Text>
          <Pressable style={styles.permBtn} onPress={requestPermission}>
            <Text style={styles.permBtnText}>Permitir acceso</Text>
          </Pressable>
          <Pressable onPress={onClose} style={{ marginTop: 12 }}>
            <Text style={[styles.permText, { fontSize: 13 }]}>Cancelar</Text>
          </Pressable>
        </View>
      </Modal>
    );
  }

  // Helper: renders the 4 dark strips + frame outline used in both live and preview modes
  const Overlay = () => (
    <>
      <View style={[styles.overlay, { height: frameY, top: 0 }]} />
      <View style={[styles.overlay, { height: SH - frameY - frameH, bottom: 0 }]} />
      <View style={[styles.overlaySide, { top: frameY, height: frameH, left: 0, width: frameX }]} />
      <View style={[styles.overlaySide, { top: frameY, height: frameH, right: 0, width: frameX }]} />
      <View style={[styles.frame, {
        width: frameW, height: frameH,
        borderRadius: frameRadius,
        top: frameY, left: frameX,
      }]}>
        {/* Corner brackets only for rectangular frames */}
        {!isFace && (
          <>
            <View style={[styles.corner, styles.cornerTL]} />
            <View style={[styles.corner, styles.cornerTR]} />
            <View style={[styles.corner, styles.cornerBL]} />
            <View style={[styles.corner, styles.cornerBR]} />
          </>
        )}
      </View>
    </>
  );

  return (
    <Modal visible animationType="slide" statusBarTranslucent>
      <View style={styles.container}>

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
        <View style={styles.topBar}>
          <Pressable style={styles.closeBtn} onPress={onClose}>
            <Ionicons name="close" size={22} color="#fff" />
          </Pressable>
          <Text style={styles.topLabel}>{label}</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Positioning instruction — hidden during preview */}
        {!preview && (
          <View style={styles.instructionWrap}>
            <Text style={styles.instruction}>{instructions[documentType]}</Text>
          </View>
        )}

        {/* Bottom action bar — capture button or retake / confirm pair */}
        <View style={styles.bottomBar}>
          {preview ? (
            <>
              <Pressable style={styles.actionBtn} onPress={retake}>
                <Ionicons name="refresh-outline" size={20} color="#fff" />
                <Text style={styles.actionText}>Reintentar</Text>
              </Pressable>
              <Pressable
                style={[styles.captureBtn, styles.captureBtnConfirm]}
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
              <Pressable style={styles.captureBtn} onPress={takePicture} disabled={capturing}>
                {capturing
                  ? <ActivityIndicator color="#fff" />
                  : <View style={styles.captureInner} />}
              </Pressable>
              <View style={{ width: 72 }} />
            </>
          )}
        </View>

      </View>
    </Modal>
  );
}

