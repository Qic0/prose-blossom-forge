-- Create policy for admins to update any task
CREATE POLICY "Admins can update any task" 
ON public.zadachi 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE uuid_user = auth.uid() 
    AND role = 'admin'
  )
);