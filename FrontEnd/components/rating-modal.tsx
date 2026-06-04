// Post-trip rating modal. Shows after trip completes for both driver and passengers.
// Star selector + tag chips + optional review text.

import { useState } from 'react';
import { BlurView } from 'expo-blur';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';

const TAGS_BY_SCORE: Record<number, string[]> = {
  5: ['Muy puntual', 'Amable', 'Conducción segura', 'Vehículo limpio', 'Comunicativo'],
  4: ['Buen viaje', 'Amable', 'Puntual', 'Seguro'],
  3: ['Viaje normal', 'Podría mejorar'],
  2: ['Impuntual', 'Poco amable', 'Conducción brusca'],
  1: ['Muy impuntual', 'Irrespetuoso', 'Conducción peligrosa'],
};

const DRIVER_TAGS_BY_SCORE: Record<number, string[]> = {
  5: ['Excelente pasajero', 'Muy puntual', 'Respetuoso'],
  4: ['Buen pasajero', 'Puntual', 'Respetuoso'],
  3: ['Pasajero normal'],
  2: ['Impuntual', 'Poco respetuoso'],
  1: ['Muy impuntual', 'Irrespetuoso'],
};

interface RatedUser { id: string; name: string; role: 'driver' | 'passenger'; }

interface Props {
  visible: boolean;
  ratedUser: RatedUser | null;
  onSubmit: (score: number, comment: string | null) => void;
  onSkip: () => void;
  loading?: boolean;
}

export default function RatingModal({ visible, ratedUser, onSubmit, onSkip, loading }: Props) {
  const { colors, isDark } = useAppTheme();
  const [score, setScore]       = useState(0);
  const [tags, setTags]         = useState<string[]>([]);
  const [review, setReview]     = useState('');

  const availableTags = score > 0
    ? (ratedUser?.role === 'driver' ? TAGS_BY_SCORE[score] : DRIVER_TAGS_BY_SCORE[score]) ?? []
    : [];

  const toggleTag = (t: string) =>
    setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = () => {
    if (score === 0) return;
    const parts = [...tags];
    if (review.trim()) parts.push(review.trim());
    onSubmit(score, parts.length > 0 ? parts.join(' · ') : null);
    reset();
  };

  const reset = () => { setScore(0); setTags([]); setReview(''); };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent>
      <BlurView intensity={25} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill}>
        <KeyboardAvoidingView
          style={s.flex1}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
        <View style={s.backdrop}>
          {/* Tap above the sheet to dismiss the keyboard */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={s.flex1} />
          </TouchableWithoutFeedback>
          <View style={[s.sheet, { backgroundColor: isDark ? '#1c1c1e' : '#f8f8f8' }]}>
            <View style={s.handle} />

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              contentContainerStyle={s.scrollContent}
            >
            <Text style={[s.title, { color: colors.textPrimary }]}>Califica tu experiencia</Text>
            {ratedUser && (
              <Text style={[s.subtitle, { color: colors.textSecondary }]}>
                {ratedUser.role === 'driver' ? 'Conductor: ' : 'Pasajero: '}{ratedUser.name}
              </Text>
            )}

            {/* Stars */}
            <View style={s.stars}>
              {[1, 2, 3, 4, 5].map(s_ => (
                <Pressable key={s_} onPress={() => { setScore(s_); setTags([]); }} hitSlop={8}>
                  <Ionicons
                    name={s_ <= score ? 'star' : 'star-outline'}
                    size={40}
                    color={s_ <= score ? '#f4c430' : '#ccc'}
                  />
                </Pressable>
              ))}
            </View>

            {score > 0 && (
              <Text style={[s.scoreLabel, { color: colors.textSecondary }]}>
                {['', 'Muy malo', 'Malo', 'Regular', 'Bueno', 'Excelente'][score]}
              </Text>
            )}

            {/* Tag chips */}
            {availableTags.length > 0 && (
              <View style={s.tags}>
                {availableTags.map(t => {
                  const selected = tags.includes(t);
                  return (
                    <Pressable
                      key={t}
                      style={[
                        s.chip,
                        {
                          backgroundColor: selected
                            ? Brand.colors.green.normal
                            : (isDark ? '#2c2c2e' : '#e8e8e8'),
                          borderWidth: 1,
                          borderColor: selected
                            ? Brand.colors.green.normal
                            : (isDark ? '#3a3a3c' : '#d8d8d8'),
                        },
                      ]}
                      onPress={() => toggleTag(t)}
                    >
                      <Text style={[s.chipText, { color: selected ? '#fff' : colors.textPrimary }]}>{t}</Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {/* Review text */}
            {score > 0 && (
              <TextInput
                style={[s.input, { color: colors.inputText, borderColor: colors.border, backgroundColor: colors.inputBg }]}
                placeholder="Deja una reseña (opcional)"
                placeholderTextColor={colors.textPlaceholder}
                value={review}
                onChangeText={setReview}
                maxLength={300}
                multiline
              />
            )}

            <View style={s.actions}>
              <Pressable style={[s.btn, { borderColor: colors.border, borderWidth: 1 }]} onPress={() => { reset(); onSkip(); }}>
                <Text style={[s.btnText, { color: colors.textSecondary }]}>Omitir</Text>
              </Pressable>
              <Pressable
                style={[s.btn, { backgroundColor: score > 0 ? Brand.colors.green.normal : colors.border }, loading && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={score === 0 || loading}
              >
                <Text style={[s.btnText, { color: '#fff' }]}>Enviar calificación</Text>
              </Pressable>
            </View>
            </ScrollView>
          </View>
        </View>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
}

const s = StyleSheet.create({
  flex1: { flex: 1 },
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  scrollContent: {
    paddingHorizontal: 20, paddingBottom: 40, gap: 14,
  },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: '#ccc', alignSelf: 'center', marginBottom: 4 },
  title: { fontFamily: Fonts.headingHeavy, fontSize: 22, textAlign: 'center' },
  subtitle: { fontFamily: Fonts.sans, fontSize: 14, textAlign: 'center' },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  scoreLabel: { fontFamily: Fonts.heading, fontSize: 14, textAlign: 'center' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20,
  },
  chipText: { fontFamily: Fonts.heading, fontSize: 12 },
  input: {
    borderWidth: 1, borderRadius: 12, padding: 12,
    fontFamily: Fonts.sans, fontSize: 13, minHeight: 70, textAlignVertical: 'top',
  },
  actions: { flexDirection: 'row', gap: 10 },
  btn: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  btnText: { fontFamily: Fonts.headingBold, fontSize: 14 },
});
