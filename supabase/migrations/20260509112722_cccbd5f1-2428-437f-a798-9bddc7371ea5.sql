
-- Tighten "Anyone can insert donations" with basic validation
DROP POLICY IF EXISTS "Anyone can insert donations" ON public.donations;

CREATE POLICY "Anyone can insert valid donations"
ON public.donations
FOR INSERT
TO anon, authenticated
WITH CHECK (
  amount > 0
  AND length(trim(donor_name)) > 0
  AND length(trim(donor_email)) > 0
  AND status = 'PENDING'::donation_status
);

-- Revoke public execute on the SECURITY DEFINER trigger function
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- Ensure search_path is set on remaining function
ALTER FUNCTION public.update_system_settings_updated_at() SET search_path = public;
