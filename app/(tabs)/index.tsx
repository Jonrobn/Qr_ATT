import { useFocusEffect, router } from 'expo-router';
import { useCallback, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

export default function Index() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      if (!user) {
        setRole('student');
        return () => {
          active = false;
        };
      }

      getProfile(user.id).then((profile) => {
        if (active) {
          setRole(profile?.role ?? 'student');
        }
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  return (
    <SafeAreaView style={styles.container}>
      <PaperBackground />
      <View style={styles.headerContainer}>
        <Header title="QR Attendance" />
        <Text style={styles.byLine}>by: John Robin O. Belvestre</Text>
      </View>

      <View style={styles.bodyContainer}>
        <Text style={styles.mainTitle}>School Event Attendance</Text>
        <Text style={styles.subtitle}>
          Scan QR Codes to record attendance during school activities.
        </Text>
      </View>

      <View style={styles.footerContainer}>
        <AppButton
          theme="primary"
          title="Scan QR Code"
          icon="qr-code-outline"
          onPress={() => router.push('/scan')}
        />
        <AppButton
          title="Attendance History"
          icon="time-outline"
          onPress={() => router.push('/history')}
        />
        {role === 'teacher' && (
          <AppButton
            title="Create Event"
            icon="add-circle-outline"
            onPress={() => router.push('/teacher')}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  headerContainer: { flex: 0.92, justifyContent: 'center', paddingHorizontal: 24 },
  byLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', fontWeight: '700', letterSpacing: 0.3 },
  bodyContainer: { marginHorizontal: 20, marginBottom: 18, padding: 18, backgroundColor: COLORS.card, borderWidth: 2, borderColor: COLORS.border, borderRadius: 11, shadowColor: COLORS.shadow, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 0.14, shadowRadius: 0, elevation: 4 },
  mainTitle: {
    fontSize: 25,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 6,
    textAlign: 'left',
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 21,
    textAlign: 'left',
  },
  footerContainer: { flex: 0, paddingHorizontal: 24, width: '100%', paddingTop: 4, paddingBottom: 8 },
});