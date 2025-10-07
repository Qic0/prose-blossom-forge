-- Remove the restrictive policy and create a permissive one for testing
DROP POLICY IF EXISTS "Users can update their tasks or admins" ON public.zadachi;
DROP POLICY IF EXISTS "Temporary: Allow all updates to tasks for testing" ON public.zadachi;

-- Create a new temporary policy that allows all updates for testing
CREATE POLICY "Allow all task updates for testing" 
ON public.zadachi 
FOR UPDATE 
USING (true)
WITH CHECK (true);