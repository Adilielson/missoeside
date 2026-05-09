
-- 1. Ensure RLS is enabled
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing select policies to avoid conflicts
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can do everything on projects" ON public.projects;

-- 3. Create the broad public view policy
CREATE POLICY "Public can view published projects"
ON public.projects
FOR SELECT
TO public
USING (status = 'PUBLISHED'::project_status);

-- 4. Re-create the admin policy
CREATE POLICY "Admins can do everything on projects"
ON public.projects
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  )
);

-- 5. Explicitly grant permissions just in case
GRANT SELECT ON public.projects TO anon, authenticated;
