export interface Team {
  id?: number;
  name: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface TeamNote {
  id?: number;
  team_id: number;
  date: string;
  content: string;
  created_at?: string;
}

export interface Opponent {
  id?: number;
  team_id: number;
  name: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface OpponentPlayer {
  id?: number;
  opponent_id: number;
  name: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | '';
  notes?: string;
}

export interface OpponentNote {
  id?: number;
  opponent_id: number;
  date: string;
  content: string;
  created_at?: string;
}

export interface Player {
  id?: number;
  team_id?: number;
  name: string;
  number: number;
  position: 'PG' | 'SG' | 'SF' | 'PF' | 'C' | '';
  height?: string;
  weight?: string;
  dominant_hand?: 'left' | 'right';
  created_at?: string;
  updated_at?: string;
}

export interface PlayerNote {
  id?: number;
  player_id: number;
  date: string;
  category: 'general' | 'technical' | 'physical' | 'mental' | 'game';
  content: string;
  created_at?: string;
}

export interface PlayCategory {
  id?: number;
  name: string;
  team_id: number;
}

export interface DrillCategory {
  id?: number;
  name: string;
}

export interface Play {
  id?: number;
  team_id?: number;
  opponent_id?: number;
  name: string;
  description?: string;
  category_id?: number;
  canvas_state: string;
  thumbnail?: string | null;
  is_template?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface PlaySummary extends Omit<Play, 'canvas_state'> {}

export interface Drill {
  id: string;
  name: string;
  duration_minutes: number;
  description?: string;
  canvas_state?: string;
}

export interface SavedDrill {
  id?: number;
  name: string;
  duration_minutes: number;
  description?: string;
  category_id?: number;
  created_at?: string;
}

export interface TrainingSession {
  id?: number;
  team_id?: number;
  name: string;
  date?: string;
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
  training_session_id?: number;
  notes?: string;
}

export interface SeasonGoal {
  id: string;
  text: string;
  done: boolean;
  deadline?: string;
}

export interface SeasonPlan {
  id?: number;
  team_id?: number;
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
  id?: number;
  date: string;
  opponent?: string;
  score?: string;
  location?: string;
  content: string;
  created_at?: string;
}

export interface Game {
  id?: number;
  teamId: number;
  date: string;
  opponent: string;
  homeAway: 'home' | 'away';
  scoreUs: number | null;
  scoreThem: number | null;
  notes: string;
}
