-- Create a function to add completed task and update worker salary
-- This function bypasses RLS to allow dispatchers to update worker salaries
CREATE OR REPLACE FUNCTION public.add_completed_task_and_salary(
  p_worker_id uuid,
  p_task_id numeric,
  p_payment numeric,
  p_has_penalty boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_salary numeric;
  v_completed_tasks jsonb[];
  v_task_exists boolean;
BEGIN
  -- Get current worker data
  SELECT salary, completed_tasks
  INTO v_current_salary, v_completed_tasks
  FROM public.users
  WHERE uuid_user = p_worker_id;

  -- Check if user exists
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Worker not found';
  END IF;

  -- Initialize completed_tasks if null
  IF v_completed_tasks IS NULL THEN
    v_completed_tasks := ARRAY[]::jsonb[];
  END IF;

  -- Check if task already exists in completed_tasks
  SELECT EXISTS (
    SELECT 1 
    FROM unnest(v_completed_tasks) AS task
    WHERE task->>'task_id' = p_task_id::text
  ) INTO v_task_exists;

  -- Only update if task doesn't exist
  IF NOT v_task_exists THEN
    -- Add new completed task
    v_completed_tasks := array_append(
      v_completed_tasks,
      jsonb_build_object(
        'task_id', p_task_id,
        'payment', p_payment,
        'has_penalty', p_has_penalty
      )
    );

    -- Update worker salary and completed_tasks
    UPDATE public.users
    SET 
      salary = COALESCE(v_current_salary, 0) + p_payment,
      completed_tasks = v_completed_tasks,
      updated_at = now()
    WHERE uuid_user = p_worker_id;
  END IF;
END;
$$;