-- Remove o trigger que pode estar causando problemas na atualização manual
DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;

-- Garante que a política de RLS permita atualizações
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'posts' AND policyname = 'Enable update for authenticated users only'
    ) THEN
        CREATE POLICY "Enable update for authenticated users only" ON "public"."posts"
        FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
    END IF;
END $$;
