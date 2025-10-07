-- Create a security definer function to get filtered order data for employees
-- This function will return order data with customer contact info filtered based on user role
CREATE OR REPLACE FUNCTION public.get_filtered_order_data()
RETURNS TABLE (
  id_zakaza numeric,
  uuid_zakaza uuid,
  title text,
  description text,
  client_name text,
  client_phone text,
  client_email text,
  status text,
  priority order_priority,
  total_amount numeric,
  due_date timestamp with time zone,
  created_at timestamp with time zone,
  updated_at timestamp with time zone,
  created_by numeric,
  vse_zadachi jsonb[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If user is admin, return all data
  IF is_admin() THEN
    RETURN QUERY
    SELECT 
      z.id_zakaza,
      z.uuid_zakaza,
      z.title,
      z.description,
      z.client_name,
      z.client_phone,
      z.client_email,
      z.status,
      z.priority,
      z.total_amount,
      z.due_date,
      z.created_at,
      z.updated_at,
      z.created_by,
      z.vse_zadachi
    FROM zakazi z;
  ELSE
    -- For employees, only return orders they're assigned to and hide sensitive contact info
    RETURN QUERY
    SELECT 
      z.id_zakaza,
      z.uuid_zakaza,
      z.title,
      z.description,
      z.client_name,
      NULL::text as client_phone,  -- Hide phone
      NULL::text as client_email,  -- Hide email
      z.status,
      z.priority,
      z.total_amount,
      z.due_date,
      z.created_at,
      z.updated_at,
      z.created_by,
      z.vse_zadachi
    FROM zakazi z
    WHERE EXISTS (
      SELECT 1 FROM zadachi t
      WHERE t.zakaz_id = z.id_zakaza 
      AND t.responsible_user_id = auth.uid()
    );
  END IF;
END;
$$;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all orders with client data" ON zakazi;
DROP POLICY IF EXISTS "Employees can view assigned orders only" ON zakazi;

-- Create new restrictive policies that prevent direct access to the table
-- Only allow access through the security definer function or for admins doing updates

-- Policy for admins to have full access
CREATE POLICY "Admins full access to orders"
ON zakazi
FOR ALL
TO authenticated
USING (is_admin())
WITH CHECK (is_admin());

-- Policy for employees to view only through the security function (this effectively blocks direct SELECT)
CREATE POLICY "Employees no direct access"
ON zakazi
FOR SELECT
TO authenticated
USING (false);  -- Block all direct SELECT access

-- Policy for employees to update orders they're assigned to (without seeing sensitive data)
CREATE POLICY "Employees can update assigned orders"
ON zakazi
FOR UPDATE
TO authenticated
USING (
  NOT is_admin() AND EXISTS (
    SELECT 1 FROM zadachi t
    WHERE t.zakaz_id = zakazi.id_zakaza 
    AND t.responsible_user_id = auth.uid()
  )
);

-- Allow authenticated users to insert orders (for creating new orders)
CREATE POLICY "Authenticated users can create orders"
ON zakazi
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Create a view that uses the security definer function for safe data access
CREATE OR REPLACE VIEW public.safe_orders AS
SELECT * FROM public.get_filtered_order_data();

-- Grant access to the view
GRANT SELECT ON public.safe_orders TO authenticated;