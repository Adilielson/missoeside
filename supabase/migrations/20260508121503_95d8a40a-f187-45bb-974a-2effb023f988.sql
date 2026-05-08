-- Fix mutable search path and revoke execution permissions for handle_new_user
ALTER FUNCTION public.handle_new_user() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;

-- Fix mutable search path for update_updated_at_column
ALTER FUNCTION public.update_updated_at_column() SET search_path = public;