-- Update RLS policy to allow unauthenticated users to create zakazi
DROP POLICY IF EXISTS "Authenticated users can create zakazi" ON public.zakazi;

CREATE POLICY "Anyone can create zakazi" 
ON public.zakazi 
FOR INSERT 
WITH CHECK (true);