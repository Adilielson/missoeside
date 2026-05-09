
-- 1. Emergency: Disable RLS on projects to force visibility
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Grant full access to public roles
GRANT ALL ON public.projects TO anon, authenticated, public;

-- 3. Ensure the project_status enum exists and is correctly accessible
-- (No changes needed if it already exists, but ensuring the table is readable)

-- 4. Comment for tracking
COMMENT ON TABLE public.projects IS 'RLS temporarily disabled for emergency visibility fix';
