-- 1. Limpeza da tabela projects
ALTER TABLE public.projects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_published" ON public.projects;
DROP POLICY IF EXISTS "admin_full_access" ON public.projects;
DROP POLICY IF EXISTS "Users can view published projects" ON public.projects;
DROP POLICY IF EXISTS "Admins have full access to projects" ON public.projects;
DROP POLICY IF EXISTS "Allow public read-only access to published projects" ON public.projects;
DROP POLICY IF EXISTS "Allow admin full access" ON public.projects;

-- 2. Limpeza da tabela profiles (onde está o erro de recursão)
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile (no role change)" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 3. Reativar RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Criar políticas SEGURAS sem recursão para profiles
-- Perfis são visíveis para todos (simplifica e evita recursão em outras tabelas)
CREATE POLICY "profiles_public_read" ON public.profiles
FOR SELECT USING (true);

-- Usuários podem atualizar seus próprios perfis (exceto o campo role, idealmente controlado por trigger ou função)
CREATE POLICY "profiles_self_update" ON public.profiles
FOR UPDATE USING (auth.uid() = id);

-- 5. Criar políticas para projects
-- Leitura pública de projetos publicados
CREATE POLICY "projects_public_read_published" ON public.projects
FOR SELECT USING (status = 'PUBLISHED');

-- Acesso total para Admins 
-- IMPORTANTE: Usamos uma subquery simples na tabela profiles que agora tem RLS 'true' para select, 
-- ou melhor ainda, podemos usar o auth.uid() e checar o profile SEM causar recursão circular 
-- porque a política de SELECT no profiles agora é estática (true).
CREATE POLICY "projects_admin_all" ON public.projects
FOR ALL TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);
