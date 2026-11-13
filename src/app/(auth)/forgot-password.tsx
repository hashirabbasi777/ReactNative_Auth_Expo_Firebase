import { Link } from 'expo-router';
import { useState } from 'react';
import { StyleSheet } from 'react-native';

import { AuthLayout, Banner } from '@/components/AuthLayout';
import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/context/AuthContext';
import { getAuthErrorMessage } from '@/lib/authErrors';
import { validateEmail } from '@/lib/validation';
import { colors } from '@/theme';

export default function ForgotPasswordScreen() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    const emailError = validateEmail(email);
    setError(emailError);
    if (emailError) return;
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (e) {
      setError(getAuthErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Reset password"
      subtitle="We'll email you a link to reset it"
      footer={
        <Link href="/sign-in" replace style={styles.link}>
          ← Back to sign in
        </Link>
      }>
      {sent && (
        <Banner
          type="success"
          message="If an account exists for that email, a reset link is on its way."
        />
      )}
      <TextField
        label="Email"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        error={error}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        returnKeyType="go"
        onSubmitEditing={onSubmit}
      />
      <Button title="Send reset link" onPress={onSubmit} loading={loading} />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  link: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 15,
    textAlign: 'center',
    marginTop: 24,
  },
});
