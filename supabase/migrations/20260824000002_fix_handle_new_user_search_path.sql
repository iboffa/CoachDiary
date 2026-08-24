-- =============================================================================
-- Fix handle_new_user(): supabase_auth_admin (the role that performs the
-- actual auth.users insert during sign-up) runs with search_path=auth only.
-- Our SECURITY DEFINER trigger function never set its own search_path, so the
-- unqualified reference to "profiles" failed to resolve, silently breaking
-- the trigger and surfacing to users as "Database error saving new user".
-- =============================================================================

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
