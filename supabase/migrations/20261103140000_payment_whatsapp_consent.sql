-- Consentimento transacional distinto do marketing.
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_payment_notification_consent boolean NOT NULL DEFAULT false;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS donor_payment_notification_consent_at timestamptz;
