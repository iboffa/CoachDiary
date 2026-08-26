export interface Team {
  id?: string;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamNote {
  id?: string;
  team_id: string;
  date: string;
  content: string;
  created_at?: string;
}

export interface Opponent {
  id?: string;
  team_id: string;
  name: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpponentPlayer {
  id?: string;
  opponent_id: string;
  name: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | '';
  notes?: string;
}

export interface OpponentNote {
  id?: string;
  opponent_id: string;
  date: string;
  content: string;
  created_at?: string;
}

export type PlayerRole = 'star' | 'starter' | 'bench' | 'deep_bench';

export interface Player {
  id?: string;
  team_id?: string;
  name: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | '';
  height?: string;
  weight?: string;
  dominant_hand?: 'left' | 'right';
  role?: PlayerRole;
  strengths?: string;
  weaknesses?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PlayerNote {
  id?: string;
  player_id: string;
  date: string;
  category: 'general' | 'technical' | 'physical' | 'mental' | 'game';
  content: string;
  created_at?: string;
}

export interface PlayCategory {
  id?: string;
  name: string;
  team_id: string;
}

export interface DrillCategory {
  id?: string;
  name: string;
}

export interface Play {
  id?: string;
  team_id?: string;
  opponent_id?: string;
  name: string;
  description?: string;
  category_id?: string;
  canvas_state: string;
  thumbnail?: string | null;
  is_template?: boolean;
  created_at?: string;
  updated_at?: string;
}

export type PlaySummary = Omit<Play, 'canvas_state'>;

export interface Drill {
  id: string;
  name: string;
  duration_minutes: number;
  description?: string;
  canvas_state?: string;
}

export interface SavedDrill {
  id?: string;
  name: string;
  duration_minutes: number;
  description?: string;
  category_id?: string;
  created_at?: string;
}

export interface TrainingSession {
  id?: string;
  team_id?: string;
  name: string;
  date?: string;
  start_time?: string;
  duration_minutes?: number;
  focus?: string;
  notes?: string;
  drills: string;
  is_template?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface SeasonEvent {
  id: string;
  type: 'game' | 'training' | 'rest' | 'travel';
  date: string;
  title: string;
  opponent?: string;
  location?: string;
  training_session_id?: string;
  notes?: string;
}

export interface SeasonGoal {
  id: string;
  text: string;
  done: boolean;
  deadline?: string;
}

export interface SeasonPlan {
  id?: string;
  team_id?: string;
  name: string;
  season_year?: string;
  start_date?: string;
  end_date?: string;
  goals?: string;
  events?: string;
  created_at?: string;
  updated_at?: string;
}

export interface GameNote {
  id?: string;
  team_id?: string;
  date: string;
  opponent?: string;
  score?: string;
  location?: string;
  content: string;
  created_at?: string;
}

export interface Game {
  id?: string;
  team_id: string;
  date: string;
  start_time?: string | null;
  opponent: string;
  home_away: 'home' | 'away';
  score_us: number | null;
  score_them: number | null;
  notes: string;
}

export type CalendarCustomEventType = 'meeting' | 'video-session' | 'tournament' | 'other';

export interface CalendarCustomEvent {
  id?: string;
  team_id: string;
  title: string;
  date: string;           // "YYYY-MM-DD"
  start_time: string | null;  // "HH:MM"
  duration_minutes: number | null;
  type: CalendarCustomEventType;
  notes?: string;
}

export interface RecurringSchedule {
  id?: string;
  team_id: string;
  title: string;
  days_of_week: number[];   // 0=Mon … 6=Sun (ISO weekday - 1)
  start_time: string | null;  // "HH:MM"
  duration_minutes: number | null;
  start_date: string;   // "YYYY-MM-DD"
  end_date: string;     // "YYYY-MM-DD"
  active: boolean;
}

export interface Task {
  id?: string;
  team_id: string;
  title: string;
  due_date?: string;      // "YYYY-MM-DD", optional
  done: boolean;
  player_id?: string;     // optional — links the task to a specific player
  created_at: string;     // ISO datetime
}
