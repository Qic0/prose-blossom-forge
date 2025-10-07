-- Add execution time field to zadachi table
ALTER TABLE public.zadachi 
ADD COLUMN execution_time_seconds INTEGER DEFAULT NULL;

-- Add comment to explain the field
COMMENT ON COLUMN public.zadachi.execution_time_seconds IS 'Time taken to complete the task in seconds (calculated from created_at to completed_at)';

-- Create a trigger function to automatically calculate execution time when task is completed
CREATE OR REPLACE FUNCTION public.calculate_execution_time()
RETURNS TRIGGER AS $$
BEGIN
  -- If completed_at is being set (not null) and we have a created_at, calculate execution time
  IF NEW.completed_at IS NOT NULL AND OLD.completed_at IS NULL AND NEW.created_at IS NOT NULL THEN
    NEW.execution_time_seconds = EXTRACT(EPOCH FROM (NEW.completed_at - NEW.created_at))::INTEGER;
  END IF;
  
  -- If completed_at is being cleared (set to null), clear execution time
  IF NEW.completed_at IS NULL AND OLD.completed_at IS NOT NULL THEN
    NEW.execution_time_seconds = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public';

-- Create trigger to automatically calculate execution time
CREATE TRIGGER calculate_task_execution_time
  BEFORE UPDATE ON public.zadachi
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_execution_time();