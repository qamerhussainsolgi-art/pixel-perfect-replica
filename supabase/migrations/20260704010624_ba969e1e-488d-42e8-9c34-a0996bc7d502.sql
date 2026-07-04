
-- Part 2: lock down admin_users
DROP POLICY IF EXISTS "Anyone can lookup admin by email+phone" ON public.admin_users;
REVOKE SELECT ON public.admin_users FROM anon;

-- Add read policy for authenticated users who ARE admins (developers already have ALL policy;
-- 'client' admins also need to read admin_users to detect their own admin status client-side)
CREATE POLICY "Admins read admin_users"
  ON public.admin_users FOR SELECT
  TO authenticated
  USING (public.current_is_admin());

-- Clean up orphaned admin rows so we can add FK to auth.users
DELETE FROM public.admin_users WHERE id NOT IN (SELECT id FROM auth.users);

-- Link admin_users.id to auth.users(id)
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Part 3: create the auth user + admin row
DO $$
DECLARE new_id uuid := gen_random_uuid();
BEGIN
  -- If an auth user with this email already exists, reuse its id
  SELECT id INTO new_id FROM auth.users WHERE lower(email) = 'fatimagulsher130@gmail.com' LIMIT 1;

  IF new_id IS NULL THEN
    new_id := gen_random_uuid();
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', new_id, 'authenticated', 'authenticated',
      'fatimagulsher130@gmail.com',
      crypt('O3fk&rsvrbt#3', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"name":"Tazeen Faisal Khan","phone":"0316 4349900"}'::jsonb,
      now(), now()
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), new_id,
      jsonb_build_object('sub', new_id::text, 'email', 'fatimagulsher130@gmail.com'),
      'email', new_id::text, now(), now(), now()
    );
  ELSE
    -- Reset password + confirm email for the existing user
    UPDATE auth.users
      SET encrypted_password = crypt('O3fk&rsvrbt#3', gen_salt('bf')),
          email_confirmed_at = COALESCE(email_confirmed_at, now()),
          updated_at = now()
      WHERE id = new_id;
  END IF;

  -- Ensure matching admin_users row (linked by same id)
  INSERT INTO public.admin_users (id, name, phone, email, role)
  VALUES (new_id, 'Tazeen Faisal Khan', '0316 4349900', 'fatimagulsher130@gmail.com', 'client')
  ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = EXCLUDED.role;
END $$;
