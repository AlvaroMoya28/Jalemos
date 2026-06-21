// Passenger payment-methods section + "add method" bottom sheet (extracted from the
// profile screen). State/actions come from usePaymentMethods.

import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { Brand, Fonts } from '@/constants/theme';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '../../styles/tabs/profile.styles';

type ProfileStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

export default function PaymentMethodsSection({ token, isDark, styles, colors }: {
  token: string | null;
  isDark: boolean;
  styles: ProfileStyles;
  colors: AppColors;
}) {
  const {
    paymentMethods, methodsLoading,
    showAddMethod, setShowAddMethod,
    addMethodType, setAddMethodType,
    newAlias, setNewAlias,
    addingMethod, deletingMethodId, togglingFavId,
    handleAddSimpleMethod, handleDeleteMethod, handleSetFavorite,
  } = usePaymentMethods(token);

  return (
    <>
      <View style={styles.sectionWrap}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Métodos de pago</Text>
          {paymentMethods.length < 3 && (
            <Pressable onPress={() => setShowAddMethod(true)} hitSlop={8}>
              <Ionicons name="add-circle-outline" size={22} color={Brand.colors.green.normal} />
            </Pressable>
          )}
        </View>
        <GlassCard style={styles.sectionCard}>
          {methodsLoading ? (
            <ActivityIndicator color={Brand.colors.green.normal} style={{ paddingVertical: 16 }} />
          ) : paymentMethods.length === 0 ? (
            <Pressable style={styles.sectionItem} onPress={() => setShowAddMethod(true)}>
              <View style={styles.itemIconWrap}>
                <Ionicons name="card-outline" size={16} color={Brand.colors.green.darkActive} />
              </View>
              <View style={styles.itemTextWrap}>
                <Text style={styles.itemLabel}>Sin métodos de pago</Text>
                <Text style={styles.itemDesc}>Toca + para agregar uno</Text>
              </View>
            </Pressable>
          ) : (
            paymentMethods.map((m, idx) => (
              <View key={m.id}>
                {idx > 0 && <View style={styles.sectionDivider} />}
                <View style={[styles.sectionItem, { paddingVertical: 12 }]}>
                  <View style={styles.itemIconWrap}>
                    <Ionicons
                      name={m.type === 'card' ? 'card-outline' : m.type === 'sinpe' ? 'phone-portrait-outline' : 'cash-outline'}
                      size={16}
                      color={Brand.colors.green.darkActive}
                    />
                  </View>
                  <View style={styles.itemTextWrap}>
                    <Text style={styles.itemLabel}>{m.alias}</Text>
                    <Text style={styles.itemDesc}>
                      {m.type === 'card' && m.expiryMonth && m.expiryYear
                        ? `Vence ${String(m.expiryMonth).padStart(2, '0')}/${m.expiryYear}`
                        : m.type === 'sinpe' ? 'SINPE Móvil' : 'Efectivo'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => handleSetFavorite(m.id)}
                    disabled={m.isFavorite || togglingFavId === m.id}
                    hitSlop={8}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name={m.isFavorite ? 'star' : 'star-outline'} size={16} color={m.isFavorite ? '#f7a900' : colors.textMuted} />
                  </Pressable>
                  <Pressable
                    onPress={() => handleDeleteMethod(m.id)}
                    disabled={deletingMethodId === m.id}
                    hitSlop={8}
                    style={{ padding: 4, marginLeft: 4, opacity: deletingMethodId === m.id ? 0.4 : 1 }}
                  >
                    <Ionicons name="trash-outline" size={15} color={Brand.colors.alerts.error} />
                  </Pressable>
                </View>
              </View>
            ))
          )}
        </GlassCard>
      </View>

      <Modal
        visible={showAddMethod}
        transparent
        animationType="slide"
        onRequestClose={() => { setShowAddMethod(false); setAddMethodType(null); setNewAlias(''); }}
      >
        <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: Fonts.headingBold, fontSize: 17, color: colors.textPrimary, marginBottom: 16 }}>
              {addMethodType ? (addMethodType === 'card' ? 'Agregar tarjeta' : addMethodType === 'sinpe' ? 'Agregar SINPE Móvil' : 'Agregar efectivo') : 'Tipo de método'}
            </Text>

            {!addMethodType && (
              <View style={{ gap: 10 }}>
                {paymentMethods.filter((m) => m.type === 'card').length < 3 && (
                  <Pressable onPress={() => setAddMethodType('card')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: colors.inputBg }}>
                    <Ionicons name="card-outline" size={20} color={Brand.colors.green.normal} />
                    <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>Tarjeta de crédito/débito</Text>
                  </Pressable>
                )}
                <Pressable onPress={() => setAddMethodType('sinpe')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: colors.inputBg }}>
                  <Ionicons name="phone-portrait-outline" size={20} color={Brand.colors.green.normal} />
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>SINPE Móvil</Text>
                </Pressable>
                <Pressable onPress={() => setAddMethodType('cash')} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, backgroundColor: colors.inputBg }}>
                  <Ionicons name="cash-outline" size={20} color={Brand.colors.green.normal} />
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>Efectivo</Text>
                </Pressable>
                <Pressable onPress={() => setShowAddMethod(false)} style={{ padding: 14, alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textMuted }}>Cancelar</Text>
                </Pressable>
              </View>
            )}

            {(addMethodType === 'sinpe' || addMethodType === 'cash') && (
              <View style={{ gap: 12 }}>
                <TextInput
                  value={newAlias}
                  onChangeText={setNewAlias}
                  placeholder={addMethodType === 'sinpe' ? 'Alias (ej. Mi SINPE)' : 'Alias (ej. Efectivo)'}
                  placeholderTextColor={colors.textMuted}
                  style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 12, fontFamily: Fonts.sans, color: colors.textPrimary }}
                />
                <Pressable
                  onPress={handleAddSimpleMethod}
                  disabled={addingMethod}
                  style={{ backgroundColor: Brand.colors.green.normal, borderRadius: 12, padding: 14, alignItems: 'center', opacity: addingMethod ? 0.6 : 1 }}
                >
                  {addingMethod ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: Fonts.headingBold, color: '#fff' }}>Guardar</Text>}
                </Pressable>
                <Pressable onPress={() => setAddMethodType(null)} style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textMuted }}>Volver</Text>
                </Pressable>
              </View>
            )}

            {addMethodType === 'card' && (
              <View style={{ gap: 12 }}>
                <View style={{ backgroundColor: colors.inputBg, borderRadius: 12, padding: 16, alignItems: 'center', gap: 8 }}>
                  <Ionicons name="card-outline" size={28} color={colors.textMuted} />
                  <Text style={{ fontFamily: Fonts.headingBold, fontSize: 14, color: colors.textPrimary, textAlign: 'center' }}>
                    Tarjetas disponibles próximamente
                  </Text>
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 12, color: colors.textMuted, textAlign: 'center' }}>
                    Esta función requiere la versión nativa de la app.
                  </Text>
                </View>
                <Pressable onPress={() => setAddMethodType(null)} style={{ padding: 12, alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textMuted }}>Volver</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </>
  );
}
