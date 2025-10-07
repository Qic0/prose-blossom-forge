-- Добавить политику для удаления задач админами
CREATE POLICY "Admins can delete tasks"
ON public.zadachi
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.uuid_user = auth.uid()
    AND users.role = 'admin'
  )
);