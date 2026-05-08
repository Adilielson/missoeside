-- Create project status enum
DO $$ BEGIN
    CREATE TYPE public.project_status AS ENUM ('DRAFT', 'PUBLISHED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create projects table
CREATE TABLE IF NOT EXISTS public.projects (
    id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    short_description TEXT,
    cover_image TEXT,
    category TEXT,
    country TEXT,
    city TEXT,
    goal_amount NUMERIC DEFAULT 0,
    current_amount NUMERIC DEFAULT 0,
    status public.project_status NOT NULL DEFAULT 'DRAFT',
    featured BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Public can view published projects" ON public.projects;
CREATE POLICY "Public can view published projects"
ON public.projects
FOR SELECT
USING (status = 'PUBLISHED');

DROP POLICY IF EXISTS "Admins can do everything on projects" ON public.projects;
CREATE POLICY "Admins can do everything on projects"
ON public.projects
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_projects_updated_at ON public.projects;
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Storage Bucket for project covers
INSERT INTO storage.buckets (id, name, public) 
VALUES ('project-covers', 'project-covers', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies
DROP POLICY IF EXISTS "Public Access to Project Covers" ON storage.objects;
CREATE POLICY "Public Access to Project Covers"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-covers');

DROP POLICY IF EXISTS "Admin Upload Project Covers" ON storage.objects;
CREATE POLICY "Admin Upload Project Covers"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-covers' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin Update Project Covers" ON storage.objects;
CREATE POLICY "Admin Update Project Covers"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-covers' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

DROP POLICY IF EXISTS "Admin Delete Project Covers" ON storage.objects;
CREATE POLICY "Admin Delete Project Covers"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-covers' AND
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);