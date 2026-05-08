-- Adicionar campos de e-mail na tabela de projetos
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS email_subject TEXT DEFAULT 'Obrigado pela sua doação!',
ADD COLUMN IF NOT EXISTS email_template TEXT;

-- Comentário para o template padrão se estiver vazio
COMMENT ON COLUMN public.projects.email_template IS 'Template HTML para o e-mail de agradecimento. Suporta {{donor_name}}, {{amount}}, {{project_name}}.';
