// Collapsible grouping of applications (used for the Approved / Rejected
// buckets that stay folded by default).

import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { DriverApplication } from '@/contexts/applications';
import { useAppTheme } from '@/hooks/use-app-theme';
import { makeStyles } from '@/styles/tabs/admin-applications.styles';

import ApplicationCard from './application-card';

export default function ApplicationsSection({ title, count, color, apps, onPress, styles, colors }: {
  title: string;
  count: number;
  color: string;
  apps: DriverApplication[];
  onPress: (app: DriverApplication) => void;
  styles: ReturnType<typeof makeStyles>;
  colors: ReturnType<typeof useAppTheme>['colors'];
}) {
  const [open, setOpen] = useState(false);
  if (count === 0) return null;
  return (
    <>
      <Pressable style={styles.sectionHeader} onPress={() => setOpen((v) => !v)}>
        <View style={styles.sectionHeaderLeft}>
          <Ionicons
            name={open ? 'chevron-down' : 'chevron-forward'}
            size={16}
            color={color}
          />
          <Text style={[styles.sectionHeaderTitle, { color }]}>{title}</Text>
          <Text style={styles.sectionHeaderCount}>{count}</Text>
        </View>
      </Pressable>
      {open && (
        <View style={styles.list}>
          {apps.map((app, idx) => (
            <Animated.View key={app.id} entering={FadeInDown.duration(180).delay(idx * 30)}>
              <ApplicationCard app={app} onPress={() => onPress(app)} styles={styles} colors={colors} />
            </Animated.View>
          ))}
        </View>
      )}
    </>
  );
}
