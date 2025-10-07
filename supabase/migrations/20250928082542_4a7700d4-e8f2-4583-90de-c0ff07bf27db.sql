-- Fix Critical Security Issue: Restrict automation settings to admin-only
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Authenticated users can view automation settings" ON public.automation_settings;
DROP POLICY IF EXISTS "Authenticated users can manage automation settings" ON public.automation_settings;

-- Create admin-only policies for automation settings
CREATE POLICY "Admin can view automation settings" 
ON public.automation_settings 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uuid_user = auth.uid() 
    AND role = 'admin'
  )
);

CREATE POLICY "Admin can manage automation settings" 
ON public.automation_settings 
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uuid_user = auth.uid() 
    AND role = 'admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uuid_user = auth.uid() 
    AND role = 'admin'
  )
);