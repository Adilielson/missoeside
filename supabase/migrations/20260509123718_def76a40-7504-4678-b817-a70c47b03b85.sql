-- Nenhuma alteração de schema necessária, apenas correção lógica na Edge Function.
-- Vou apenas garantir que as permissões de RLS para a tabela de doações permitam inserção anônima se necessário para testes.

-- Verificar se RLS está habilitado e se há política de inserção pública (para doações)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'donations' AND cmd = 'INSERT' AND roles @> '{anon}'
    ) THEN
        -- Se não existir, criamos uma para permitir doações públicas
        CREATE POLICY "public_insert_donations" ON public.donations FOR INSERT TO anon WITH CHECK (true);
    END IF;
END $$;
