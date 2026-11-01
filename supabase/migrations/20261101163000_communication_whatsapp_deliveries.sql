-- Controle de envios WhatsApp (UazAPI). Apenas service_role escreve diretamente.
-- Não altera a integração Asaas nem dispara mensagens na execução desta migração.
CREATE TABLE IF NOT EXISTS public.communication_whatsapp_deliveries (
  campaign_id uuid NOT NULL REFERENCES public.communication_campaigns(id) ON DELETE CASCADE,
  phone_e164 text NOT NULL CHECK (phone_e164 ~ '^55[0-9]{10,11}$'),
  status text NOT NULL CHECK (status IN ('RESERVED','ACCEPTED','REJECTED','UNKNOWN')),
  provider_message_id text,
  attempted_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  PRIMARY KEY (campaign_id, phone_e164)
);
CREATE INDEX IF NOT EXISTS communication_whatsapp_deliveries_time_idx
  ON public.communication_whatsapp_deliveries(attempted_at DESC);
ALTER TABLE public.communication_whatsapp_deliveries ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.communication_opt_outs (
  phone_e164 text PRIMARY KEY CHECK (phone_e164 ~ '^55[0-9]{10,11}$'),
  reason text NOT NULL DEFAULT 'manual',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communication_opt_outs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='communication_whatsapp_deliveries' AND policyname='admin_whatsapp_delivery_read') THEN
    CREATE POLICY admin_whatsapp_delivery_read ON public.communication_whatsapp_deliveries FOR SELECT
      TO authenticated USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id=(SELECT auth.uid()) AND p.role='admin'
      ));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public'
    AND tablename='communication_opt_outs' AND policyname='admin_whatsapp_optout_read') THEN
    CREATE POLICY admin_whatsapp_optout_read ON public.communication_opt_outs FOR SELECT
      TO authenticated USING (EXISTS (
        SELECT 1 FROM public.profiles p
        WHERE p.id=(SELECT auth.uid()) AND p.role='admin'
      ));
  END IF;
END $$;
