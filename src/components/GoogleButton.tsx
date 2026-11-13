import { StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';

/** "Continue with Google" button with a simple coloured G mark (no image assets needed). */
export function GoogleButton({ onPress, loading }: { onPress: () => void; loading?: boolean }) {
  return (
    <Button
      title="Continue with Google"
      variant="outline"
      onPress={onPress}
      loading={loading}
      icon={
        <View style={styles.badge}>
          <Text style={styles.g}>G</Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  g: { fontSize: 17, fontWeight: '800', color: '#4285F4' },
});
