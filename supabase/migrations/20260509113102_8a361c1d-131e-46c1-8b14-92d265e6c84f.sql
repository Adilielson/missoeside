
-- Ensure public can read published projects (restoring visibility)
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;

CREATE POLICY "Public can view published projects"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (status = 'PUBLISHED'::project_status);

-- Ensure public can read site content (used for landing page sections)
DROP POLICY IF EXISTS "Public can read site content" ON public.site_content;

CREATE POLICY "Public can read site content"
ON public.site_content
FOR SELECT
TO anon, authenticated
USING (true);
