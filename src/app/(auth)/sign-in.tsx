import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import { AuthLayout, Banner, Divider } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { GoogleButton } from '@/components/GoogleButton';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { validateEmail } from '@/lib/validation';
import { colors } from '@/theme';

export default function SignInScreen() {
  const { signIn, signInWithGoogle } = useAuth();
  const passwordRef = useRef<TextInputInstance>(null);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string | null; password?: string | null }>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);

  const onSubmit = async () => {
    const next = {
      email: validateEmail(email),
      password: password ? null : 'Password is required.',
    };
    setErrors(next);
    setFormError(null);
    if (next.email || next.password) return;

    setLoading('email');
    try {
      await signIn(email, password);
      // Navigation happens automatically via the protected route guard.
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  const onGoogle = async () => {
    setFormError(null);
    setLoading('google');
    try {
      await signInWithGoogle();
    } catch (e) {
      setFormError(getAuthErrorMessage(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue"
      footer={
        <View style={styles.footer}>
          <Text style={styles.muted}>Don&apos;t have an account? </Text>
          <Link href="/sign-up" replace style={styles.link}>
            Sign up
          </Link>
        </View>
      }>
      {!!formError && <Banner message={formError} />}

      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => passwordRef.current?.focus()}
      />
      <TextField
        ref={passwordRef}
        label="Password"
        placeholder="Your password"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="current-password"
        textContentType="password"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Link href="/forgot-password" style={[styles.link, styles.forgot]}>
        Forgot password?
      </Link>

      <Button title="Sign in" onPress={onSubmit} loading={loading === 'email'} disabled={!!loading} />
      <Divider />
      <GoogleButton onPress={onGoogle} loading={loading === 'google'} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 15 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15 },
  forgot: { alignSelf: 'flex-end', marginBottom: 20, marginTop: -4 },
});
