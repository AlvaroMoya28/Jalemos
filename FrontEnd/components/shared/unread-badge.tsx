// Small unread-count pill, positioned at the top-right of a bell/icon button.
// Renders nothing when count is 0. Shows "9+" past 9. Shared across screens (E0-1).

import { StyleSheet, Text, View } from 'react-native';

export default function UnreadBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <View style={styles.badge} pointerEvents="none">
      <Text style={styles.text}>{count > 9 ? '9+' : String(count)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 3,
    borderRadius: 8,
    backgroundColor: '#e5484d',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 13,
  },
});
