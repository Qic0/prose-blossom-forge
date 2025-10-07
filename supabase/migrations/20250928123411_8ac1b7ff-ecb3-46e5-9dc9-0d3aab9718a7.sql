-- Update function to fix security warning by setting search_path
CREATE OR REPLACE FUNCTION public.update_order_priority()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Set priority based on status
  CASE NEW.status
    WHEN 'new' THEN
      NEW.priority = 'medium'::order_priority;
    WHEN 'completed' THEN
      NEW.priority = 'low'::order_priority;
    WHEN 'overdue' THEN
      NEW.priority = 'high'::order_priority;
    ELSE
      -- Keep existing priority for other statuses
      NEW.priority = COALESCE(NEW.priority, 'medium'::order_priority);
  END CASE;
  
  RETURN NEW;
END;
$$;