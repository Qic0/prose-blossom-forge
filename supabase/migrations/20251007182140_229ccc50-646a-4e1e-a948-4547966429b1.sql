-- First, update any users that have the Russian 'Диспетчер' role to use 'dispatcher'
UPDATE public.users 
SET role = 'dispatcher'::user_role 
WHERE role = 'Диспетчер'::user_role;

-- Drop ALL RLS policies that depend on the role column across all tables
-- automation_settings policies
DROP POLICY IF EXISTS "Admin can view automation settings" ON public.automation_settings;
DROP POLICY IF EXISTS "Admin can manage automation settings" ON public.automation_settings;

-- users policies
DROP POLICY IF EXISTS "Admins can view all user data" ON public.users;
DROP POLICY IF EXISTS "Admins can do everything with users" ON public.users;
DROP POLICY IF EXISTS "Only admins can update user salaries" ON public.users;

-- zadachi policies  
DROP POLICY IF EXISTS "Admins can delete tasks" ON public.zadachi;
DROP POLICY IF EXISTS "Admins can update any task" ON public.zadachi;

-- admin_penalty_log policies
DROP POLICY IF EXISTS "Admins can insert penalties" ON public.admin_penalty_log;
DROP POLICY IF EXISTS "Admins and affected dispatchers can view penalties" ON public.admin_penalty_log;

-- Remove the default value temporarily
ALTER TABLE public.users 
  ALTER COLUMN role DROP DEFAULT;

-- Rename the old enum
ALTER TYPE user_role RENAME TO user_role_old;

-- Create new enum without 'Диспетчер'
CREATE TYPE user_role AS ENUM (
  'admin',
  'manager', 
  'sawyer',
  'edger',
  'additive',
  'grinder',
  'painter',
  'packer',
  'otk',
  'dispatcher'
);

-- Update the users table to use the new enum
ALTER TABLE public.users 
  ALTER COLUMN role TYPE user_role USING role::text::user_role;

-- Restore the default value
ALTER TABLE public.users 
  ALTER COLUMN role SET DEFAULT 'edger'::user_role;

-- Drop the old enum type
DROP TYPE user_role_old;

-- Recreate all RLS policies
CREATE POLICY "Admins can view all user data" 
ON public.users 
FOR SELECT 
USING (is_admin());

CREATE POLICY "Admins can do everything with users" 
ON public.users 
FOR ALL 
USING (auth.role() = 'admin');

CREATE POLICY "Only admins can update user salaries" 
ON public.users 
FOR UPDATE 
USING (is_admin()) 
WITH CHECK (is_admin());

CREATE POLICY "Admin can view automation settings" 
ON public.automation_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admin can manage automation settings" 
ON public.automation_settings 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
) 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admins can delete tasks" 
ON public.zadachi 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admins can update any task" 
ON public.zadachi 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admins can insert penalties" 
ON public.admin_penalty_log 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )
);

CREATE POLICY "Admins and affected dispatchers can view penalties" 
ON public.admin_penalty_log 
FOR SELECT 
USING (
  (EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid() 
    AND users.role = 'admin'::user_role
  )) 
  OR 
  (dispatcher_id = auth.uid())
);