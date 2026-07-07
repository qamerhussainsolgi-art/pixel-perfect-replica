-- Fix: current_is_admin() with no argument always returned false because
-- its default value (_role = NULL) caused is_admin(email, NULL) to be called,
-- which never matches any role. This broke every RLS policy relying on
-- current_is_admin() for the 'client' role (e.g. category management).
--
-- Fix: when called with no argument, check if the user has ANY valid admin
-- role at all. When called with an explicit role (e.g. current_is_admin('developer')),
-- keep the original specific-role-check behavior unchanged.

CREATE OR REPLACE FUNCTION public.current_is_admin(_role public.app_role DEFAULT NULL)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT CASE
    WHEN _role IS NULL THEN
      EXISTS (
        SELECT 1 FROM public.admin_users
        WHERE lower(email) = lower(coalesce((auth.jwt() ->> 'email'), ''))
      )
    ELSE
      public.is_admin((auth.jwt() ->> 'email')::text, _role)
  END;
$$;
