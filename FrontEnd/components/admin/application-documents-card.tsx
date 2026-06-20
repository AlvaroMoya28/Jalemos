// Attached document photos for an application (hidden for vehicle-only requests).

import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassCard from '@/components/shared/glass-card';
import { Fonts } from '@/constants/theme';
import { DriverApplication } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/app/application-detail.styles';
import ApplicationPhotoCard from './application-photo-card';

export default function ApplicationDocumentsCard({ app, styles, colors, onView }: {
  app: DriverApplication;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
  onView: (photo: { url: string; label: string }) => void;
}) {
  const docs: { label: string; url: string | null }[] = [
    { label: 'Foto de cara',      url: app.facePhoto },
    { label: 'Licencia frontal',  url: app.licensePhotoFront },
    { label: 'Licencia trasera',  url: app.licensePhotoBack },
    { label: 'Dekra',             url: app.dekraPhoto },
  ];
  const hasAny = docs.some((d) => d.url);

  return (
    <Animated.View entering={FadeInDown.duration(200).delay(160)}>
      <GlassCard style={styles.card} intensity={32}>
        <Text style={styles.sectionLabel}>Documentos adjuntos</Text>
        <View style={styles.photosRow}>
          {docs.map((d) => (
            <ApplicationPhotoCard
              key={d.label}
              label={d.label}
              url={d.url}
              colors={colors}
              onPress={() => d.url && onView({ url: d.url, label: d.label })}
            />
          ))}
        </View>
        {!hasAny && (
          <Text style={{ fontSize: 11, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center' }}>
            El solicitante no adjuntó fotos
          </Text>
        )}
        {hasAny && (
          <Text style={{ fontSize: 10, fontFamily: Fonts.sans, color: colors.textMuted, textAlign: 'center' }}>
            Tocá una foto para verla en pantalla completa
          </Text>
        )}
      </GlassCard>
    </Animated.View>
  );
}
