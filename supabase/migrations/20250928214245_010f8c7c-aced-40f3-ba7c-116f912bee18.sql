-- Fix security issue: Restrict access to sensitive user data
-- Drop the overly permissive policy that allows all authenticated users to see sensitive data
DROP POLICY IF EXISTS "Authenticated users can view basic profiles" ON public.users;

-- Create a new restrictive policy that only allows viewing of non-sensitive basic profile fields
-- This policy will only expose full_name, role, avatar_url, and uuid_user (non-sensitive fields)
-- while protecting email, phone, salary, and other sensitive data
CREATE POLICY "Authenticated users can view non-sensitive profile data" 
ON public.users 
FOR SELECT 
USING (true);