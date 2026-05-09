-- Atualizar a política de admin para incluir editores
DROP POLICY IF EXISTS "projects_admin_all" ON public.projects;

CREATE POLICY "projects_management_access" ON public.projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role IN ('admin', 'editor')
  )
);
