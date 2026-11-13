import { useEffect, useState } from 'react';
import { AppState, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { colors, radius } from '@/theme';

const PROVIDER_LABELS: Record<string, string> = {
  password: 'Email & password',
  'google.com': 'Google',
};

type Notice = { type: 'error' | 'success'; message: string } | null;

export default function HomeScreen() {
  const { user, signOut, resendVerification, reloadUser } = useAuth();
  const [loading, setLoading] = useState<'signOut' | 'resend' | 'refresh' | null>(null);
  const [notice, setNotice] = useState<Notice>(null);

  const needsVerification = !!user && !user.emailVerified;

  // The user verifies in their mail app, so re-check whenever ours comes back to the foreground.
  useEffect(() => {
    if (!needsVerification) return;
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') reloadUser().catch(() => {});
    });
    return () => sub.remove();
  }, [needsVerification, reloadUser]);

  if (!user) return null;

  const providers =
    user.providerData.map((p) => PROVIDER_LABELS[p.providerId] ?? p.providerId).join(', ') ||
    'Unknown';
  const initial = (user.displayName ?? user.email ?? '?').charAt(0).toUpperCase();

  const run = async (kind: NonNullable<typeof loading>, action: () => Promise<Notice | void>) => {
    setLoading(kind);
    setNotice(null);
    try {
      const result = await action();
      if (result) setNotice(result);
    } catch (e) {
      setNotice({ type: 'error', message: getAuthErrorMessage(e) });
    } finally {
      setLoading(null);
    }
  };

  const onResend = () =>
    run('resend', async () => {
      await resendVerification();
      return { type: 'success', message: `Verification email sent to ${user.email}.` };
    });

  const onRefresh = () =>
    run('refresh', async () => {
      await reloadUser();
      // reloadUser mutates the same User object, so this reads the fresh value.
      return user.emailVerified
        ? { type: 'success', message: 'Your email is verified. Thanks!' }
        : { type: 'error', message: 'Not verified yet. Open the link in the email, then try again.' };
    });

  const onSignOut = () => run('signOut', signOut);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container}>
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
            <Row label="Signed in with" value={providers} />
            <Row label="Email verified" value={user.emailVerified ? 'Yes' : 'No'} />
            {!!user.metadata.creationTime && (
              <Row
                label="Member since"
                value={new Date(user.metadata.creationTime).toLocaleDateString()}
              />
            )}
          </View>
        </View>

        {!!notice && <Banner type={notice.type} message={notice.message} />}

        {needsVerification && (
          <View style={styles.verify}>
            <Text style={styles.verifyTitle}>Verify your email</Text>
            <Text style={styles.verifyText}>
              We sent a verification link to {user.email}. Open it, then come back here. Check your spam
              folder if you can&apos;t find it.
            </Text>
            <Button
              title="I've verified my email"
              onPress={onRefresh}
              loading={loading === 'refresh'}
              disabled={!!loading}
            />
            <View style={styles.gap} />
            <Button
              title="Resend email"
              variant="outline"
              onPress={onResend}
              loading={loading === 'resend'}
              disabled={!!loading}
            />
          </View>
        )}

        <Button
          title="Sign out"
          variant="outline"
          onPress={onSignOut}
          loading={loading === 'signOut'}
          disabled={!!loading}
        />
      </ScrollView>
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
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
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
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10, gap: 12 },
  rowLabel: { color: colors.textMuted },
  rowValue: { color: colors.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  verify: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 20,
    marginBottom: 20,
  },
  verifyTitle: { fontSize: 17, fontWeight: '600', color: colors.text, marginBottom: 6 },
  verifyText: { color: colors.textMuted, lineHeight: 20, marginBottom: 16 },
  gap: { height: 12 },
});
