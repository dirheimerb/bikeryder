import { Link } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Field, ScreenTitle } from '@/components/ui';
import { isSupabaseConfigured } from '@/lib/env';
import { supabase } from '@/lib/supabase';
import { colors, font, spacing } from '@/theme';

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (signInError) setError(signInError.message);
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.lg },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brand}>
          <Text style={styles.logo}>bikeryder</Text>
          <Text style={styles.tagline}>Track every ride.</Text>
        </View>

        {!isSupabaseConfigured ? (
          <View style={styles.notice}>
            <Text style={styles.noticeText}>
              Supabase isn’t configured yet. Add EXPO_PUBLIC_SUPABASE_URL and
              EXPO_PUBLIC_SUPABASE_ANON_KEY to a .env file to enable sign in.
            </Text>
          </View>
        ) : null}

        <ScreenTitle>Welcome back</ScreenTitle>

        <View style={styles.form}>
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="you@example.com"
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholder="••••••••"
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Button label="Sign in" onPress={onSignIn} loading={loading} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>New to bikeryder? </Text>
          <Link href="/(auth)/sign-up" style={styles.link}>
            Create an account
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  brand: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  logo: {
    color: colors.primary,
    fontSize: font.size.xl,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  tagline: {
    color: colors.textMuted,
    fontSize: font.size.md,
  },
  form: {
    gap: spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  footerText: {
    color: colors.textMuted,
    fontSize: font.size.sm,
  },
  link: {
    color: colors.primary,
    fontSize: font.size.sm,
    fontWeight: '700',
  },
  error: {
    color: colors.danger,
    fontSize: font.size.sm,
  },
  notice: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: spacing.md,
  },
  noticeText: {
    color: colors.textMuted,
    fontSize: font.size.sm,
    lineHeight: 20,
  },
});
