-- 1. Desativar RLS temporariamente
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas conhecidas (limpeza total)
DROP POLICY IF EXISTS "Leitura_Publica" ON public.projects;
DROP POLICY IF EXISTS "Admin_Total" ON public.projects;
DROP POLICY IF EXISTS "Public_Select_Published" ON public.projects;
DROP POLICY IF EXISTS "Admin_Full_Access" ON public.projects;
DROP POLICY IF EXISTS "Leitura_Publica_Projetos_Publicados" ON public.projects;
DROP POLICY IF EXISTS "Admin_Gestao_Total" ON public.projects;
DROP POLICY IF EXISTS "Permitir leitura pública de projetos publicados" ON public.projects;
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Acesso_Total_Administrador" ON public.projects;

-- 3. Reativar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. Criar APENAS as duas políticas solicitadas
CREATE POLICY "public_read_published" 
ON public.projects 
FOR SELECT 
TO anon, authenticated 
USING (status = 'PUBLISHED');

CREATE POLICY "admin_full_access" 
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
