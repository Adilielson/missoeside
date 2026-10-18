-- Cora Stage: alteração aditiva, sem apagar histórico Asaas.
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS payment_provider text NOT NULL DEFAULT 'asaas';
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS provider_invoice_id text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS provider_invoice_code text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS provider_status text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS checkout_token_hash text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS recurrence_id uuid;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS boleto_line text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS boleto_pdf_url text;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS idempotency_key uuid;
CREATE UNIQUE INDEX IF NOT EXISTS donations_provider_invoice_unique ON public.donations(payment_provider, provider_invoice_id) WHERE provider_invoice_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS donations_idempotency_unique ON public.donations(idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE TABLE IF NOT EXISTS public.donation_recurrences (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 donor_name text NOT NULL,
 donor_email text NOT NULL,
 donor_phone text,
 donor_document text NOT NULL,
 amount numeric(12,2) NOT NULL CHECK(amount >= 5),
 campaign text,
 project_id uuid REFERENCES public.projects(id),
 payment_provider text NOT NULL DEFAULT 'cora',
 payment_method text NOT NULL DEFAULT 'BOLETO' CHECK(payment_method = 'BOLETO'),
 status text NOT NULL DEFAULT 'ACTIVE' CHECK(status IN ('ACTIVE','PAUSED','CANCELLED')),
 next_due_date date NOT NULL,
 last_generated_period text,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS donation_recurrence_period_unique ON public.donations(recurrence_id, due_date) WHERE recurrence_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS donation_recurrences_due ON public.donation_recurrences(next_due_date) WHERE status='ACTIVE';
ALTER TABLE public.donation_recurrences ENABLE ROW LEVEL SECURITY;
-- Nenhuma policy pública: somente service_role e operações administrativas via backend com autorização própria.
COMMENT ON TABLE public.donation_recurrences IS 'Compromissos de cobrança mensal via boleto Cora; não representa débito automático.';
