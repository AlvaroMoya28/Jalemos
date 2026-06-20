// Reviewer controls for an editable application: issue checklist + free-text notes.

import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import GlassCard from '@/components/shared/glass-card';
import { Brand } from '@/constants/theme';
import { REVIEW_ISSUES } from '@/constants/mock-applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/app/application-detail.styles';

export default function ApplicationReviewForm({ selectedIssues, onToggleIssue, notes, onChangeNotes, styles, colors }: {
  selectedIssues: string[];
  onToggleIssue: (id: string) => void;
  notes: string;
  onChangeNotes: (text: string) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  return (
    <Animated.View entering={FadeInDown.duration(200).delay(200)}>
      <GlassCard style={styles.card} intensity={32}>
        <Text style={styles.sectionLabel}>Problemas encontrados</Text>
        {REVIEW_ISSUES.map((issue) => {
          const selected = selectedIssues.includes(issue.id);
          return (
            <Pressable key={issue.id} style={styles.issueItem} onPress={() => onToggleIssue(issue.id)}>
              <View style={[styles.checkbox, {
                borderColor: selected ? Brand.colors.green.normal : colors.border,
                backgroundColor: selected ? Brand.colors.green.normal : 'transparent',
              }]}>
                {selected && <Ionicons name="checkmark" size={13} color="#fff" />}
              </View>
              <Text style={styles.issueText}>{issue.label}</Text>
            </Pressable>
          );
        })}

        <View style={styles.divider} />
        <Text style={styles.sectionLabel}>Notas adicionales (opcional)</Text>
        <TextInput
          style={styles.notesInput}
          value={notes}
          onChangeText={onChangeNotes}
          placeholder="Agregá detalles específicos para el solicitante..."
          placeholderTextColor={colors.textPlaceholder}
          multiline
        />
      </GlassCard>
    </Animated.View>
  );
}
