-- Fix the handle_new_user function to use the correct column names
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (uuid_user, email, full_name, role, id_user)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'otk'::user_role,
    (SELECT COALESCE(MAX(id_user), 0) + 1 FROM public.users)
  );
  RETURN NEW;
END;
$$;