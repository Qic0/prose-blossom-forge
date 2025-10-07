-- Add checklist_photo field to zadachi table
ALTER TABLE public.zadachi 
ADD COLUMN checklist_photo TEXT;

-- Update RLS policies to ensure proper access control
-- Allow users to view their own tasks
CREATE POLICY "Users can view their assigned tasks" 
ON public.zadachi 
FOR SELECT 
USING (responsible_user_id = auth.uid());

-- Allow users to update their own tasks (for completion with photo)
CREATE POLICY "Users can update their assigned tasks" 
ON public.zadachi 
FOR UPDATE 
USING (responsible_user_id = auth.uid());