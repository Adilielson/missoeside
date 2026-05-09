
-- 1. Garantir que o RLS está ativo
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Visualizacao_Publica_Projetos_Publicados" ON public.projects;
DROP POLICY IF EXISTS "Acesso_Total_Administrador" ON public.projects;

-- 3. POLÍTICA PARA O PÚBLICO: Ver apenas projetos publicados
CREATE POLICY "Public_Select_Published"
ON public.projects
FOR SELECT
USING (status = 'PUBLISHED'::project_status);

-- 4. POLÍTICA PARA ADMIN: Ver e fazer TUDO em QUALQUER projeto
CREATE POLICY "Admin_Full_Access"
ON public.projects
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'::user_role
  )
);

-- 5. Garantir permissões de acesso
GRANT ALL ON public.projects TO authenticated;
GRANT SELECT ON public.projects TO anon;
GRANT ALL ON public.projects TO service_role;
