import { Redirect, Stack, useSegments } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';

export default function RootLayout() {
  const { session, loading } = useAuth();
  const segments = useSegments();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <PaperBackground />
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const path = segments?.[0];
  const inAuthGroup = path === 'login' || path === 'register' || path === 'forgot-password';
  const inTabsGroup = path === '(tabs)';

  if (!session && inTabsGroup) {
    return <Redirect href="/login" />;
  }

  if (session && inAuthGroup) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
