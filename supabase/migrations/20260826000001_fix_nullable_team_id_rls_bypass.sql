-- =============================================================================
-- Fix cross-tenant RLS bypass on plays / training_sessions / season_plans /
-- game_notes: their policies read "team_id IS NULL OR is_team_member(team_id)".
-- Since team_id is nullable on these four tables and Postgres reuses USING as
-- the implicit WITH CHECK for INSERT/UPDATE when none is given, ANY
-- authenticated user could insert a row with team_id = NULL (or null out the
-- team_id of a row they already have access to) and that row would then be
-- readable, writable, and deletable by every authenticated user in the
-- system — not just members of the owning team.
--
-- Every other team-scoped table (players, opponents, team_notes,
-- play_categories, games, calendar_events, recurring_schedules, tasks) is
-- NOT NULL on team_id with no such clause and was never affected.
--
-- No known legacy null-team_id rows depend on the old behavior, so this
-- tightens straight to the same fail-closed pattern used everywhere else,
-- with no data backfill needed.
-- =============================================================================

DROP POLICY IF EXISTS "plays: team member" ON plays;
CREATE POLICY "plays: team member" ON plays
  FOR ALL USING (is_team_member(team_id));

DROP POLICY IF EXISTS "training_sessions: team member" ON training_sessions;
CREATE POLICY "training_sessions: team member" ON training_sessions
  FOR ALL USING (is_team_member(team_id));

DROP POLICY IF EXISTS "season_plans: team member" ON season_plans;
CREATE POLICY "season_plans: team member" ON season_plans
  FOR ALL USING (is_team_member(team_id));

DROP POLICY IF EXISTS "game_notes: team member" ON game_notes;
CREATE POLICY "game_notes: team member" ON game_notes
  FOR ALL USING (is_team_member(team_id));
