import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Modal, Pressable, Text, TextInput, View } from 'react-native';

import ExpiryInput from '@/components/shared/expiry-input';
import GlassCard from '@/components/shared/glass-card';
import { Brand, Fonts } from '@/constants/theme';
import { usePaymentMethods } from '@/hooks/use-payment-methods';
import { useAppTheme } from '@/hooks/use-app-theme';
import { simBehaviorLabel } from '@/services/api';
import { makeStyles } from '../../styles/tabs/profile.styles';

type ProfileStyles = ReturnType<typeof makeStyles>;
type AppColors = ReturnType<typeof useAppTheme>['colors'];

// Formats card number digits into groups of 4: "4242 4242 4242 4242"
function formatCardNumber(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 16);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}

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
    cardNumber, setCardNumber,
    cardExpiry, setCardExpiry,
    cardCvv, setCardCvv,
    cardholderName, setCardholderName,
    addingMethod, deletingMethodId, togglingFavId,
    handleAddSimpleMethod, handleAddCard, handleDeleteMethod, handleSetFavorite,
  } = usePaymentMethods(token);

  const closeSheet = () => {
    setShowAddMethod(false);
    setAddMethodType(null);
    setNewAlias('');
  };

  const inputStyle = {
    backgroundColor: colors.inputBg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    fontFamily: Fonts.sans,
    color: colors.textPrimary,
    fontSize: 14,
  };

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
                    {(() => {
                      const warning = m.type === 'card' ? simBehaviorLabel(m.simBehavior) : null;
                      return warning ? (
                        <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: warning.color }}>
                          {warning.text}
                        </Text>
                      ) : (
                        <Text style={styles.itemDesc}>
                          {m.type === 'card' && m.expiryMonth && m.expiryYear
                            ? `Vence ${String(m.expiryMonth).padStart(2, '0')}/${m.expiryYear}`
                            : m.type === 'sinpe' ? 'SINPE Móvil' : 'Efectivo'}
                        </Text>
                      );
                    })()}
                  </View>
                  <Pressable
                    onPress={() => handleSetFavorite(m.id)}
                    disabled={m.isFavorite || togglingFavId === m.id || (m.type === 'card' && simBehaviorLabel(m.simBehavior) !== null)}
                    hitSlop={8}
                    style={{ padding: 4, opacity: (m.type === 'card' && simBehaviorLabel(m.simBehavior) !== null) ? 0.3 : 1 }}
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
        onRequestClose={closeSheet}
      >
        <View style={{ flex: 1, backgroundColor: '#00000088', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: isDark ? '#1a1a1a' : '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 }}>
            <Text style={{ fontFamily: Fonts.headingBold, fontSize: 17, color: colors.textPrimary, marginBottom: 16 }}>
              {addMethodType
                ? (addMethodType === 'card' ? 'Agregar tarjeta' : addMethodType === 'sinpe' ? 'Agregar SINPE Móvil' : 'Agregar efectivo')
                : 'Tipo de método'}
            </Text>

            {/* ── Type selector ── */}
            {!addMethodType && (
              <View style={{ gap: 10 }}>
                {paymentMethods.filter((m) => m.type === 'card').length < 3 && (
                  <Pressable
                    onPress={() => setAddMethodType('card')}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                  >
                    <Ionicons name="card-outline" size={20} color={Brand.colors.green.normal} />
                    <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>Tarjeta de crédito/débito</Text>
                  </Pressable>
                )}
                <Pressable
                  onPress={() => setAddMethodType('sinpe')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                >
                  <Ionicons name="phone-portrait-outline" size={20} color={Brand.colors.green.normal} />
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>SINPE Móvil</Text>
                </Pressable>
                <Pressable
                  onPress={() => setAddMethodType('cash')}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}
                >
                  <Ionicons name="cash-outline" size={20} color={Brand.colors.green.normal} />
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textPrimary }}>Efectivo</Text>
                </Pressable>
                <Pressable onPress={closeSheet} style={{ padding: 14, alignItems: 'center' }}>
                  <Text style={{ fontFamily: Fonts.sans, color: colors.textMuted }}>Cancelar</Text>
                </Pressable>
              </View>
            )}

            {/* ── SINPE / Cash form ── */}
            {(addMethodType === 'sinpe' || addMethodType === 'cash') && (
              <View style={{ gap: 12 }}>
                <TextInput
                  value={newAlias}
                  onChangeText={setNewAlias}
                  placeholder={addMethodType === 'sinpe' ? 'Alias (ej. Mi SINPE)' : 'Alias (ej. Efectivo)'}
                  placeholderTextColor={colors.textMuted}
                  style={inputStyle}
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

            {/* ── Card form ── */}
            {addMethodType === 'card' && (
              <View style={{ gap: 12 }}>
                <TextInput
                  value={cardNumber}
                  onChangeText={(t) => setCardNumber(formatCardNumber(t))}
                  placeholder="Número de tarjeta"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="numeric"
                  maxLength={19}
                  style={inputStyle}
                />
                <TextInput
                  value={cardholderName}
                  onChangeText={setCardholderName}
                  placeholder="Nombre del titular"
                  placeholderTextColor={colors.textMuted}
                  autoCapitalize="characters"
                  style={inputStyle}
                />
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <ExpiryInput
                      value={cardExpiry}
                      onChangeText={setCardExpiry}
                      placeholder="MM/AA"
                    />
                  </View>
                  <TextInput
                    value={cardCvv}
                    onChangeText={setCardCvv}
                    placeholder="CVV"
                    placeholderTextColor={colors.textMuted}
                    keyboardType="numeric"
                    maxLength={4}
                    secureTextEntry
                    style={[inputStyle, { flex: 1 }]}
                  />
                </View>

                <View style={{ backgroundColor: colors.inputBg, borderRadius: 10, padding: 10, flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Ionicons name="information-circle-outline" size={14} color={colors.textMuted} style={{ marginTop: 1 }} />
                  <Text style={{ fontFamily: Fonts.sans, fontSize: 11, color: colors.textMuted, flex: 1 }}>
                    Modo simulación. Usa 4242 4242 4242 4242 para pago exitoso o 4000 0000 0000 0002 para pago rechazado.
                  </Text>
                </View>

                <Pressable
                  onPress={handleAddCard}
                  disabled={addingMethod}
                  style={{ backgroundColor: Brand.colors.green.normal, borderRadius: 12, padding: 14, alignItems: 'center', opacity: addingMethod ? 0.6 : 1 }}
                >
                  {addingMethod ? <ActivityIndicator color="#fff" /> : <Text style={{ fontFamily: Fonts.headingBold, color: '#fff' }}>Guardar tarjeta</Text>}
                </Pressable>
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
