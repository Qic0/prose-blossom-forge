-- Remove the problematic trigger that references deleted updated_at column
DROP TRIGGER IF EXISTS update_zadachi_updated_at ON public.zadachi;

-- Now update execution_time_seconds for all completed tasks
UPDATE public.zadachi 
SET execution_time_seconds = EXTRACT(EPOCH FROM (completed_at - created_at))::INTEGER
WHERE completed_at IS NOT NULL 
  AND created_at IS NOT NULL 
  AND execution_time_seconds IS NULL;