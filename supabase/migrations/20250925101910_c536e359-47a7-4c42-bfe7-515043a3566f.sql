-- Temporarily update the RLS policy for zadachi table to allow all users to update tasks
-- This is for testing purposes only - in production, proper authentication should be implemented

DROP POLICY IF EXISTS "Users can update tasks they are responsible for or authored" ON public.zadachi;

CREATE POLICY "Temporary: Allow all updates to tasks for testing" 
ON public.zadachi 
FOR UPDATE 
USING (true)
WITH CHECK (true);