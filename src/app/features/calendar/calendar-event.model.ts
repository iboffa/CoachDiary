export type CalendarEventType =
  | 'game'
  | 'training'
  | 'meeting'
  | 'video-session'
  | 'tournament'
  | 'other'
  | 'season-goal'
  | 'journal'
  | 'task';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: CalendarEventType;
  start_time: string | null;     // "HH:MM" 24-hour, null if not set
  duration_minutes: number | null;
  routerLink: string[] | null;  // null for custom events (use delete instead)
  customEventId?: string;       // set for custom events to enable deletion
  isRecurring?: boolean;
  recurringScheduleId?: string;
  recurringDate?: string;       // "YYYY-MM-DD" — the specific occurrence date
}
