-- Adiciona coluna de permissões na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';

-- Comentário para documentação
COMMENT ON COLUMN public.profiles.permissions IS 'Lista de slugs das áreas que o usuário pode acessar (ex: projects, events, posts, team, users)';

-- Garante que administradores existentes tenham permissões completas
UPDATE public.profiles 
SET permissions = ARRAY['projects', 'events', 'posts', 'team', 'users'] 
WHERE role = 'admin';

-- Garante que editores existentes tenham permissão padrão de projetos
UPDATE public.profiles 
SET permissions = ARRAY['projects'] 
WHERE role = 'editor' AND (permissions IS NULL OR permissions = '{}');