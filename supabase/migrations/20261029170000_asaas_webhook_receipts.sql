-- Ledger de pagamentos individuais, incluindo mensalidades Asaas.
-- Somente service_role acessa. Não modifica registros anteriores.
CREATE TABLE IF NOT EXISTS public.asaas_payment_receipts (
  payment_id text PRIMARY KEY,
  donation_id uuid NOT NULL REFERENCES public.donations(id),
  subscription_id text,
  status text NOT NULL,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  confirmed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS asaas_payment_receipts_donation_idx ON public.asaas_payment_receipts(donation_id);
ALTER TABLE public.asaas_payment_receipts ENABLE ROW LEVEL SECURITY;
COMMENT ON TABLE public.asaas_payment_receipts IS 'Pagamentos individuais confirmados pelo Asaas, separados por competência da assinatura. Acesso exclusivo ao backend.';
