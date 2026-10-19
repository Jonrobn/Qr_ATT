import { supabase } from './supabase';

export type Event = {
  eventId: string;
  title: string;
  start: string;
  end: string;
};

export type CloudEvent = {
  id: string;
  event_code: string;
  title: string;
  start_time: string | null;
  end_time: string | null;
  created_by: string | null;
  created_at: string;
};

type EventSaveResult = {
  error: string | null;
  duplicate: boolean;
};

export async function createEvent(
  event: Event
): Promise<EventSaveResult> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from('events').insert({
    event_code: event.eventId,
    title: event.title,
    start_time: event.start || null,
    end_time: event.end || null,
    created_by: user?.id ?? null,
  });

  return {
    error: error?.code === '23505' ? null : error?.message ?? null,
    duplicate: error?.code === '23505',
  };
}

export async function updateEvent(
  currentEventCode: string,
  event: Event
): Promise<EventSaveResult> {
  const { error } = await supabase
    .from('events')
    .update({
      event_code: event.eventId,
      title: event.title,
      start_time: event.start || null,
      end_time: event.end || null,
    })
    .eq('event_code', currentEventCode);

  return {
    error: error?.code === '23505' ? null : error?.message ?? null,
    duplicate: error?.code === '23505',
  };
}

export async function getEventsByTeacher(
  teacherId: string
): Promise<CloudEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('created_by', teacherId)
    .order('created_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as CloudEvent[];
}

export async function getEventsToAttend(
  studentId: string
): Promise<CloudEvent[]> {
  const { data: events, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .order('start_time', { ascending: true });

  if (eventsError || !events) {
    return [];
  }

  const { data: attendance, error: attendanceError } = await supabase
    .from('attendance')
    .select('event_id')
    .eq('student_id', studentId);

  if (attendanceError || !attendance) {
    return [];
  }

  const attendedEventIds = attendance.map((record) => record.event_id);
  const currentTime = Date.now();

  return (events as CloudEvent[]).filter((event) => {
    const eventHasNotEnded =
      !event.end_time || new Date(event.end_time).getTime() > currentTime;
    const studentHasNotAttended = !attendedEventIds.includes(event.id);

    return eventHasNotEnded && studentHasNotAttended;
  });
}

export async function getEventByCode(code: string): Promise<CloudEvent | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('event_code', code)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data as CloudEvent;
}
