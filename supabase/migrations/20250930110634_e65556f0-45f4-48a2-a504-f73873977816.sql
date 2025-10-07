-- Drop trigger with correct name
DROP TRIGGER IF EXISTS trigger_update_task_overdue_status ON public.zadachi;

-- Drop function
DROP FUNCTION IF EXISTS public.update_task_overdue_status();

-- Drop column from zadachi table
ALTER TABLE public.zadachi DROP COLUMN IF EXISTS is_overdue;