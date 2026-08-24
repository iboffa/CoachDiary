-- =============================================================================
-- Fix "teams: member can select": the previous policy used is_team_member(id),
-- which runs a SECURITY DEFINER subquery back into the teams table itself.
-- When evaluated as part of an INSERT ... RETURNING (as supabase-js does for
-- every .insert().select()), that self-referencing subquery can fail to see
-- the row just inserted by the same statement, causing a false RLS rejection
-- ("new row violates row-level security policy for table teams") even though
-- the insert itself was allowed. Checking owner_id inline avoids the
-- self-reference for the common case; team_members membership still goes
-- through a subquery, but on a different table, so it isn't affected.
-- =============================================================================

DROP POLICY IF EXISTS "teams: member can select" ON teams;

CREATE POLICY "teams: member can select" ON teams
  FOR SELECT USING (
    owner_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
        AND team_members.user_id = auth.uid()
    )
  );
