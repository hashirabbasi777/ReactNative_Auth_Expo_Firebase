import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { colors, radius } from '@/theme';

export default function HomeScreen() {
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!user) return null;

  const provider = user.providerData[0]?.providerId === 'google.com' ? 'Google' : 'Email & password';
  const initial = (user.displayName ?? user.email ?? '?').charAt(0).toUpperCase();

  const onSignOut = async () => {
    setLoading(true);
    try {
      await signOut();
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.heading}>You&apos;re signed in 🎉</Text>

        <View style={styles.card}>
          {user.photoURL ? (
            <Image source={{ uri: user.photoURL }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.avatarFallback]}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
          )}
          <Text style={styles.name}>{user.displayName ?? 'No name set'}</Text>
          <Text style={styles.email}>{user.email}</Text>

          <View style={styles.meta}>
            <Row label="Provider" value={provider} />
            <Row label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} />
          </View>
        </View>

        {!user.emailVerified && provider !== 'Google' && (
          <Banner type="success" message="We sent a verification link to your email." />
        )}

        <Button title="Sign out" variant="outline" onPress={onSignOut} loading={loading} />
      </View>
    </SafeAreaView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: 24, justifyContent: 'center' },
  heading: { fontSize: 26, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 24 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarFallback: { backgroundColor: '#EEF2FF', alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 32, fontWeight: '700', color: colors.primary },
  name: { fontSize: 20, fontWeight: '600', color: colors.text },
  email: { fontSize: 15, color: colors.textMuted, marginTop: 4 },
  meta: { alignSelf: 'stretch', marginTop: 20, borderTopWidth: 1, borderTopColor: colors.border },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, fontWeight: '500' },
});
