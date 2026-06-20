// Read-only info cards for the application detail: applicant, vehicle, and
// declared expiry dates (the latter two hidden/limited for vehicle-only requests).

import { Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassCard from '@/components/shared/glass-card';
import { DriverApplication } from '@/contexts/applications';
import { makeStyles } from '@/styles/app/application-detail.styles';

export default function ApplicationInfoCards({ app, styles }: {
  app: DriverApplication;
  styles: ReturnType<typeof makeStyles>;
}) {
  const isVehicle = app.applicationType === 'vehicle';
  return (
    <>
      {/* Applicant */}
      <Animated.View entering={FadeInDown.duration(200).delay(80)}>
        <GlassCard style={styles.card} intensity={32}>
          <Text style={styles.sectionLabel}>Solicitante</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Nombre</Text>
              <Text style={styles.infoValue}>{app.applicantName}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Correo</Text>
              <Text style={styles.infoValue}>{app.applicantEmail}</Text>
            </View>
          </View>
          {!isVehicle && (
            <>
              <View style={styles.infoRow}>
                <View style={styles.infoCell}>
                  <Text style={styles.infoKey}>Cédula</Text>
                  <Text style={styles.infoValue}>{app.cedula}</Text>
                </View>
                <View style={styles.infoCell}>
                  <Text style={styles.infoKey}>Intentos</Text>
                  <Text style={styles.infoValue}>{app.attempts}</Text>
                </View>
              </View>
              <View style={styles.infoRow}>
                <View style={[styles.infoCell, { flex: 2 }]}>
                  <Text style={styles.infoKey}>Dirección</Text>
                  <Text style={styles.infoValue}>{app.address}</Text>
                </View>
              </View>
            </>
          )}
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Enviada</Text>
              <Text style={styles.infoValue}>
                {new Date(app.submittedAt).toLocaleDateString('es-CR', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
            </View>
            {isVehicle && (
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Intentos</Text>
                <Text style={styles.infoValue}>{app.attempts}</Text>
              </View>
            )}
          </View>
        </GlassCard>
      </Animated.View>

      {/* Vehicle */}
      <Animated.View entering={FadeInDown.duration(200).delay(120)}>
        <GlassCard style={styles.card} intensity={32}>
          <Text style={styles.sectionLabel}>Vehículo</Text>
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Marca / Modelo</Text>
              <Text style={styles.infoValue}>{app.vehicle.brand} {app.vehicle.model}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Año</Text>
              <Text style={styles.infoValue}>{app.vehicle.year}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Placa</Text>
              <Text style={styles.infoValue}>{app.vehicle.plate}</Text>
            </View>
            <View style={styles.infoCell}>
              <Text style={styles.infoKey}>Color</Text>
              <Text style={styles.infoValue}>{app.vehicle.color}</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      {/* Declared expiry dates — not for vehicle-only requests */}
      {!isVehicle && (app.licenseExpiryMonth || app.dekraExpiryMonth) && (
        <Animated.View entering={FadeInDown.duration(200).delay(155)}>
          <GlassCard style={styles.card} intensity={32}>
            <Text style={styles.sectionLabel}>Vencimientos declarados</Text>
            <View style={styles.infoRow}>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Licencia vence</Text>
                <Text style={styles.infoValue}>
                  {app.licenseExpiryMonth && app.licenseExpiryYear
                    ? `${String(app.licenseExpiryMonth).padStart(2, '0')}/${app.licenseExpiryYear}` : '—'}
                </Text>
              </View>
              <View style={styles.infoCell}>
                <Text style={styles.infoKey}>Dekra vence</Text>
                <Text style={styles.infoValue}>
                  {app.dekraExpiryMonth && app.dekraExpiryYear
                    ? `${String(app.dekraExpiryMonth).padStart(2, '0')}/${app.dekraExpiryYear}` : '—'}
                </Text>
              </View>
            </View>
          </GlassCard>
        </Animated.View>
      )}
    </>
  );
}
