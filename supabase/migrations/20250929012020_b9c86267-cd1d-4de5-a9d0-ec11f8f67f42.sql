-- Remove the security definer view and replace with a better approach
DROP VIEW IF EXISTS public.safe_orders;

-- Instead of a view, we'll modify the RLS policies to be more granular
-- First, let's restore a more restrictive SELECT policy for employees

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Employees no direct access" ON zakazi;

-- Create a policy that allows employees to see orders they're assigned to
-- but we'll handle the contact info filtering at the application level
CREATE POLICY "Employees can view assigned orders with restrictions"
ON zakazi
FOR SELECT
TO authenticated
USING (
  -- Admins can see everything
  is_admin() OR 
  -- Employees can see orders they're assigned to
  (NOT is_admin() AND EXISTS (
    SELECT 1 FROM zadachi t
    WHERE t.zakaz_id = zakazi.id_zakaza 
    AND t.responsible_user_id = auth.uid()
  ))
);

-- Create a specialized function for getting order data with contact filtering
-- This function will be used by the application to safely retrieve order data
CREATE OR REPLACE FUNCTION public.get_order_for_employee(order_id numeric)
RETURNS TABLE (
  id_zakaza numeric,
  uuid_zakaza uuid,
  title text,
  description text,
  client_name text,
  status text,
  priority order_priority,
  total_amount numeric,
  due_date timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if user is assigned to this order
  IF NOT EXISTS (
    SELECT 1 FROM zadachi t
    WHERE t.zakaz_id = order_id 
    AND t.responsible_user_id = auth.uid()
  ) AND NOT is_admin() THEN
    -- User is not assigned to this order and is not admin
    RETURN;
  END IF;

  -- Return order data (without sensitive contact info for non-admins)
  RETURN QUERY
  SELECT 
    z.id_zakaza,
    z.uuid_zakaza,
    z.title,
    z.description,
    z.client_name,
    z.status,
    z.priority,
    z.total_amount,
    z.due_date,
    z.created_at,
    z.updated_at
  FROM zakazi z
  WHERE z.id_zakaza = order_id;
END;
$$;