-- Fix the trigger function to use correct enum value
DROP TRIGGER IF EXISTS trigger_update_task_status_on_completion ON public.zadachi;
DROP FUNCTION IF EXISTS public.update_task_status_on_completion();

-- Create corrected function with proper enum values
CREATE OR REPLACE FUNCTION public.update_task_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_at is being set (not null), set status to completed
  IF NEW.completed_at IS NOT NULL AND (OLD.completed_at IS NULL OR OLD.status != 'completed') THEN
    NEW.status = 'completed'::task_status;
  END IF;
  
  -- If completed_at is being cleared (set to null), revert status to pending
  IF NEW.completed_at IS NULL AND OLD.completed_at IS NOT NULL AND OLD.status = 'completed' THEN
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