// Políticas de uso de Jalemos — pantalla de lectura completa.
// Accesible desde el registro (antes de aceptar) y desde Perfil > Soporte.

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

const SECTIONS = [
  {
    icon: 'information-circle-outline' as const,
    title: '1. Definición del servicio',
    body: [
      'Jalemos es una plataforma de carpooling que conecta conductores y pasajeros que comparten rutas. No es un servicio de transporte remunerado ni un taxi; los conductores son usuarios particulares que ofrecen compartir su vehículo.',
      'El uso de la plataforma implica que ambas partes actúan como particulares y de manera voluntaria.',
    ],
  },
  {
    icon: 'time-outline' as const,
    title: '2. Tiempo de espera y puntualidad',
    body: [
      'El conductor dispone de un máximo de 10 minutos desde la hora acordada para iniciar el viaje. Pasado ese tiempo, el pasajero puede cancelar sin penalización.',
      'El pasajero debe estar en el punto de recogida con al menos 5 minutos de anticipación.',
      'Si el pasajero no se presenta en el punto acordado dentro de los 10 minutos posteriores a la llegada del conductor, este podrá cancelar el viaje sin recibir penalización alguna.',
    ],
  },
  {
    icon: 'close-circle-outline' as const,
    title: '3. Cancelaciones',
    body: [
      'Las cancelaciones realizadas con menos de 15 minutos de anticipación se registran como cancelación tardía y afectan la calificación del usuario.',
      'Acumular 3 cancelaciones tardías en un período de 30 días puede resultar en suspensión temporal de la cuenta.',
      'Los conductores que cancelen reiteradamente viajes confirmados recibirán sanciones más estrictas que los pasajeros, dado que su ausencia afecta a múltiples personas.',
    ],
  },
  {
    icon: 'star-outline' as const,
    title: '4. Calificaciones y reputación',
    body: [
      'Conductores y pasajeros deben mantener una calificación mínima de 3.5/5 para seguir usando la plataforma activamente.',
      'Las cuentas con calificación inferior serán revisadas y podrían suspenderse temporalmente hasta mejorar su historial.',
      'Se recomienda calificar cada viaje con honestidad: las calificaciones son la base de la confianza en la comunidad.',
      'Calificaciones malintencionadas o represalias injustificadas pueden ser revisadas y revertidas por el equipo de administración.',
    ],
  },
  {
    icon: 'people-outline' as const,
    title: '5. Conducta y convivencia',
    body: [
      'Está prohibido el consumo de alcohol, drogas o cualquier sustancia similar durante los viajes.',
      'No se permite fumar dentro del vehículo salvo autorización expresa del conductor.',
      'Queda estrictamente prohibido el acoso, lenguaje ofensivo, discriminación o cualquier forma de maltrato entre usuarios.',
      'Los pasajeros deben respetar las normas del vehículo del conductor (música, mascotas, equipaje).',
      'Cualquier conducta que genere incomodidad o riesgo debe reportarse inmediatamente desde la aplicación.',
    ],
  },
  {
    icon: 'car-sport-outline' as const,
    title: '6. Seguridad vial',
    body: [
      'Los conductores están obligados a cumplir con el Reglamento de Tránsito de Costa Rica en todo momento.',
      'El uso del cinturón de seguridad es obligatorio para todos los ocupantes del vehículo.',
      'Está estrictamente prohibido usar el teléfono celular mientras se conduce, incluyendo manos libres si distrae la atención.',
      'El número de pasajeros no puede superar la capacidad oficial del vehículo según su tarjeta de circulación.',
      'Conducción temeraria, exceso de velocidad o infracciones graves son motivo de desactivación inmediata de la cuenta.',
    ],
  },
  {
    icon: 'document-text-outline' as const,
    title: '7. Requisitos para conductores',
    body: [
      'Licencia de conducir vigente, categoría B1 o superior.',
      'Revisión técnica vehicular (RTV / DEKRA) al día y disponible para verificación.',
      'Seguro obligatorio del INS vigente.',
      'El vehículo no puede tener más de 15 años de antigüedad al momento del registro.',
      'La tarjeta de circulación, el seguro y la licencia deben portarse durante cada viaje.',
      'Jalemos se reserva el derecho de verificar la documentación en cualquier momento y de suspender cuentas con documentos vencidos o irregulares.',
    ],
  },
  {
    icon: 'cash-outline' as const,
    title: '8. Pagos y tarifas',
    body: [
      'Las tarifas son acordadas libremente entre el conductor y los pasajeros antes de confirmar el viaje.',
      'Una vez confirmado el viaje, la tarifa no puede modificarse unilateralmente por ninguna de las partes.',
      'Jalemos no cobra comisiones durante la etapa beta del servicio.',
      'Las propinas son completamente opcionales y voluntarias.',
      'Jalemos no procesa pagos ni actúa como intermediario financiero; los acuerdos de pago son entre usuarios.',
    ],
  },
  {
    icon: 'shield-outline' as const,
    title: '9. Privacidad y datos personales',
    body: [
      'Los datos personales son tratados conforme a la Ley de Protección de la Persona frente al Tratamiento de sus Datos Personales (Ley N° 8968) de Costa Rica.',
      'Jalemos no vende ni comparte información personal con terceros sin consentimiento expreso del usuario, salvo requerimiento de autoridad competente.',
      'La ubicación del usuario solo se activa durante un viaje activo y no se almacena de forma permanente en los servidores de Jalemos.',
      'El usuario puede solicitar la eliminación de su cuenta y sus datos enviando una solicitud al equipo de soporte.',
    ],
  },
  {
    icon: 'flag-outline' as const,
    title: '10. Reportes y moderación',
    body: [
      'Los reportes de conducta inadecuada son revisados por el equipo de administración en un plazo máximo de 48 horas hábiles.',
      'Un reporte fundamentado puede resultar en suspensión temporal de 1 a 30 días según la gravedad del incidente.',
      'Conductas graves como acoso, agresión física, conducción temeraria o fraude pueden resultar en desactivación permanente e irreversible de la cuenta.',
      'Presentar reportes falsos o maliciosos es también motivo de sanción para quien los realiza.',
    ],
  },
  {
    icon: 'alert-circle-outline' as const,
    title: '11. Responsabilidad',
    body: [
      'Jalemos actúa como plataforma intermediaria entre conductores y pasajeros, y no es parte del acuerdo de transporte que se establece entre ellos.',
      'Jalemos no asume responsabilidad por accidentes, daños, robos o cualquier incidente ocurrido durante los viajes.',
      'Cada conductor es personalmente responsable del estado mecánico de su vehículo y del cumplimiento de las leyes de tránsito.',
      'Se recomienda encarecidamente a todos los usuarios compartir su ubicación en tiempo real con familiares o personas de confianza durante los viajes.',
    ],
  },
  {
    icon: 'refresh-outline' as const,
    title: '12. Modificaciones a las políticas',
    body: [
      'Jalemos se reserva el derecho de actualizar estas políticas en cualquier momento.',
      'Las modificaciones serán notificadas a los usuarios por correo electrónico o notificación en la aplicación con al menos 7 días de anticipación.',
      'El uso continuado de la aplicación tras dicha notificación implica la aceptación de las nuevas políticas.',
      'Última actualización: mayo 2026.',
    ],
  },
];

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      paddingHorizontal: Brand.grid.margin,
      paddingTop: 58,
      paddingBottom: 16,
      backgroundColor: '#0a3f39',
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },
    backBtn: {
      width: 36, height: 36, borderRadius: 18,
      backgroundColor: 'rgba(255,255,255,0.15)',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 2,
    },
    headerText: { flex: 1 },
    heroMini: { color: Brand.colors.green.light, fontSize: 12, fontFamily: Fonts.heading },
    heroTitle: { color: Brand.colors.black.b1, fontSize: 26, fontFamily: Fonts.headingHeavy },
    surface: {
      flex: 1,
      backgroundColor: c.bottomSurface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      marginTop: -4,
    },
    scroll: { flex: 1 },
    scrollContent: { padding: Brand.grid.margin, paddingTop: 20, paddingBottom: 48, gap: 12 },
    introBox: {
      backgroundColor: Brand.colors.green.normal + '18',
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: Brand.colors.green.normal + '40',
      padding: 14,
    },
    introText: {
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
    },
    section: {
      backgroundColor: c.surface,
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      padding: 14,
      paddingBottom: 10,
    },
    iconWrap: {
      width: 34, height: 34, borderRadius: 10,
      backgroundColor: Brand.colors.green.light,
      alignItems: 'center', justifyContent: 'center',
      flexShrink: 0,
    },
    sectionTitle: {
      flex: 1,
      color: c.textPrimary,
      fontFamily: Fonts.headingBold,
      fontSize: 14,
    },
    sectionDivider: { height: 1, backgroundColor: c.border, marginHorizontal: 14 },
    sectionBody: { padding: 14, paddingTop: 10, gap: 8 },
    bullet: { flexDirection: 'row', gap: 8 },
    bulletDot: {
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: Brand.colors.green.normal,
      marginTop: 7, flexShrink: 0,
    },
    bulletText: {
      flex: 1,
      color: c.textSecondary,
      fontFamily: Fonts.sans,
      fontSize: 13,
      lineHeight: 20,
    },
    footer: {
      marginTop: 4,
      padding: 14,
      backgroundColor: c.surfaceAlt,
      borderRadius: Brand.radius[16],
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
      gap: 4,
    },
    footerText: {
      color: c.textMuted,
      fontFamily: Fonts.sans,
      fontSize: 12,
      textAlign: 'center',
      lineHeight: 18,
    },
  });
}

export default function PoliciesScreen() {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={18} color="#ecfff9" />
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.heroMini}>Términos y condiciones</Text>
          <Text style={styles.heroTitle}>Políticas de uso</Text>
        </View>
      </View>

      <View style={styles.surface}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>

          <View style={styles.introBox}>
            <Text style={styles.introText}>
              Al registrarte en Jalemos y usar la aplicación, aceptás los términos descritos a continuación.
              Leé cada sección con atención: estas políticas protegen tu seguridad y la de toda la comunidad.
            </Text>
          </View>

          {SECTIONS.map((sec) => (
            <View key={sec.title} style={styles.section}>
              <View style={styles.sectionHeader}>
                <View style={styles.iconWrap}>
                  <Ionicons name={sec.icon} size={17} color={Brand.colors.green.darkActive} />
                </View>
                <Text style={styles.sectionTitle}>{sec.title}</Text>
              </View>
              <View style={styles.sectionDivider} />
              <View style={styles.sectionBody}>
                {sec.body.map((line, i) => (
                  <View key={i} style={styles.bullet}>
                    <View style={styles.bulletDot} />
                    <Text style={styles.bulletText}>{line}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}

          <View style={styles.footer}>
            <Ionicons name="leaf-outline" size={20} color={Brand.colors.green.normal} />
            <Text style={styles.footerText}>
              Jalemos — Plataforma de carpooling universitario{'\n'}
              Costa Rica · Versión 1.0 · Mayo 2026
            </Text>
          </View>

        </ScrollView>
      </View>
    </View>
  );
}
