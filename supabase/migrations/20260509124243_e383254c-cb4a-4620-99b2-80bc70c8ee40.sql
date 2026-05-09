ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT false;
