-- 1. Remover políticas que podem estar causando conflito
DROP POLICY IF EXISTS "Public_Select_Published" ON public.projects;
DROP POLICY IF EXISTS "Admin_Full_Access" ON public.projects;
DROP POLICY IF EXISTS "Leitura_Publica_Projetos_Publicados" ON public.projects;
DROP POLICY IF EXISTS "Admin_Gestao_Total" ON public.projects;

-- 2. Recriar políticas de forma limpa
CREATE POLICY "Leitura_Publica"
ON public.projects
FOR SELECT
TO anon, authenticated
USING (status = 'PUBLISHED');

CREATE POLICY "Admin_Total"
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

-- 3. Garantir que os projetos estão com o status correto do ENUM ('PUBLISHED')
UPDATE public.projects SET status = 'PUBLISHED' WHERE status IS NOT NULL;
