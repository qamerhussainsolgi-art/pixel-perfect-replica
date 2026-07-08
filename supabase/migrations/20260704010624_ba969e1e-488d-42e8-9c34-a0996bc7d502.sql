-- Part 2: lock down admin_users
DROP POLICY IF EXISTS "Anyone can lookup admin by email+phone" ON public.admin_users;
REVOKE SELECT ON public.admin_users FROM anon;

CREATE POLICY "Admins read admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.current_is_admin());

DELETE FROM public.admin_users WHERE id NOT IN (SELECT id FROM auth.users);

ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- SECURITY: The admin account and password MUST be created/reset via the
-- Supabase Auth dashboard directly (Authentication -> Users). Do NOT commit
-- plaintext passwords or crypt(...) calls with real secrets in
-- version-controlled SQL. The previous plaintext password has been removed.
