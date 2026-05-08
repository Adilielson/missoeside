-- Ensure system_settings table exists (in case it was partially created or missed)
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Admin/Editor policies for system_settings
CREATE POLICY "Admins/Editors can view settings" 
ON public.system_settings 
FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admins/Editors can update settings" 
ON public.system_settings 
FOR UPDATE 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

CREATE POLICY "Admins/Editors can insert settings" 
ON public.system_settings 
FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- Insert default values if they don't exist
INSERT INTO public.system_settings (key, value, description)
VALUES 
('ASAAS_API_KEY', '', 'Chave de API do Asaas'),
('ASAAS_ENV', 'sandbox', 'Ambiente do Asaas (sandbox ou production)')
ON CONFLICT (key) DO NOTHING;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_system_settings_timestamp
BEFORE UPDATE ON public.system_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_system_settings_updated_at();