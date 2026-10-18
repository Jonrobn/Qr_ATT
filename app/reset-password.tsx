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
import { Link, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { signOut, updatePasswordFromReset } from '@/lib/auth';

export default function ResetPasswordScreen() {
  const insets = useSafeAreaInsets();
  const { code } = useLocalSearchParams<{ code?: string }>();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUpdatePassword = async () => {
    setError(null);

    if (!password || !confirmPassword) {
      setError('Please complete both password fields.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const resetCode = Array.isArray(code) ? code[0] : code;
    if (!resetCode) {
      setError('This reset link is invalid. Request a new one.');
      return;
    }

    setLoading(true);

    try {
      const { error: authError } = await updatePasswordFromReset(
        resetCode,
        password
      );

      if (authError) {
        setError(authError.message);
      } else {
        await signOut();
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
                <Text style={styles.title}>Password Updated</Text>
                <Text style={styles.subtitle}>
                  You can now sign in with your new password.
                </Text>
                <Link href="/login" style={styles.link}>
                  Back to Sign In
                </Link>
              </View>
            ) : (
              <>
                <Text style={styles.title}>Create a New Password</Text>
                <Text style={styles.subtitle}>
                  Choose a password with at least 6 characters.
                </Text>

                <View style={styles.form}>
                  <Text style={styles.label}>New Password</Text>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={setPassword}
                    placeholder="At least 6 characters"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
                    editable={!loading}
                  />

                  <Text style={styles.label}>Confirm Password</Text>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    placeholder="Re-enter your password"
                    placeholderTextColor={COLORS.textSecondary}
                    secureTextEntry
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
                        title="Update Password"
                        icon="lock-closed-outline"
                        onPress={handleUpdatePassword}
                      />
                    </View>
                  )}
                </View>
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