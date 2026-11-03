-- 1) donor tracking & campaigns
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
GRANT SELECT ON public.asaas_payment_cycles TO authenticated;
GRANT ALL ON public.asaas_payment_cycles TO service_role;
ALTER TABLE public.asaas_payment_cycles ENABLE ROW LEVEL SECURITY;

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
 created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS communication_campaigns_created_idx ON public.communication_campaigns(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communication_campaigns TO authenticated;
GRANT ALL ON public.communication_campaigns TO service_role;
ALTER TABLE public.communication_campaigns ENABLE ROW LEVEL SECURITY;

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

-- 2) WhatsApp campaign deliveries & opt-outs
CREATE TABLE IF NOT EXISTS public.communication_whatsapp_deliveries (
  campaign_id uuid NOT NULL REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^55[0-9]{10,11}$'),
  status text NOT NULL CHECK (status IN ('RESERVED','ACCEPTED','REJECTED','UNKNOWN')),
  provider_message_id text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (campaign_id, phone_e164)
);
CREATE INDEX IF NOT EXISTS communication_whatsapp_deliveries_time_idx ON public.communication_whatsapp_deliveries(attempted_at DESC);
GRANT SELECT ON public.communication_whatsapp_deliveries TO authenticated;
GRANT ALL ON public.communication_whatsapp_deliveries TO service_role;
ALTER TABLE public.communication_whatsapp_deliveries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.communication_opt_outs (
  phone_e164 text PRIMARY KEY CHECK (phone_e164 ~ '^55[0-9]{10,11}$'),
  reason text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.communication_opt_outs TO authenticated;
GRANT ALL ON public.communication_opt_outs TO service_role;
ALTER TABLE public.communication_opt_outs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_whatsapp_deliveries' AND policyname='admin_whatsapp_delivery_read') THEN
    CREATE POLICY admin_whatsapp_delivery_read ON public.communication_whatsapp_deliveries FOR SELECT
      TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='communication_opt_outs' AND policyname='admin_whatsapp_optout_read') THEN
    CREATE POLICY admin_whatsapp_optout_read ON public.communication_opt_outs FOR SELECT
      TO authenticated USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id=(SELECT auth.uid()) AND p.role='admin'));
  END IF;
END $$;

-- 3) WhatsApp automations (server-only)
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_templates (
  event_type text PRIMARY KEY,
  label text NOT NULL,
  enabled boolean NOT NULL DEFAULT false,
  content text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT whatsapp_automation_template_length CHECK (char_length(content) BETWEEN 1 AND 3500)
);
CREATE TABLE IF NOT EXISTS public.whatsapp_automation_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_key text NOT NULL UNIQUE,
  event_type text NOT NULL,
  donation_id uuid REFERENCES public.donations(id) ON DELETE SET NULL,
  phone_e164 text NOT NULL,
  status text NOT NULL DEFAULT 'RESERVED' CHECK(status IN ('RESERVED','ACCEPTED','REJECTED','UNKNOWN')),
  provider_message_id text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);
CREATE INDEX IF NOT EXISTS whatsapp_automation_deliveries_recent_idx ON public.whatsapp_automation_deliveries (attempted_at DESC);
GRANT ALL ON public.whatsapp_automation_templates TO service_role;
GRANT ALL ON public.whatsapp_automation_deliveries TO service_role;
ALTER TABLE public.whatsapp_automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_deliveries ENABLE ROW LEVEL SECURITY;

INSERT INTO public.whatsapp_automation_templates(event_type,label,content) VALUES
 ('welcome','Boas-vindas ao apoiador','Olá, {{nome}}! Recebemos seu cadastro para apoiar {{projeto}}. Obrigado por caminhar com a Missões IDE! Sua cobrança ainda pode estar aguardando pagamento.

Para não receber novas mensagens, responda SAIR.'),
 ('payment_confirmed','Pagamento confirmado','Olá, {{nome}}! Confirmamos seu apoio de {{valor}} ao projeto {{projeto}}. Muito obrigado por participar desta missão!

Para não receber novas mensagens, responda SAIR.'),
 ('new_subscriber','Novo assinante mensal','Olá, {{nome}}! Seu primeiro pagamento mensal de {{valor}} para {{projeto}} foi confirmado. Obrigado por se tornar apoiador recorrente!

Para não receber novas mensagens, responda SAIR.'),
 ('monthly_renewal','Renovação mensal','Olá, {{nome}}! Recebemos sua contribuição mensal de {{valor}} ao projeto {{projeto}}. Muito obrigado pela continuidade!

Para não receber novas mensagens, responda SAIR.'),
 ('upcoming_due','Lembrete de vencimento','Olá, {{nome}}! Sua contribuição de {{valor}} para {{projeto}} vence em {{vencimento}}. Consulte o link de pagamento recebido do Asaas.

Para não receber novas mensagens, responda SAIR.'),
 ('payment_overdue','Pagamento atrasado','Olá, {{nome}}! Consta uma cobrança de {{valor}} para {{projeto}} vencida em {{vencimento}}. Caso já tenha efetuado o pagamento, desconsidere.

Para não receber novas mensagens, responda SAIR.'),
 ('anniversary','Aniversário de apoio','Olá, {{nome}}! Hoje celebramos mais um ano desde seu primeiro apoio ao projeto {{projeto}}. A Missões IDE agradece por sua caminhada!

Para não receber novas mensagens, responda SAIR.'),
 ('project_updates','Novidades do projeto','Olá, {{nome}}! Temos novidades sobre {{projeto}}. Acompanhe nossos canais oficiais para saber mais!

Para não receber novas mensagens, responda SAIR.')
ON CONFLICT (event_type) DO NOTHING;