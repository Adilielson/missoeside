ALTER TABLE public.whatsapp_automation_deliveries ADD COLUMN IF NOT EXISTS skip_reason text;
DO $$ DECLARE c text; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.whatsapp_automation_deliveries'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%status%' LOOP
    EXECUTE format('ALTER TABLE public.whatsapp_automation_deliveries DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
ALTER TABLE public.whatsapp_automation_deliveries ADD CONSTRAINT whatsapp_deliveries_status_check CHECK (status IN ('RESERVED','ACCEPTED','REJECTED','UNKNOWN','SKIPPED'));
DO $$ DECLARE c text; BEGIN
  FOR c IN SELECT conname FROM pg_constraint WHERE conrelid='public.whatsapp_automation_templates'::regclass AND contype='c' AND pg_get_constraintdef(oid) ILIKE '%event_type%' LOOP
    EXECUTE format('ALTER TABLE public.whatsapp_automation_templates DROP CONSTRAINT %I', c);
  END LOOP;
END $$;
INSERT INTO public.whatsapp_automation_templates (event_type,label,enabled,content)
VALUES ('subscription_created','Assinatura registrada',true,'Olá, {{nome}}! 💛 Recebemos sua assinatura mensal de {{valor}} para o projeto {{projeto}}. Muito obrigado por caminhar conosco nessa missão! Assim que o pagamento da primeira parcela for confirmado, avisaremos por aqui. Vencimento: {{vencimento}}. — Agência IDE')
ON CONFLICT (event_type) DO NOTHING;
UPDATE public.whatsapp_automation_templates SET enabled=true WHERE event_type IN ('new_subscriber','payment_confirmed');