-- Fix security issue: Remove overly permissive policy completely
-- Drop the policy that was just created (it's still too permissive)
DROP POLICY IF EXISTS "Authenticated users can view non-sensitive profile data" ON public.users;

-- The existing policies already provide proper access:
-- 1. "Users can view own complete profile" - users can see their own data
-- 2. "Admins can view all user data" - admins can see all user data  
-- 3. "Admins can do everything with users" - admin access for modifications
-- 
-- No additional policy is needed for authenticated users to view other users' sensitive data

-- Verify existing secure policies are still in place
-- (These should already exist and provide proper security):

-- Ensure users can only view their own complete profile
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Users can view own complete profile'
    ) THEN
        CREATE POLICY "Users can view own complete profile" 
        ON public.users 
        FOR SELECT 
        USING (auth.uid() = uuid_user);
    END IF;
END $$;

-- Ensure admins can view all user data through the is_admin() function
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'users' 
        AND policyname = 'Admins can view all user data'
    ) THEN
        CREATE POLICY "Admins can view all user data" 
        ON public.users 
        FOR SELECT 
        USING (is_admin());
    END IF;
END $$;