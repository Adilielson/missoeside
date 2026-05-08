-- Adicionar project_id na tabela de doações
ALTER TABLE public.donations 
ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id);

-- Criar um índice para performance
CREATE INDEX IF NOT EXISTS idx_donations_project_id ON public.donations(project_id);
