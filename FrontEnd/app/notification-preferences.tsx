// Notification preferences (E1-6). Lets the user opt in/out of non-critical
// notification categories. Critical safety alerts (cancellations, no-show) are
// always delivered and shown as read-only. Saved to the backend per user.

import { Brand, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { notificationsApi } from '@/services/api';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';

// User-facing categories → the backend notification types they map to.
const CATEGORIES: { key: string; label: string; desc: string; types: string[] }[] = [
  { key: 'bookings', label: 'Reservas', desc: 'Cuando reservan o confirman un espacio', types: ['booking_received', 'booking_confirmed'] },
  { key: 'trip', label: 'Estado del viaje', desc: 'Abordaje, inicio y fin del viaje', types: ['trip_starting', 'trip_boarding', 'trip_started', 'trip_completed', 'qr_scanned'] },
  { key: 'ratings', label: 'Calificaciones', desc: 'Calificaciones recibidas y recordatorios', types: ['rating_received', 'rating_reminder'] },
  { key: 'payments', label: 'Pagos', desc: 'Recordatorios de pago', types: ['payment_reminder'] },
  { key: 'promos', label: 'Promociones y avisos', desc: 'Novedades y mensajes de Jalemos', types: ['admin_broadcast'] },
];

export default function NotificationPreferencesScreen() {
  const router = useRouter();
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [enabled, setEnabled] = useState<Record<string, boolean>>(
    Object.fromEntries(CATEGORIES.map((c) => [c.key, true])),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current preferences. A category is ON unless one of its types is explicitly false.
  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const { preferences } = await notificationsApi.getPreferences(token);
        setEnabled(
          Object.fromEntries(
            CATEGORIES.map((c) => [c.key, !c.types.some((t) => preferences[t] === false)]),
          ),
        );
      } catch {
        // keep defaults (all on)
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const toggle = (key: string) => setEnabled((prev) => ({ ...prev, [key]: !prev[key] }));

  const save = async () => {
    if (!token) return;
    setSaving(true);
    // Expand each category back to its underlying type flags.
    const preferences: Record<string, boolean> = {};
    for (const c of CATEGORIES) {
      for (const t of c.types) preferences[t] = enabled[c.key];
    }
    try {
      await notificationsApi.updatePreferences({ preferences }, token);
      router.back();
    } catch {
      setSaving(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Notificaciones</Text>
        <View style={{ width: 24 }} />
      </View>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={Brand.colors.green.normal} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.sectionLabel}>Elige qué avisos quieres recibir</Text>

          {CATEGORIES.map((c) => (
            <View key={c.key} style={styles.row}>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>{c.label}</Text>
                <Text style={styles.rowDesc}>{c.desc}</Text>
              </View>
              <Switch
                value={enabled[c.key]}
                onValueChange={() => toggle(c.key)}
                trackColor={{ true: Brand.colors.green.normal, false: colors.borderSubtle }}
              />
            </View>
          ))}

          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.textMuted} />
            <Text style={styles.infoText}>
              Los avisos de seguridad (cancelaciones y ausencias) siempre se envían.
            </Text>
          </View>

          <Pressable style={styles.saveButton} onPress={save} disabled={saving}>
            {saving
              ? <ActivityIndicator color={Brand.colors.black.b1} />
              : <Text style={styles.saveButtonText}>Guardar</Text>}
          </Pressable>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 58,
      paddingBottom: 14,
    },
    headerTitle: { fontSize: 18, fontFamily: Fonts.headingBold, color: c.textPrimary },
    loadingWrap: { paddingTop: 60, alignItems: 'center' },
    content: { paddingHorizontal: 16, paddingBottom: 60, gap: 4 },
    sectionLabel: { color: c.textMuted, fontSize: 13, fontFamily: Fonts.sans, marginBottom: 10 },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.borderSubtle,
    },
    rowText: { flex: 1, paddingRight: 12 },
    rowTitle: { color: c.textPrimary, fontSize: 15, fontFamily: Fonts.heading },
    rowDesc: { color: c.textSecondary, fontSize: 12, fontFamily: Fonts.sans, marginTop: 2 },
    infoBox: {
      flexDirection: 'row',
      gap: 8,
      alignItems: 'center',
      marginTop: 18,
      padding: 12,
      borderRadius: 12,
      backgroundColor: c.borderSubtle + '33',
    },
    infoText: { flex: 1, color: c.textMuted, fontSize: 12, fontFamily: Fonts.sans },
    saveButton: {
      marginTop: 24,
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 14,
    },
    saveButtonText: { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.heading },
  });
}
