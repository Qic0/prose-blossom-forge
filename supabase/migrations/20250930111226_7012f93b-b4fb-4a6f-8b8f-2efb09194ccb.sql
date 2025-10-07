-- Update moscow_now function to include search_path for security
CREATE OR REPLACE FUNCTION public.moscow_now()
 RETURNS timestamp with time zone
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path = public
AS $function$
  SELECT now() AT TIME ZONE 'Europe/Moscow';
$function$;