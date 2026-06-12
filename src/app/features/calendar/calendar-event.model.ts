export type CalendarEventType =
  | 'game'
  | 'training'
  | 'meeting'
  | 'video-session'
  | 'tournament'
  | 'other'
  | 'season-goal'
  | 'journal';

export interface CalendarEvent {
  id: string;
  date: Date;
  title: string;
  type: CalendarEventType;
  startTime: string | null;     // "HH:MM" 24-hour, null if not set
  durationMinutes: number | null;
  routerLink: string[] | null;  // null for custom events (use delete instead)
  customEventId?: number;       // set for custom events to enable deletion
  isRecurring?: boolean;
  recurringScheduleId?: number;
  recurringDate?: string;       // "YYYY-MM-DD" — the specific occurrence date
}
