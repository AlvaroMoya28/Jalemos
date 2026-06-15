// Admin broadcast composer (E1-5). Lets an admin send an announcement (promo,
// policy update, general notice) to a segment of users. Each recipient gets an
// in-app notification + push.

import { Brand, Fonts } from '@/constants/theme';
import { useAuth } from '@/contexts/auth';
import { useAppTheme } from '@/hooks/use-app-theme';
import { notificationsApi } from '@/services/api';
import { BroadcastSegment } from '@/types/notifications';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

const SEGMENTS: { key: BroadcastSegment; label: string; desc: string }[] = [
  { key: 'All', label: 'Todos', desc: 'Todos los usuarios, en cualquier modo' },
  { key: 'Passengers', label: 'Pasajeros', desc: 'Visible solo en modo pasajero' },
  { key: 'Drivers', label: 'Conductores', desc: 'Solo conductores, en modo conductor' },
];

export default function AdminBroadcastScreen() {
  const { token } = useAuth();
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const navigation = useNavigation();

  // Set the tab title + icon (per-screen, like the other tabs) so iOS NativeTabs
  // and Android both show "Avisos" with a megaphone instead of the raw route name.
  useEffect(() => {
    navigation.setOptions({ title: 'Avisos', icon: { sf: 'megaphone' } });
  }, [navigation]);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<BroadcastSegment>('All');
  const [sending, setSending] = useState(false);

  const canSend = title.trim().length > 0 && !sending;

  const send = async () => {
    if (!token || !canSend) return;
    const segmentLabel = SEGMENTS.find((s) => s.key === segment)?.label ?? 'Todos';
    Alert.alert(
      'Enviar notificación',
      `Se enviará a: ${segmentLabel}. ¿Continuar?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Enviar',
          onPress: async () => {
            setSending(true);
            try {
              const res = await notificationsApi.broadcast(
                { title: title.trim(), body: body.trim() || undefined, segment },
                token,
              );
              Alert.alert('Enviado', `Notificación enviada a ${res.recipients} usuario(s).`);
              setTitle('');
              setBody('');
              setSegment('All');
            } catch (e: any) {
              Alert.alert('Error', e?.message ?? 'No se pudo enviar la notificación.');
            } finally {
              setSending(false);
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.titleRow}>
          <Ionicons name="megaphone-outline" size={22} color={Brand.colors.green.normal} />
          <Text style={styles.screenTitle}>Enviar notificación</Text>
        </View>
        <Text style={styles.subtitle}>
          Comunica promociones, cambios de políticas o avisos a tus usuarios.
        </Text>

        <Text style={styles.label}>Título</Text>
        <TextInput
          style={styles.input}
          value={title}
          onChangeText={setTitle}
          placeholder="Ej: Nueva promo Pura Vida"
          placeholderTextColor={colors.textMuted}
          maxLength={200}
        />

        <Text style={styles.label}>Mensaje (opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={body}
          onChangeText={setBody}
          placeholder="Detalle del aviso…"
          placeholderTextColor={colors.textMuted}
          multiline
          maxLength={500}
        />

        <Text style={styles.label}>Destinatarios</Text>
        {SEGMENTS.map((s) => {
          const active = segment === s.key;
          return (
            <Pressable
              key={s.key}
              style={[styles.segment, active && styles.segmentActive]}
              onPress={() => setSegment(s.key)}
            >
              <View style={styles.rowText}>
                <Text style={styles.segmentLabel}>{s.label}</Text>
                <Text style={styles.segmentDesc}>{s.desc}</Text>
              </View>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={active ? Brand.colors.green.normal : colors.textMuted}
              />
            </Pressable>
          );
        })}

        <Pressable style={[styles.sendButton, !canSend && styles.sendButtonDisabled]} onPress={send} disabled={!canSend}>
          {sending
            ? <ActivityIndicator color={Brand.colors.black.b1} />
            : <Text style={styles.sendButtonText}>Enviar notificación</Text>}
        </Pressable>
      </ScrollView>
    </View>
  );
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.screenBg },
    content: { paddingHorizontal: 16, paddingTop: 58, paddingBottom: 100, gap: 6 },
    titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    screenTitle: { fontSize: 20, fontFamily: Fonts.headingBold, color: c.textPrimary },
    subtitle: { color: c.textSecondary, fontSize: 13, fontFamily: Fonts.sans, marginBottom: 14 },
    label: { color: c.textPrimary, fontSize: 13, fontFamily: Fonts.heading, marginTop: 14, marginBottom: 6 },
    input: {
      backgroundColor: c.borderSubtle + '22',
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
      color: c.textPrimary,
      fontFamily: Fonts.sans,
      fontSize: 14,
    },
    textArea: { minHeight: 96, textAlignVertical: 'top' },
    segment: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.borderSubtle,
      marginTop: 8,
    },
    segmentActive: { borderColor: Brand.colors.green.normal },
    rowText: { flex: 1, paddingRight: 12 },
    segmentLabel: { color: c.textPrimary, fontSize: 15, fontFamily: Fonts.heading },
    segmentDesc: { color: c.textSecondary, fontSize: 12, fontFamily: Fonts.sans, marginTop: 2 },
    sendButton: {
      marginTop: 26,
      backgroundColor: Brand.colors.green.normal,
      borderRadius: 12,
      alignItems: 'center',
      paddingVertical: 14,
    },
    sendButtonDisabled: { opacity: 0.5 },
    sendButtonText: { color: Brand.colors.black.b1, fontSize: 15, fontFamily: Fonts.heading },
  });
}
