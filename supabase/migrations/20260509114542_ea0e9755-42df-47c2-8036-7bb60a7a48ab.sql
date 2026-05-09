
-- 1. Reativar o RLS na tabela de projetos
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 2. Limpar políticas antigas para evitar conflitos
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins can do everything on projects" ON public.projects;

-- 3. Criar política para visualização pública (Apenas projetos publicados)
CREATE POLICY "Public can view published projects"
ON public.projects
FOR SELECT
TO public
USING (status = 'PUBLISHED'::project_status);

-- 4. Criar política para Administradores (Acesso total)
CREATE POLICY "Admins have full access to projects"
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

-- 5. Garantir que o acesso de leitura seja permitido nos papéis anon e authenticated
GRANT SELECT ON public.projects TO anon, authenticated;
-- Garantir acesso total para service_role (usado pelo admin/sistema)
GRANT ALL ON public.projects TO service_role;
