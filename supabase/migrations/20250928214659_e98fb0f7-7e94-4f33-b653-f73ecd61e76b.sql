-- Fix security issue: Remove overly permissive salary update policy
-- Drop the dangerous policy that allows anyone to update salaries
DROP POLICY IF EXISTS "Allow salary updates for task completion" ON public.users;

-- Create a secure policy that only allows admins to update user data including salaries
CREATE POLICY "Only admins can update user salaries" 
ON public.users 
FOR UPDATE 
USING (is_admin())
WITH CHECK (is_admin());

-- Note: The existing "Users can update own profile" policy already exists and should handle
-- non-admin user profile updates. Database functions with SECURITY DEFINER privileges
-- (like our salary penalty triggers) will continue to work as they bypass RLS policies.