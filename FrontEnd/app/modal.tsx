import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import GlassCard from '@/components/shared/glass-card';
import { Brand, Fonts } from '@/constants/theme';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <GlassCard style={styles.card} intensity={36}>
        <Text style={styles.title}>Jalemos</Text>
        <Text style={styles.subtitle}>Esta vista modal usa el mismo lenguaje visual del resto de la app.</Text>

        <Link href="/" dismissTo asChild>
          <Pressable style={styles.link}>
            <Text style={styles.linkText}>Volver al inicio</Text>
          </Pressable>
        </Link>
      </GlassCard>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: Brand.grid.margin,
    backgroundColor: Brand.colors.black.b3,
  },
  card: {
    padding: 18,
    gap: 12,
  },
  title: {
    color: Brand.colors.black.b10,
    fontSize: 26,
    fontFamily: Fonts.headingHeavy,
  },
  subtitle: {
    color: Brand.colors.black.b8,
    fontSize: 14,
    fontFamily: Fonts.sans,
  },
  link: {
    marginTop: 4,
    paddingVertical: 13,
    borderRadius: Brand.radius[12],
    backgroundColor: Brand.colors.green.normal,
    alignItems: 'center',
  },
  linkText: {
    color: Brand.colors.black.b1,
    fontSize: 14,
    fontFamily: Fonts.headingBold,
  },
});
