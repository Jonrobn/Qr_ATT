import { useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import { Link } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { sendPasswordResetEmail } from '@/lib/auth';

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSendResetEmail = async () => {
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }

    setLoading(true);

    try {
      const redirectTo = Linking.createURL('reset-password');
      const { error: authError } = await sendPasswordResetEmail(
        email.trim(),
        redirectTo
      );

      if (authError) {
        setError(authError.message);
      } else {
        setSuccess(true);
      }
    } catch (err: any) {
      setError(err?.message || 'Unexpected error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <PaperBackground />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.headerContainer}>
              <Header title="QR Attendance" />
            </View>

            {success ? (
              <View style={styles.messageContainer}>
                <Text style={styles.title}>Check your email</Text>
                <Text style={styles.subtitle}>
                  If an account exists for {email.trim()}, a password reset link
                  has been sent.
                </Text>
                <Link href="/login" style={styles.link}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Forgot Password?</Text>
                <Text style={styles.subtitle}>
                  Enter your account email and we will send you a reset link.
                </Text>

                <View style={styles.form}>
                  <Text style={styles.label}>Email</Text>
                  <TextInput
                    style={styles.input}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="your.email@school.edu"
                    placeholderTextColor={COLORS.textSecondary}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!loading}
                  />

                  {error && <Text style={styles.error}>{error}</Text>}

                  {loading ? (
                    <ActivityIndicator
                      size="large"
                      color={COLORS.primary}
                      style={styles.loader}
                    />
                  ) : (
                    <View style={styles.buttonContainer}>
                      <AppButton
                        theme="primary"
                        title="Send Reset Link"
                        icon="mail-outline"
                        onPress={handleSendResetEmail}
                      />
                    </View>
                  )}
                </View>

                <Link href="/login" style={styles.link}>
                  Back to Sign In
                </Link>
              </>
            )}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  keyboardView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 40,
  },

  headerContainer: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 24,
  },

  title: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },

  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
    marginBottom: 24,
    textAlign: 'center',
  },

  form: {
    marginBottom: 24,
  },

  buttonContainer: {
    marginTop: 16,
  },

  label: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    marginTop: 14,
    letterSpacing: 0.5,
  },

  input: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: COLORS.textPrimary,
  },

  error: {
    fontSize: 14,
    color: COLORS.danger,
    marginTop: 12,
    marginBottom: 4,
  },

  loader: {
    marginVertical: 16,
  },

  messageContainer: {
    marginTop: 24,
  },

  link: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    fontWeight: '700',
  },
});