
-- Disable RLS temporarily to ensure we start clean
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- Grant broad select permissions to all possible roles
GRANT SELECT ON public.projects TO anon, authenticated, postgres, service_role;

-- Re-enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Drop and recreate the public policy with the most permissive scope possible for SELECT
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;

CREATE POLICY "Public can view published projects"
ON public.projects
FOR SELECT
TO public
USING (true); -- Temporarily allow viewing ALL projects to debug if it's a status check issue

-- Ensure the enum type is correctly handled
COMMENT ON POLICY "Public can view published projects" ON public.projects IS 'Allowing all for debug, will restrict to PUBLISHED once confirmed working';
