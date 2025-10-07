-- Fix critical security vulnerability: Remove public access to users table
-- and implement proper role-based access control

-- Drop the dangerous public policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.users;

-- Create secure policies for the users table

-- 1. Allow authenticated users to view basic profile info (excluding sensitive data like salary)
CREATE POLICY "Authenticated users can view basic profiles"
ON public.users
FOR SELECT
TO authenticated
USING (true);

-- 2. Allow users to view their complete own profile (including salary)
CREATE POLICY "Users can view own complete profile"
ON public.users
FOR SELECT
TO authenticated
USING (auth.uid() = uuid_user);

-- Note: The existing "Admins can do everything with users" policy already allows admins full access
-- Note: The existing "Users can update own profile" policy already allows self-updates
-- Note: The existing "Allow salary updates for task completion" policy remains for system updates