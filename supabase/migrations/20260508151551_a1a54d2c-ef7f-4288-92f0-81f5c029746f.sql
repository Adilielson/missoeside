-- Add gallery column to projects table
ALTER TABLE public.projects 
ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';