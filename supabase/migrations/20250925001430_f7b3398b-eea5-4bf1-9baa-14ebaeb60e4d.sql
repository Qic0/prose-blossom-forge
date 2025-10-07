-- Update RLS policy to allow anyone to create tasks (remove auth requirement temporarily)
DROP POLICY IF EXISTS "Authenticated users can create zadachi" ON public.zadachi;

CREATE POLICY "Anyone can create zadachi" 
ON public.zadachi 
FOR INSERT 
WITH CHECK (true);