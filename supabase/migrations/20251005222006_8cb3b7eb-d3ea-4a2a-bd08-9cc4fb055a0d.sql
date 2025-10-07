-- Update task priority function to set high priority for all overdue tasks
CREATE OR REPLACE FUNCTION public.update_task_priority()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Set priority based on status and due date
  CASE 
    WHEN NEW.status = 'completed' THEN
      NEW.priority = 'low'::task_priority;
    -- If task is overdue (not completed and past due date), set to high priority
    WHEN NEW.status != 'completed' AND NEW.due_date < NOW() THEN
      NEW.priority = 'high'::task_priority;
    ELSE
      -- Keep medium priority for in_progress and non-overdue pending tasks
      NEW.priority = COALESCE(NEW.priority, 'medium'::task_priority);
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Update existing overdue tasks to have high priority
UPDATE public.zadachi
SET priority = 'high'::task_priority
WHERE status != 'completed' 
  AND due_date < NOW() 
  AND priority != 'high'::task_priority;