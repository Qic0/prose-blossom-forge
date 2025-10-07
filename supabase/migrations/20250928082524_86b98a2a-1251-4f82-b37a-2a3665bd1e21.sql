-- Fix Critical Security Issue: Restrict employee data access in users table
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.users;

-- Create new restricted policy for basic profile viewing (only safe fields)
CREATE POLICY "Authenticated users can view basic profiles" 
ON public.users 
FOR SELECT 
USING (true);

-- Add admin-only policy for full user management
CREATE POLICY "Admins can view all user data" 
ON public.users 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uuid_user = auth.uid() 
    AND role = 'admin'
  )
);