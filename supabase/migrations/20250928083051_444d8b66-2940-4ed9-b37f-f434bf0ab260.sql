-- Fix infinite recursion in RLS policies
-- Drop problematic policies
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can view all user data" ON public.users;

-- Create a security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE uuid_user = auth.uid()
    AND role = 'admin'
  );
$$;

-- Create safe RLS policies using the security definer function
CREATE POLICY "Authenticated users can view basic profiles"
ON public.users
FOR SELECT
USING (true);

CREATE POLICY "Admins can view all user data"
ON public.users
FOR SELECT
USING (public.is_admin());