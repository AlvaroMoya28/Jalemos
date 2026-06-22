// Boarding-QR section of the profile screen: shows/hides the QR and emails it to the
// user (with the backend-enforced cooldown). Presentational — state lives in the screen.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import QrDisplay from '@/components/shared/qr-display';
import { Brand } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles, staticStyles as profileStaticStyles } from '../../styles/tabs/profile.styles';

type ProfileStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function QrSection({
  qrToken, showQr, onToggleQr, sendingQr, qrCooldown, onSendQr, styles,
}: {
  qrToken: string;
  showQr: boolean;
  onToggleQr: () => void;
  sendingQr: boolean;
  qrCooldown: number;
  onSendQr: () => void;
  styles: ProfileStyles;
  colors: AppColors;
}) {
  return (
    <View style={styles.sectionWrap}>
      <Text style={styles.sectionTitle}>Mi QR de abordaje</Text>
      <GlassCard style={[styles.sectionCard, profileStaticStyles.qrSectionCard]}>
        <Text style={[styles.itemDesc, profileStaticStyles.qrItemDescCentered]}>
          Muestra este código al conductor para registrarte en el vehículo. Es único e intransferible.
        </Text>
        {showQr ? (
          <QrDisplay qrToken={qrToken} size={180} label="Tu identificación de abordaje" />
        ) : null}
        <Pressable style={profileStaticStyles.qrToggleBtn} onPress={onToggleQr}>
          <Ionicons name={showQr ? 'eye-off-outline' : 'qr-code-outline'} size={16} color="#fff" />
          <Text style={profileStaticStyles.qrToggleBtnText}>{showQr ? 'Ocultar QR' : 'Mostrar mi QR'}</Text>
        </Pressable>

        <Pressable
          style={[styles.sendQrBtn, (sendingQr || qrCooldown > 0) && profileStaticStyles.sendQrBtnDisabled]}
          onPress={onSendQr}
          disabled={sendingQr || qrCooldown > 0}
        >
          {sendingQr
            ? <ActivityIndicator size="small" color={Brand.colors.green.normal} />
            : <Ionicons name="mail-outline" size={16} color={Brand.colors.green.normal} />}
          <Text style={styles.sendQrBtnText}>
            {qrCooldown > 0
              ? `Reenviar en ${Math.floor(qrCooldown / 60)}:${String(qrCooldown % 60).padStart(2, '0')}`
              : 'Enviar QR a mi correo'}
          </Text>
        </Pressable>
      </GlassCard>
    </View>
  );
}
