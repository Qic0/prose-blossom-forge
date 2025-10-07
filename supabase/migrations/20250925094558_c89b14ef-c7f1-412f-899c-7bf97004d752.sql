-- Fix security issue: Set search_path for the function
CREATE OR REPLACE FUNCTION public.update_task_status_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_at is set and status is not already completed, set status to completed
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL THEN
    NEW.status = 'done'::task_status;
  END IF;
  
  -- If completed_at is cleared, revert status to pending if it was completed
  IF NEW.completed_at IS NULL AND OLD.completed_at IS NOT NULL THEN
    NEW.status = 'pending'::task_status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;