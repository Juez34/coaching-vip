-- Harden SECURITY DEFINER function search paths; all application objects are schema-qualified.
ALTER FUNCTION public.search_students(text) SET search_path = '';
ALTER FUNCTION public.create_coaching_request(uuid) SET search_path = '';
ALTER FUNCTION public.list_coaching_requests() SET search_path = '';
ALTER FUNCTION public.respond_to_coaching_request(uuid, text) SET search_path = '';
