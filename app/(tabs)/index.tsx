import { useFocusEffect, router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import AppButton from '@/components/AppButton';
import Header from '@/components/Header';
import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { getEventsToAttend, type CloudEvent } from '@/lib/events';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

function formatEventTime(value: string) {
  return new Date(value).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default function Index() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [availableEvents, setAvailableEvents] = useState<CloudEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const eventScrollRef = useRef<ScrollView>(null);
  const { width: screenWidth } = useWindowDimensions();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, []);

  const activeEvents = availableEvents.filter((event) => {
    return !event.end_time || new Date(event.end_time).getTime() > currentTime;
  });
  const eventListKey = activeEvents.map((event) => event.id).join(',');

  useEffect(() => {
    setCurrentEventIndex(0);
    eventScrollRef.current?.scrollTo({ x: 0, animated: false });
  }, [eventListKey]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCurrentTime(Date.now());

      if (!user) {
        setRole('student');
        setAvailableEvents([]);
        setEventsLoading(false);
        return () => {
          active = false;
        };
      }

      setEventsLoading(true);
      getProfile(user.id).then(async (profile) => {
        if (!active) return;

        const currentRole = profile?.role ?? 'student';
        setRole(currentRole);

        if (currentRole === 'student') {
          const events = await getEventsToAttend(user.id);
          if (!active) return;
          setAvailableEvents(events);
        } else {
          setAvailableEvents([]);
        }

        setEventsLoading(false);
      });

      return () => {
        active = false;
      };
    }, [user])
  );

  return (
    <SafeAreaView style={styles.container}>
      <PaperBackground />
      <View
        style={[
          styles.headerContainer,
          role === 'student' && styles.studentHeaderContainer,
        ]}
      >
        <Header title="QR Attendance" />
        <Text style={styles.byLine}>by: John Robin O. Belvestre</Text>
      </View>

      <ScrollView
        style={styles.dashboardScroll}
        contentContainerStyle={styles.dashboardContent}
      >
        {role === 'student' ? (
          <View style={styles.dashboardContainer}>
            <View style={styles.dashboardTitleRow}>
              <Text style={[styles.mainTitle, styles.dashboardTitle]}>
                Events to Attend
              </Text>
              {!eventsLoading && (
                <View style={styles.eventCountBadge}>
                  <Text style={styles.eventCountText}>{activeEvents.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.subtitle}>
              Upcoming and ongoing events you have not attended yet.
            </Text>

            {eventsLoading ? (
              <Text style={styles.emptyMessage}>Loading events...</Text>
            ) : activeEvents.length === 0 ? (
              <Text style={styles.emptyMessage}>No events to attend right now.</Text>
            ) : (
              <>
                <ScrollView
                  ref={eventScrollRef}
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.eventCarousel}
                  onMomentumScrollEnd={({ nativeEvent }) => {
                    const page = Math.round(
                      nativeEvent.contentOffset.x / screenWidth
                    );
                    setCurrentEventIndex(page);
                  }}
                >
                  {activeEvents.map((event) => {
                    const isUpcoming =
                      event.start_time !== null &&
                      new Date(event.start_time).getTime() > currentTime;

                    return (
                      <View key={event.id} style={[styles.eventSlide, { width: screenWidth }]}>
                        <Pressable
                          style={({ pressed }) => [
                            styles.eventCard,
                            pressed && styles.eventCardPressed,
                          ]}
                          onPress={() => router.push('/scan')}
                        >
                          <View style={styles.eventCardHeader}>
                            <Text style={styles.eventTitle}>{event.title}</Text>
                            <View
                              style={[
                                styles.eventStatus,
                                isUpcoming ? styles.upcomingStatus : styles.ongoingStatus,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.eventStatusText,
                                  isUpcoming && styles.upcomingStatusText,
                                ]}
                              >
                                {isUpcoming ? 'Upcoming' : 'Ongoing'}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.eventMeta}>{event.event_code}</Text>
                          {event.start_time && (
                            <Text style={styles.eventMeta}>
                              Starts {formatEventTime(event.start_time)}
                            </Text>
                          )}
                          {event.end_time && (
                            <Text style={styles.eventMeta}>
                              Ends {formatEventTime(event.end_time)}
                            </Text>
                          )}
                          <Text style={styles.eventHint}>Tap to scan attendance</Text>
                        </Pressable>
                      </View>
                    );
                  })}
                </ScrollView>
                <View style={styles.eventIndicators}>
                  {activeEvents.map((event, index) => (
                    <View
                      key={event.id}
                      style={[
                        styles.eventIndicator,
                        index === currentEventIndex && styles.eventIndicatorActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            )}
          </View>
        ) : (
          <View style={styles.bodyContainer}>
            <Text style={styles.mainTitle}>School Event Attendance</Text>
            <Text style={styles.subtitle}>
              Scan QR Codes to record attendance during school activities.
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.footerContainer,
          role === 'student' && styles.studentFooterRaised,
          role === 'teacher' && styles.teacherFooterRaised,
        ]}
      >
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
  studentHeaderContainer: { flex: 0.55 },
  byLine: { fontSize: 12, color: COLORS.textSecondary, marginTop: 8, textAlign: 'center', fontWeight: '700', letterSpacing: 0.3 },
  dashboardScroll: { flex: 1 },
  dashboardContent: { flexGrow: 1, paddingBottom: 8 },
  dashboardContainer: { paddingHorizontal: 20, paddingTop: 19, paddingBottom: 12 },
  dashboardTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  dashboardTitle: { flex: 1, marginBottom: 0 },
  eventCountBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    marginLeft: 10,
  },
  eventCountText: {
    color: COLORS.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  eventCarousel: { marginHorizontal: -20 },
  eventSlide: { paddingHorizontal: 20 },
  eventIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  eventIndicator: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  eventIndicatorActive: {
    backgroundColor: COLORS.primary,
  },
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
  emptyMessage: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 12,
  },
  eventCard: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 14,
    marginTop: 10,
  },
  eventCardPressed: {
    backgroundColor: COLORS.surface,
  },
  eventCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginRight: 8,
  },
  eventMeta: {
    fontSize: 13,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  eventStatus: {
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  upcomingStatus: {
    backgroundColor: COLORS.accent,
  },
  ongoingStatus: {
    backgroundColor: COLORS.success,
  },
  eventStatusText: {
    color: COLORS.textOnPrimary,
    fontSize: 11,
    fontWeight: '700',
  },
  upcomingStatusText: {
    color: COLORS.textPrimary,
  },
  eventHint: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '700',
    marginTop: 8,
  },
  studentFooterRaised: { transform: [{ translateY: -28 }] },
  teacherFooterRaised: { transform: [{ translateY: -28 }] },
  footerContainer: { flex: 0, paddingHorizontal: 24, width: '100%', paddingTop: 4, paddingBottom: 2 },
});