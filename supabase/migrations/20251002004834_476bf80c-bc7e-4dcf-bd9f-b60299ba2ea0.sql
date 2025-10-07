-- Update all default values first, then drop moscow_now function

-- Update default values in users table
ALTER TABLE public.users 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now(),
  ALTER COLUMN last_seen SET DEFAULT now();

-- Update default values in zadachi table
ALTER TABLE public.zadachi 
  ALTER COLUMN created_at SET DEFAULT now();

-- Update default values in zakazi table
ALTER TABLE public.zakazi 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Update default values in automation_settings table
ALTER TABLE public.automation_settings 
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Update default values in order_attachments table
ALTER TABLE public.order_attachments 
  ALTER COLUMN uploaded_at SET DEFAULT now(),
  ALTER COLUMN created_at SET DEFAULT now(),
  ALTER COLUMN updated_at SET DEFAULT now();

-- Update user activity function to use now() instead of moscow_now()
CREATE OR REPLACE FUNCTION public.update_user_activity(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET updated_at = now(),
      last_seen = now(),
      status = 'online'::user_status
  WHERE uuid_user = user_uuid;
END;
$function$;

-- Update set_user_online function
CREATE OR REPLACE FUNCTION public.set_user_online(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET status = 'online'::user_status, 
      last_seen = now(),
      updated_at = now()
  WHERE uuid_user = user_uuid;
END;
$function$;

-- Update set_user_offline function
CREATE OR REPLACE FUNCTION public.set_user_offline(user_uuid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  UPDATE public.users 
  SET status = 'offline'::user_status,
      updated_at = now()
  WHERE uuid_user = user_uuid;
END;
$function$;

-- Update update_updated_at_column trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$function$;

-- Now we can safely drop the moscow_now function
DROP FUNCTION IF EXISTS public.moscow_now();