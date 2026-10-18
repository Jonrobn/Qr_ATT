import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

export default function TabLayout() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
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
  }, [user]);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        headerStyle: { backgroundColor: COLORS.background },
        headerShadowVisible: false,
        headerTintColor: COLORS.textPrimary,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        tabBarStyle: {
          height: 76,
          paddingTop: 9,
          backgroundColor: 'rgba(255, 253, 245, 0.96)',
          borderTopWidth: 1,
          borderTopColor: COLORS.border,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 0,
          elevation: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'home-sharp' : 'home-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
      

      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          href: role === 'teacher' ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'time' : 'time-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.scanButton}>
              <Ionicons
                name={focused ? 'qr-code' : 'qr-code-outline'}
                color={COLORS.textOnPrimary}
                size={28}
              />
            </View>
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          href: role === 'student' || role === 'teacher' ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="teacher"
        options={{
          title: 'Teacher',
          href: role === 'teacher' ? undefined : null,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'clipboard' : 'clipboard-outline'}
              color={color}
              size={24}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  scanButton: {
    width: 75,
    height: 75,
    borderRadius: 75 / 2,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.card,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: -60,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 3, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 0,
    elevation: 7,
  },
});