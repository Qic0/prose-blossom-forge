-- Fix RLS policy for dispatchers to allow updating task status to completed
DROP POLICY IF EXISTS "Dispatchers can update their review tasks" ON public.zadachi;

CREATE POLICY "Dispatchers can update their review tasks"
ON public.zadachi
FOR UPDATE
USING (
  (dispatcher_id = auth.uid()) 
  AND (status = ANY (ARRAY['under_review'::task_status, 'in_progress'::task_status]))
)
WITH CHECK (
  dispatcher_id = auth.uid()
);