-- Add UPDATE policy for zakazi table to allow updating vse_zadachi array
CREATE POLICY "Anyone can update zakazi" 
ON public.zakazi 
FOR UPDATE 
USING (true) 
WITH CHECK (true);