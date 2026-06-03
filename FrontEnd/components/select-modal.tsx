// Reusable bottom-sheet picker with search and optional "Otro" custom entry.
// Created by Claude Sonnet 4.6 for the Jalemos driver-registration vehicle dropdowns.

import { Brand, Fonts } from '@/constants/theme';
import { useAppTheme } from '@/hooks/use-app-theme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface Props {
  visible: boolean;
  title: string;
  options: string[];
  onSelect: (value: string) => void;
  onClose: () => void;
  /** When true an "Otro (especificar)" row appears at the bottom and calls onSelect('__custom__'). */
  allowCustom?: boolean;
}

export default function SelectModal({ visible, title, options, onSelect, onClose, allowCustom = false }: Props) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [search, setSearch] = useState('');

  const filtered = useMemo(
    () => options.filter(o => o.toLowerCase().includes(search.toLowerCase())),
    [options, search]
  );

  const close = () => { setSearch(''); onClose(); };
  const pick  = (value: string) => { setSearch(''); onSelect(value); };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheet}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <Pressable onPress={close} hitSlop={12}>
              <Ionicons name="close" size={22} color={colors.textPrimary} />
            </Pressable>
          </View>

          <View style={styles.searchWrap}>
            <Ionicons name="search-outline" size={15} color={colors.textMuted} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar..."
              placeholderTextColor={colors.textPlaceholder}
              style={styles.searchInput}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={10}>
                <Ionicons name="close-circle" size={15} color={colors.textMuted} />
              </Pressable>
            )}
          </View>

          <FlatList
            data={filtered}
            keyExtractor={item => item}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [styles.option, pressed && styles.optionPressed]}
                onPress={() => pick(item)}>
                <Text style={styles.optionText}>{item}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
              </Pressable>
            )}
            ListFooterComponent={
              allowCustom ? (
                <Pressable
                  style={({ pressed }) => [styles.option, styles.customOption, pressed && styles.optionPressed]}
                  onPress={() => pick('__custom__')}>
                  <View style={styles.customRow}>
                    <Ionicons name="create-outline" size={16} color={Brand.colors.green.normal} />
                    <Text style={styles.customText}>Otro (especificar)</Text>
                  </View>
                </Pressable>
              ) : null
            }
          />
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function makeStyles(c: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.55)',
      justifyContent: 'flex-end',
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: Brand.radius[24],
      borderTopRightRadius: Brand.radius[24],
      maxHeight: '75%',
      paddingBottom: Platform.OS === 'ios' ? 32 : 16,
    },
    handle: {
      width: 40, height: 4,
      backgroundColor: c.border,
      borderRadius: 99,
      alignSelf: 'center',
      marginTop: 10, marginBottom: 6,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: c.border,
    },
    title: {
      fontSize: 15,
      fontFamily: Fonts.heading,
      color: c.textPrimary,
    },
    searchWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      margin: 12,
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: Brand.radius[12],
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.inputBg,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: Fonts.sans,
      color: c.inputText,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 14,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.border,
    },
    optionPressed: { backgroundColor: c.inputBg },
    optionText: {
      fontSize: 14,
      fontFamily: Fonts.sans,
      color: c.textPrimary,
    },
    customOption: { borderBottomWidth: 0 },
    customRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    customText: {
      fontSize: 14,
      fontFamily: Fonts.heading,
      color: Brand.colors.green.normal,
    },
  });
}
