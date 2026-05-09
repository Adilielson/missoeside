-- 1. Desativar RLS temporariamente
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;

-- 2. Remover TODAS as políticas existentes na tabela projects
DO $$ 
DECLARE 
    pol RECORD;
BEGIN 
    FOR pol IN (SELECT policyname FROM pg_policies WHERE tablename = 'projects' AND schemaname = 'public') LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.projects', pol.policyname);
    END LOOP;
END $$;

-- 3. Reativar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 4. Criar as duas políticas solicitadas
-- SELECT público: apenas status PUBLISHED
CREATE POLICY "public_read_published" 
ON public.projects 
FOR SELECT 
TO anon, authenticated 
USING (status = 'PUBLISHED');

-- Admin total: usuários autenticados com role 'admin'
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
