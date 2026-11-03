-- NEW additive migration; apply alone to an isolated test database first.
-- No existing donations, payments, settings or automation flags are modified.
CREATE TABLE IF NOT EXISTS public.donation_creation_requests (
  request_id uuid NOT NULL,
  environment text NOT NULL CHECK (environment IN ('sandbox','production')),
  status text NOT NULL DEFAULT 'RESERVED' CHECK (status IN ('RESERVED','CREATED')),
  asaas_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (environment, request_id)
);
ALTER TABLE public.donation_creation_requests ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.donation_creation_requests FROM anon, authenticated;
GRANT ALL ON public.donation_creation_requests TO service_role;
-- Service-role only. Never automatically expire/release an ambiguous reservation.
