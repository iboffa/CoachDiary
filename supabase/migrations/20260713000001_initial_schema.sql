-- =============================================================================
-- CoachDiary — Initial Supabase schema
-- Replaces Dexie/IndexedDB (v13) with Postgres + Row-Level Security.
-- All integer PKs become UUIDs; all field names normalised to snake_case.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Profiles (mirrors auth.users — created automatically on sign-up via trigger)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS profiles (
  id           uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name text,
  avatar_url   text,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Auto-create a profile row whenever a new user signs up
-- SET search_path is required: supabase_auth_admin (which performs the
-- actual auth.users insert during sign-up) runs with search_path=auth only,
-- so an unqualified "profiles" reference would fail to resolve.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE handle_new_user();

-- ---------------------------------------------------------------------------
-- Teams
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS teams (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name        text NOT NULL,
  description text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Team members (staff / player invites)
-- role: 'owner' | 'staff' | 'player'
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS team_members (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id   uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role      text NOT NULL DEFAULT 'staff',
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);

-- ---------------------------------------------------------------------------
-- Helper: true if auth.uid() owns or is a member of the team
-- SECURITY DEFINER so it can read team_members without bypassing RLS on callers
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION is_team_member(p_team_id uuid)
RETURNS boolean LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.teams
    WHERE id = p_team_id
      AND (
        owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.team_members
          WHERE team_members.team_id = p_team_id
            AND team_members.user_id = auth.uid()
        )
      )
  );
$$;

-- ---------------------------------------------------------------------------
-- Opponents
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS opponents (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name       text NOT NULL,
  notes      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opponent_notes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent_id uuid NOT NULL REFERENCES opponents(id) ON DELETE CASCADE,
  date        date NOT NULL,
  content     text NOT NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS opponent_players (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent_id uuid NOT NULL REFERENCES opponents(id) ON DELETE CASCADE,
  name        text NOT NULL,
  number      int,
  position    text,
  notes       text
);

-- ---------------------------------------------------------------------------
-- Players
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS players (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id       uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name          text NOT NULL,
  number        int,
  position      text,
  height        text,
  weight        text,
  dominant_hand text DEFAULT 'right',
  role          text,
  strengths     text,
  weaknesses    text,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS player_notes (
  id        uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  date      date NOT NULL,
  category  text NOT NULL DEFAULT 'general',
  content   text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Team notes (journal)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS team_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date       date NOT NULL,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Play categories
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS play_categories (
  id      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name    text NOT NULL
);

-- ---------------------------------------------------------------------------
-- Plays
-- canvas_state: serialised PlayEditorPersistedState JSON (kept as text — app
--               already serialises/parses it; no server-side querying needed)
-- thumbnail:    base64 data URI (migrate to Supabase Storage in a later phase)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS plays (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id      uuid REFERENCES teams(id) ON DELETE CASCADE,
  opponent_id  uuid REFERENCES opponents(id) ON DELETE SET NULL,
  category_id  uuid REFERENCES play_categories(id) ON DELETE SET NULL,
  name         text NOT NULL,
  description  text,
  canvas_state text NOT NULL DEFAULT '{}',
  thumbnail    text,
  is_template  boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Drill categories (global — not team-scoped, same as Dexie)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS drill_categories (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name       text NOT NULL
);

-- ---------------------------------------------------------------------------
-- Saved drills (global drill library)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS saved_drills (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by       uuid REFERENCES profiles(id) ON DELETE SET NULL,
  name             text NOT NULL,
  duration_minutes int,
  description      text,
  category_id      uuid REFERENCES drill_categories(id) ON DELETE SET NULL,
  created_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Training sessions
-- drills: JSON string of Drill[] — kept as text, same as Dexie
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS training_sessions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid REFERENCES teams(id) ON DELETE CASCADE,
  name             text NOT NULL,
  date             date,
  start_time       text,
  duration_minutes int,
  focus            text,
  notes            text,
  drills           text NOT NULL DEFAULT '[]',
  is_template      boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Season plans
-- goals / events: JSON strings (SeasonGoal[] / SeasonEvent[])
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS season_plans (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id     uuid REFERENCES teams(id) ON DELETE CASCADE,
  name        text NOT NULL,
  season_year text,
  start_date  date,
  end_date    date,
  goals       text,
  events      text,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Games
-- (camelCase fields from Dexie normalised to snake_case here)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS games (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  date       date NOT NULL,
  start_time text,
  opponent   text NOT NULL,
  home_away  text NOT NULL DEFAULT 'home',
  score_us   int,
  score_them int,
  notes      text
);

-- ---------------------------------------------------------------------------
-- Game notes
-- NOTE: GameNote had no team_id in Dexie — team_id added here (nullable to
--       allow migrating legacy rows that pre-date the teams feature).
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS game_notes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid REFERENCES teams(id) ON DELETE CASCADE,
  date       date NOT NULL,
  opponent   text,
  score      text,
  location   text,
  content    text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Calendar custom events
-- (camelCase fields normalised)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS calendar_events (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title            text NOT NULL,
  date             date NOT NULL,
  start_time       text,
  duration_minutes int,
  type             text NOT NULL,
  notes            text
);

-- ---------------------------------------------------------------------------
-- Recurring schedules
-- days_of_week: int[] — 0=Mon … 6=Sun
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS recurring_schedules (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id          uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  title            text NOT NULL,
  days_of_week     int[] NOT NULL,
  start_time       text,
  duration_minutes int,
  start_date       date NOT NULL,
  end_date         date NOT NULL,
  active           boolean NOT NULL DEFAULT true
);

-- ---------------------------------------------------------------------------
-- Tasks
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS tasks (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id    uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  player_id  uuid REFERENCES players(id) ON DELETE SET NULL,
  title      text NOT NULL,
  due_date   date,
  done       boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- =============================================================================
-- Row-Level Security
-- =============================================================================

ALTER TABLE profiles           ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams              ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE opponent_players   ENABLE ROW LEVEL SECURITY;
ALTER TABLE players            ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_notes       ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE play_categories    ENABLE ROW LEVEL SECURITY;
ALTER TABLE plays              ENABLE ROW LEVEL SECURITY;
ALTER TABLE drill_categories   ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_drills       ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_plans       ENABLE ROW LEVEL SECURITY;
ALTER TABLE games              ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks              ENABLE ROW LEVEL SECURITY;

-- ── profiles ─────────────────────────────────────────────────────────────────

CREATE POLICY "profiles: own row" ON profiles
  FOR ALL USING (id = auth.uid());

-- ── teams ─────────────────────────────────────────────────────────────────────

-- owner_id checked inline (not via is_team_member) so INSERT ... RETURNING
-- (every supabase-js .insert().select()) doesn't need a self-referencing
-- subquery back into teams to see the row it just inserted.
CREATE POLICY "teams: member can select" ON teams
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "teams: owner can insert" ON teams
  FOR INSERT WITH CHECK (owner_id = auth.uid());

CREATE POLICY "teams: owner can update" ON teams
  FOR UPDATE USING (owner_id = auth.uid());

CREATE POLICY "teams: owner can delete" ON teams
  FOR DELETE USING (owner_id = auth.uid());

-- ── team_members ──────────────────────────────────────────────────────────────

CREATE POLICY "team_members: member can select" ON team_members
  FOR SELECT USING (is_team_member(team_id));

CREATE POLICY "team_members: owner can insert" ON team_members
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  );

CREATE POLICY "team_members: owner can delete" ON team_members
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM teams WHERE id = team_id AND owner_id = auth.uid())
  );

-- ── Macro for team-scoped tables ──────────────────────────────────────────────
-- Pattern: any team member can read/write rows belonging to their team.
-- Applied to: opponents, players, team_notes, play_categories, plays,
--             training_sessions, season_plans, games, game_notes,
--             calendar_events, recurring_schedules, tasks

CREATE POLICY "opponents: team member" ON opponents
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "players: team member" ON players
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "team_notes: team member" ON team_notes
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "play_categories: team member" ON play_categories
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "plays: team member" ON plays
  FOR ALL USING (team_id IS NULL OR is_team_member(team_id));

CREATE POLICY "training_sessions: team member" ON training_sessions
  FOR ALL USING (team_id IS NULL OR is_team_member(team_id));

CREATE POLICY "season_plans: team member" ON season_plans
  FOR ALL USING (team_id IS NULL OR is_team_member(team_id));

CREATE POLICY "games: team member" ON games
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "game_notes: team member" ON game_notes
  FOR ALL USING (team_id IS NULL OR is_team_member(team_id));

CREATE POLICY "calendar_events: team member" ON calendar_events
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "recurring_schedules: team member" ON recurring_schedules
  FOR ALL USING (is_team_member(team_id));

CREATE POLICY "tasks: team member" ON tasks
  FOR ALL USING (is_team_member(team_id));

-- ── Child tables (no direct team_id — access via parent) ─────────────────────

CREATE POLICY "opponent_notes: via opponent" ON opponent_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM opponents
      WHERE opponents.id = opponent_notes.opponent_id
        AND is_team_member(opponents.team_id)
    )
  );

CREATE POLICY "opponent_players: via opponent" ON opponent_players
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM opponents
      WHERE opponents.id = opponent_players.opponent_id
        AND is_team_member(opponents.team_id)
    )
  );

CREATE POLICY "player_notes: via player" ON player_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM players
      WHERE players.id = player_notes.player_id
        AND is_team_member(players.team_id)
    )
  );

-- ── Global tables (drill_categories, saved_drills) ───────────────────────────
-- Any authenticated user can read; only the creator can write.

CREATE POLICY "drill_categories: authenticated can select" ON drill_categories
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "drill_categories: creator can modify" ON drill_categories
  FOR ALL USING (created_by = auth.uid());

CREATE POLICY "saved_drills: authenticated can select" ON saved_drills
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "saved_drills: creator can modify" ON saved_drills
  FOR ALL USING (created_by = auth.uid());

-- =============================================================================
-- Indexes (mirror the Dexie index set)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_opponents_team        ON opponents(team_id);
CREATE INDEX IF NOT EXISTS idx_opponent_notes_parent ON opponent_notes(opponent_id);
CREATE INDEX IF NOT EXISTS idx_opponent_players_parent ON opponent_players(opponent_id);
CREATE INDEX IF NOT EXISTS idx_players_team          ON players(team_id);
CREATE INDEX IF NOT EXISTS idx_player_notes_player   ON player_notes(player_id);
CREATE INDEX IF NOT EXISTS idx_team_notes_team       ON team_notes(team_id);
CREATE INDEX IF NOT EXISTS idx_play_categories_team  ON play_categories(team_id);
CREATE INDEX IF NOT EXISTS idx_plays_team            ON plays(team_id);
CREATE INDEX IF NOT EXISTS idx_plays_opponent        ON plays(opponent_id);
CREATE INDEX IF NOT EXISTS idx_plays_updated         ON plays(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_training_team         ON training_sessions(team_id);
CREATE INDEX IF NOT EXISTS idx_training_date         ON training_sessions(date DESC);
CREATE INDEX IF NOT EXISTS idx_season_plans_team     ON season_plans(team_id);
CREATE INDEX IF NOT EXISTS idx_games_team            ON games(team_id);
CREATE INDEX IF NOT EXISTS idx_games_date            ON games(date DESC);
CREATE INDEX IF NOT EXISTS idx_game_notes_team       ON game_notes(team_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_team  ON calendar_events(team_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_date  ON calendar_events(date);
CREATE INDEX IF NOT EXISTS idx_recurring_team        ON recurring_schedules(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team            ON tasks(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_player          ON tasks(player_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due             ON tasks(due_date);
