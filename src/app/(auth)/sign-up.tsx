import { Link } from 'expo-router';
import { useRef, useState } from 'react';
import { StyleSheet, Text, type TextInputInstance, View } from 'react-native';

import { AuthLayout, Banner, Divider } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { GoogleButton } from '@/components/GoogleButton';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { validateEmail, validatePassword } from '@/lib/validation';
import { colors } from '@/theme';

type FieldErrors = Partial<Record<'name' | 'email' | 'password' | 'confirm', string | null>>;

export default function SignUpScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const emailRef = useRef<TextInputInstance>(null);
  const passwordRef = useRef<TextInputInstance>(null);
  const confirmRef = useRef<TextInputInstance>(null);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [loading, setLoading] = useState<'email' | 'google' | null>(null);

  const onSubmit = async () => {
    const next: FieldErrors = {
      name: name.trim() ? null : 'Name is required.',
      email: validateEmail(email),
      password: validatePassword(password),
      confirm: confirm === password ? null : 'Passwords do not match.',
    };
    setErrors(next);
    setFormError(null);
    if (Object.values(next).some(Boolean)) return;

    setLoading('email');
    try {
      await signUp(name, email, password);
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
      title="Create account"
      subtitle="Sign up to get started"
      footer={
        <View style={styles.footer}>
          <Text style={styles.muted}>Already have an account? </Text>
          <Link href="/sign-in" replace style={styles.link}>
            Sign in
          </Link>
        </View>
      }>
      {!!formError && <Banner message={formError} />}

      <TextField
        label="Full name"
        placeholder="Jane Doe"
        value={name}
        onChangeText={setName}
        error={errors.name}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        returnKeyType="next"
        onSubmitEditing={() => emailRef.current?.focus()}
      />
      <TextField
        ref={emailRef}
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
        placeholder="At least 8 characters"
        value={password}
        onChangeText={setPassword}
        error={errors.password}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="next"
        onSubmitEditing={() => confirmRef.current?.focus()}
      />
      <TextField
        ref={confirmRef}
        label="Confirm password"
        placeholder="Re-enter password"
        value={confirm}
        onChangeText={setConfirm}
        error={errors.confirm}
        secure
        autoCapitalize="none"
        autoComplete="new-password"
        textContentType="newPassword"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />

      <Button
        title="Create account"
        onPress={onSubmit}
        loading={loading === 'email'}
        disabled={!!loading}
      />
      <Divider />
      <GoogleButton onPress={onGoogle} loading={loading === 'google'} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 24 },
  muted: { color: colors.textMuted, fontSize: 15 },
  link: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
