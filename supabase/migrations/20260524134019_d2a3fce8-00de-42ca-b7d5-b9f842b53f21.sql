-- Create table for keep-alive logs
CREATE TABLE IF NOT EXISTS public.system_keep_alive (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    message TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.system_keep_alive ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (admin) to view logs
CREATE POLICY "Allow authenticated users to view keep-alive logs"
    ON public.system_keep_alive
    FOR SELECT
    TO authenticated
    USING (true);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_system_keep_alive_created_at ON public.system_keep_alive(created_at DESC);