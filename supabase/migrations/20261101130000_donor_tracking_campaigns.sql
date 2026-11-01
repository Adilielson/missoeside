-- Dados financeiros complementares. Migração aditiva; não altera cobranças Asaas.
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_marketing_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_marketing_consent_at timestamptz;

CREATE TABLE IF NOT EXISTS public.asaas_payment_cycles (
 payment_id text PRIMARY KEY,
 donation_id uuid NOT NULL REFERENCES public.donations(id) ON DELETE RESTRICT,
 subscription_id text,
 due_date date,
 amount numeric(12,2) NOT NULL CHECK (amount >= 0),
 status text NOT NULL,
 paid_at timestamptz,
 last_verified_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asaas_cycles_donation_idx ON public.asaas_payment_cycles(donation_id);
CREATE INDEX IF NOT EXISTS asaas_cycles_due_idx ON public.asaas_payment_cycles(due_date);
ALTER TABLE public.asaas_payment_cycles ENABLE ROW LEVEL SECURITY;

-- Campanhas são rascunhos de comunicação, nunca disparos automáticos.
CREATE TABLE IF NOT EXISTS public.communication_campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 name text NOT NULL CHECK (length(trim(name)) BETWEEN 3 AND 120),
 objective text NOT NULL CHECK (length(trim(objective)) BETWEEN 3 AND 300),
 channel text NOT NULL CHECK (channel IN ('EMAIL','WHATSAPP','NEWSLETTER','MULTICHANNEL')),
 audience text NOT NULL CHECK (audience IN ('NEWSLETTER','DONORS_CONSENTED','PENDING_DONORS','ALL_OPTED_IN')),
 subject text NOT NULL DEFAULT '',
 content text NOT NULL DEFAULT '',
 project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
 status text NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT','READY','ARCHIVED')),
 created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communication_campaigns_created_idx ON public.communication_campaigns(created_at DESC);
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;

-- Nunca permitir que o público consulte contatos ou históricos financeiros.
-- O operador é reconhecido pelo perfil autenticado, não por campos do frontend.
DO $$
BEGIN
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='asaas_payment_cycles' AND policyname='admin_cycles_select') THEN
  CREATE POLICY admin_cycles_select ON public.asaas_payment_cycles FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_campaigns' AND policyname='admin_campaigns_select') THEN
  CREATE POLICY admin_campaigns_select ON public.communication_campaigns FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_campaigns' AND policyname='admin_campaigns_insert') THEN
  CREATE POLICY admin_campaigns_insert ON public.communication_campaigns FOR INSERT TO authenticated
  WITH CHECK (created_by=(SELECT auth.uid()) AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_campaigns' AND policyname='admin_campaigns_update') THEN
  CREATE POLICY admin_campaigns_update ON public.communication_campaigns FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
 END IF;
 IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_campaigns' AND policyname='admin_campaigns_delete') THEN
  CREATE POLICY admin_campaigns_delete ON public.communication_campaigns FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
 END IF;
END $$;
