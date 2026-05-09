
-- 1) Fix profiles SELECT exposure
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
));

-- 2) Prevent privilege escalation on UPDATE
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can update their own profile (no role change)"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND role = (SELECT p.role FROM public.profiles p WHERE p.id = auth.uid())
);

CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.profiles p
  WHERE p.id = auth.uid() AND p.role = 'admin'::user_role
));

-- 3) Harden functions with fixed search_path
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) AS args
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
  LOOP
    EXECUTE format('ALTER FUNCTION %I.%I(%s) SET search_path = public', r.nspname, r.proname, r.args);
  END LOOP;
END $$;
