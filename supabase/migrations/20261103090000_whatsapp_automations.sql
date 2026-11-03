-- WhatsApp transactional automation: server-only operations and explicit opt-in.
ALTER TABLE public.donations
  ADD COLUMN IF NOT EXISTS donor_marketing_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS donor_marketing_consent_at timestamptz;
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
ALTER TABLE public.whatsapp_automation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_automation_deliveries ENABLE ROW LEVEL SECURITY;
-- No client RLS policies: only the service-role backend manages templates and delivery records.
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
