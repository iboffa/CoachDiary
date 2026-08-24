-- =============================================================================
-- is_team_member() is SECURITY DEFINER but never set search_path, and
-- references teams/team_members unqualified. It happens to work today
-- because PostgREST roles have "public" in their default search_path, but
-- it's the same latent bug class as handle_new_user() (see migration
-- 20260824000002) — one ALTER ROLE away from silently breaking. Pin it down
-- explicitly for consistency and safety.
-- =============================================================================

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
