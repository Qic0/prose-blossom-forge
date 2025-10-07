-- Allow dispatchers to view worker data for their assigned tasks
CREATE POLICY "Dispatchers can view workers on their tasks"
ON public.users
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.zadachi
    WHERE zadachi.responsible_user_id = users.uuid_user
    AND zadachi.dispatcher_id = auth.uid()
  )
);