-- Create enum for order priorities
CREATE TYPE public.order_priority AS ENUM ('low', 'medium', 'high');

-- Add priority column to zakazi table
ALTER TABLE public.zakazi 
ADD COLUMN priority order_priority DEFAULT 'medium';

-- Create function to update order priority based on status
CREATE OR REPLACE FUNCTION public.update_order_priority()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update priority when status changes
CREATE TRIGGER update_zakazi_priority_on_status_change
  BEFORE INSERT OR UPDATE OF status ON public.zakazi
  FOR EACH ROW
  EXECUTE FUNCTION public.update_order_priority();

-- Update existing orders to have correct priorities based on current status
UPDATE public.zakazi 
SET priority = CASE 
  WHEN status = 'new' THEN 'medium'::order_priority
  WHEN status = 'completed' THEN 'low'::order_priority  
  WHEN status = 'overdue' THEN 'high'::order_priority
  ELSE 'medium'::order_priority
END;