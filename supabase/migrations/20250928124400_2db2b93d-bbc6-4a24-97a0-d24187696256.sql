-- Create function to update task priority based on status
CREATE OR REPLACE FUNCTION public.update_task_priority()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set priority based on status and due date
  CASE 
    WHEN NEW.status = 'completed' THEN
      NEW.priority = 'low'::task_priority;
    WHEN NEW.status = 'pending' AND NEW.due_date < NOW() THEN
      NEW.priority = 'high'::task_priority;
    ELSE
      -- Keep medium priority for in_progress and non-overdue pending tasks
      NEW.priority = COALESCE(NEW.priority, 'medium'::task_priority);
  END CASE;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically update task priority when status changes
CREATE TRIGGER update_zadachi_priority_on_status_change
  BEFORE INSERT OR UPDATE OF status ON public.zadachi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_task_priority();

-- Update existing completed tasks to have low priority
UPDATE public.zadachi 
SET priority = 'low'::task_priority 
WHERE status = 'completed';

-- Update existing overdue pending tasks to have high priority
UPDATE public.zadachi 
SET priority = 'high'::task_priority 
WHERE status = 'pending' AND due_date < NOW();