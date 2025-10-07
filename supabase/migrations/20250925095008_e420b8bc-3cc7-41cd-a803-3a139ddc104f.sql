-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_task_status_on_completion ON public.zadachi;
DROP FUNCTION IF EXISTS public.update_task_status_on_completion();

-- Create a corrected function
CREATE OR REPLACE FUNCTION public.update_task_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_at is being set (not null), set status to done
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.status != 'done') THEN
    NEW.status = 'done'::task_status;
  END IF;
  
  -- If completed_at is being cleared (set to null), revert status to pending
  IF NEW.completed_at IS NULL AND OLD.completed_at IS NOT NULL AND OLD.status = 'done' THEN
    NEW.status = 'pending'::task_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create the trigger
CREATE TRIGGER trigger_update_task_status_on_completion
  BEFORE UPDATE ON public.zadachi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_status_on_completion();