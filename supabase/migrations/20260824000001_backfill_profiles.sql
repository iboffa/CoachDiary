-- =============================================================================
-- Backfill profiles for auth.users rows created before the on_auth_user_created
-- trigger existed. Without this, those accounts have no profiles row, and any
-- insert referencing profiles(id) (e.g. teams.owner_id) fails with a foreign
-- key violation.
-- =============================================================================

INSERT INTO profiles (id, display_name, avatar_url)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'full_name', email),
  raw_user_meta_data->>'avatar_url'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
