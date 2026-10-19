import Ionicons from '@expo/vector-icons/Ionicons';
import DateTimePicker, {
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useState } from 'react';
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useFocusEffect } from 'expo-router';

import AppButton from '@/components/AppButton';
import PaperBackground from '@/components/PaperBackground';
import { COLORS } from '@/constants/colors';
import { 
  createEvent,
  getEventsByTeacher,
  updateEvent,
  type CloudEvent,
} from '@/lib/events';
import { buildQRPayload } from '@/lib/qr';
import { useAuth } from '@/lib/auth';
import { getProfile, type Role } from '@/lib/profiles';

function formatDateTime(date: Date) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const month = date.toLocaleString('en-US', { month: 'short' });
  const time = date.toLocaleString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${month} ${pad(date.getDate())}, ${date.getFullYear()} at ${time}`;
}

const QUICK_END_OPTIONS = [
  { label: '+30 min', ms: 30 * 60 * 1000 },
  { label: '+1 hour', ms: 60 * 60 * 1000 },
  { label: '+2 hours', ms: 2 * 60 * 60 * 1000 },
];

type EditTarget = 'start' | 'end';

export default function TeacherScreen() {
  const { user } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [savedEvents, setSavedEvents] = useState<CloudEvent[]>([]);
  const [hiddenEventQrs, setHiddenEventQrs] = useState<Record<string, boolean>>({});
  const [currentTime, setCurrentTime] = useState(() => Date.now());

  const [title, setTitle] = useState('');
  const [eventId, setEventId] = useState('');
  const [editingEventCode, setEditingEventCode] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(() => new Date());
  const [endDate, setEndDate] = useState(
    () => new Date(Date.now() + 60 * 60 * 1000)
  );
  const [saving, setSaving] = useState(false);
  const [editTarget, setEditTarget] = useState<EditTarget | null>(null);
  const [editingPart, setEditingPart] = useState<'date' | 'time'>('date');
  const [payload, setPayload] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const isAndroid = Platform.OS === 'android';

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30 * 1000);

    return () => clearInterval(timer);
  }, []);

  const activeEvents = savedEvents.filter((event) => {
    return !event.end_time || new Date(event.end_time).getTime() > currentTime;
  });

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setCurrentTime(Date.now());
      if (!user) {
        setRoleLoading(false);
        return () => {
          active = false;
        };
      }
      getProfile(user.id).then(async (profile) => {
        if (!active) return;
        const currentRole = profile?.role ?? 'student';
        setRole(currentRole);

        if (currentRole === 'teacher') {
          const events = await getEventsByTeacher(user.id);
          if (!active) return;
          setSavedEvents(events);
        } else {
          setSavedEvents([]);
        }

        setRoleLoading(false);
      });
      return () => {
        active = false;
      };
    }, [user])
  );

  const openPicker = (target: EditTarget) => {
    setMessage(null);
    setEditTarget(target);
    setEditingPart('date');
  };

  const onPickerChange = (
    event: DateTimePickerEvent,
    selected?: Date
  ) => {
    if (!editTarget) return;
    if (event.type === 'dismissed' || !selected) {
      setEditTarget(null);
      setEditingPart('date');
      return;
    }

    const current = editTarget === 'start' ? startDate : endDate;
    const next = new Date(current);
    next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
    next.setHours(selected.getHours(), selected.getMinutes(), 0, 0);

    if (editTarget === 'start') setStartDate(next);
    else setEndDate(next);

    if (isAndroid && editingPart === 'date') {
      setEditingPart('time');
    } else {
      setEditTarget(null);
      setEditingPart('date');
    }
  };

  const handleQuickEnd = (ms: number) => {
    setMessage(null);
    setEndDate(new Date(startDate.getTime() + ms));
  };

  const handleEditEvent = (event: CloudEvent) => {
    const start = event.start_time ? new Date(event.start_time) : new Date();

    setEditingEventCode(event.event_code);
    setTitle(event.title);
    setEventId(event.event_code);
    setStartDate(start);
    setEndDate(
      event.end_time
        ? new Date(event.end_time)
        : new Date(start.getTime() + 60 * 60 * 1000)
    );
    setPayload(null);
    setMessage(null);
  };

  const handleCancelEdit = () => {
    setEditingEventCode(null);
    setTitle('');
    setEventId('');
    setStartDate(new Date());
    setEndDate(new Date(Date.now() + 60 * 60 * 1000));
    setPayload(null);
    setMessage(null);
  };

  const handleSaveEvent = async () => {
    const event = {
      eventId: eventId.trim(),
      title: title.trim(),
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };

    if (!event.eventId || !event.title) {
      setMessage('Event title and code are required.');
      return;
    }

    if (endDate.getTime() <= startDate.getTime()) {
      setMessage('End time must be after start time.');
      return;
    }

    setSaving(true);

    try {
      const result = editingEventCode
        ? await updateEvent(editingEventCode, event)
        : await createEvent(event);

      if (result.duplicate) {
        setMessage('That event code already exists. Please use a different code.');
        return;
      }

      if (result.error) {
        setMessage('Could not save the event. Please try again.');
        return;
      }

      setMessage(editingEventCode ? 'Event updated.' : 'Event saved!');
      setPayload(buildQRPayload(event));

      if (user) {
        setSavedEvents(await getEventsByTeacher(user.id));
      }

      if (editingEventCode) {
        setEditingEventCode(null);
        setTitle('');
        setEventId('');
        setStartDate(new Date());
        setEndDate(new Date(Date.now() + 60 * 60 * 1000));
      }
    } catch (error) {
      setMessage('Could not save the event. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (roleLoading) {
    return (
      <View style={styles.center}>
        <PaperBackground />
        <Text style={styles.message}>Checking your account...</Text>
      </View>
    );
  }

  if (role !== 'teacher') {
    return (
      <View style={styles.center}>
        <PaperBackground />
        <Ionicons name="lock-closed-outline" size={48} color={COLORS.textSecondary} />
        <Text style={styles.lockTitle}>Teachers Only</Text>
        <Text style={styles.lockSubtitle}>Only teacher accounts can create events.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screenContainer}>
      <PaperBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
      <Text style={[styles.title, styles.pageTitle]}>
        {editingEventCode ? 'Edit Event' : 'Create Event QR'}
      </Text>
      <Text style={styles.subtitle}>
        {editingEventCode
          ? 'Update the event details and save your changes.'
          : 'Fill in the event details, then scan the generated QR with the Scan tab.'}
      </Text>

      <Text style={styles.label}>Event Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="e.g. Founders Day Assembly"
        placeholderTextColor={COLORS.textSecondary}
        editable={!saving}
      />

      <Text style={styles.label}>Event Code</Text>
      <TextInput
        style={styles.input}
        value={eventId}
        onChangeText={setEventId}
        placeholder="e.g. EVT-2026-0002"
        placeholderTextColor={COLORS.textSecondary}
        autoCapitalize="characters"
        editable={!saving}
      />

      <Text style={styles.label}>Starts</Text>
      <PickerField
        value={formatDateTime(startDate)}
        icon="sunny-outline"
        onPress={() => {
          if (!saving) openPicker('start');
        }}
      />

      <Text style={styles.label}>Ends</Text>
      <PickerField
        value={formatDateTime(endDate)}
        icon="moon-outline"
        onPress={() => {
          if (!saving) openPicker('end');
        }}
      />
      <View style={styles.chipRow}>
        {QUICK_END_OPTIONS.map((option) => (
          <Pressable
            key={option.label}
            style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}
            onPress={() => handleQuickEnd(option.ms)}
            disabled={saving}
          >
            {({ pressed }) => (
              <Text style={[styles.chipText, pressed && styles.chipTextPressed]}>
                {option.label}
              </Text>
            )}
          </Pressable>
        ))}
      </View>
      <Text style={styles.hint}>Tap a chip to set the end time from start.</Text>

      {message && <Text style={styles.message}>{message}</Text>}

      <AppButton
        theme="primary"
        title={editingEventCode ? 'Update Event' : 'Create Event'}
        icon={editingEventCode ? 'save-outline' : 'add-circle-outline'}
        onPress={handleSaveEvent}
        disabled={saving}
      />

      {editingEventCode && (
        <AppButton
          title="Cancel Edit"
          icon="close-outline"
          onPress={handleCancelEdit}
          disabled={saving}
        />
      )}

      {editTarget && (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            value={editTarget === 'start' ? startDate : endDate}
            mode={isAndroid ? editingPart : 'datetime'}
            display={isAndroid ? 'default' : 'spinner'}
            is24Hour={false}
            onChange={onPickerChange}
          />
        </View>
      )}

      {payload && (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>
            Scan this QR code with the Scan tab:
          </Text>
          <View style={styles.qrBox}>
            <QRCode value={payload} size={200} />
          </View>
          <Text style={styles.payloadText}>{payload}</Text>
        </View>
      )}

      <View style={styles.savedEventsSection}>
        <Text style={styles.sectionTitle}>Saved Events</Text>
        {activeEvents.length === 0 ? (
          <Text style={styles.emptyEvents}>No active saved events.</Text>
        ) : (
          activeEvents.map((event) => (
              <View
              key={event.id}
                style={styles.savedEventCard}
            >
                <Pressable
                  style={styles.savedEventDetails}
                  onPress={() => handleEditEvent(event)}
                  accessibilityRole="button"
                  accessibilityLabel={`Edit ${event.title}`}
                >
                <Text style={styles.savedEventTitle}>{event.title}</Text>
                <Text style={styles.savedEventMeta}>{event.event_code}</Text>
                {event.start_time && (
                  <Text style={styles.savedEventMeta}>
                    Starts {formatDateTime(new Date(event.start_time))}
                  </Text>
                )}
                {event.end_time && (
                  <Text style={styles.savedEventMeta}>
                    Ends {formatDateTime(new Date(event.end_time))}
                  </Text>
                )}
              </Pressable>
              <View style={styles.savedEventPreview}>
                {hiddenEventQrs[event.id] !== true && (
                  <View style={styles.savedEventQr}>
                    <QRCode
                      value={buildQRPayload({
                        eventId: event.event_code,
                        title: event.title,
                        start: event.start_time ?? undefined,
                        end: event.end_time ?? undefined,
                      })}
                      size={64}
                    />
                  </View>
                )}
                <View style={styles.savedEventActions}>
                  <Pressable
                    style={styles.savedEventAction}
                    onPress={() =>
                      setHiddenEventQrs((current) => ({
                        ...current,
                        [event.id]: current[event.id] !== true,
                      }))
                    }
                    accessibilityRole="button"
                    accessibilityLabel={`${hiddenEventQrs[event.id] === true ? 'Show' : 'Hide'} QR code for ${event.title}`}
                  >
                    <Ionicons
                      name={hiddenEventQrs[event.id] === true ? 'eye-outline' : 'eye-off-outline'}
                      size={18}
                      color={COLORS.primary}
                    />
                  </Pressable>
                  <Pressable
                    style={styles.savedEventAction}
                    onPress={() => handleEditEvent(event)}
                    accessibilityRole="button"
                    accessibilityLabel={`Edit ${event.title}`}
                  >
                    <Ionicons name="create-outline" size={18} color={COLORS.primary} />
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        )}
      </View>
      </ScrollView>
    </View>
  );
}

type PickerFieldProps = {
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
};

function PickerField({ value, icon, onPress }: PickerFieldProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.pickerField, pressed && styles.pickerFieldPressed]}
      onPress={onPress}
    >
      <Ionicons name={icon} size={20} color={COLORS.primary} />
      <Text style={styles.pickerValue}>{value}</Text>
      <Ionicons name="calendar-outline" size={18} color={COLORS.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 22,
    paddingBottom: 40,
  },
  center: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  lockSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 4,
  },
  pageTitle: {
    marginTop: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
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
  pickerField: {
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerFieldPressed: {
    backgroundColor: COLORS.surface,
  },
  pickerValue: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textPrimary,
    marginHorizontal: 10,
  },
  chipRow: {
    flexDirection: 'row',
    marginTop: 8,
  },
  chip: {
    backgroundColor: COLORS.surface,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: COLORS.accent,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginRight: 8,
  },
  chipPressed: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ translateY: 1 }],
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  chipTextPressed: {
    color: COLORS.textOnPrimary,
  },
  hint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 6,
  },
  savedEventsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  emptyEvents: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  savedEventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
    padding: 14,
    marginBottom: 10,
  },
  savedEventDetails: {
    flex: 1,
    marginRight: 12,
  },
  savedEventPreview: {
    alignItems: 'center',
  },
  savedEventActions: {
    flexDirection: 'row',
  },
  savedEventAction: {
    width: 32,
    height: 32,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 3,
  },
  savedEventQr: {
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
    padding: 5,
    marginBottom: 4,
  },
  savedEventTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 3,
  },
  savedEventMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  pickerContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 12,
  },
  resultCard: {
    backgroundColor: COLORS.card,
    borderRadius: 11,
    padding: 18,
    marginTop: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
    shadowColor: COLORS.shadow,
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 0,
    elevation: 4,
  },
  resultTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  qrBox: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginBottom: 12,
  },
  payloadText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
  },
});
