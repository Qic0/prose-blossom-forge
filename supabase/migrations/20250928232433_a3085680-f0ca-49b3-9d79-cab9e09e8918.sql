-- Fix security vulnerability in zakazi table (corrected version)
-- Remove the overly permissive policy that allows all authenticated users to see client data

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Authenticated employees can view orders" ON public.zakazi;

-- Create new secure policies based on user roles

-- Policy 1: Admins can view all orders with full client information
CREATE POLICY "Admins can view all orders with client data" 
ON public.zakazi 
FOR SELECT 
USING (is_admin());

-- Policy 2: Non-admin employees can view orders where they have associated tasks
-- This restricts access to only orders they are working on
CREATE POLICY "Employees can view assigned orders only" 
ON public.zakazi 
FOR SELECT 
USING (
  NOT is_admin() AND 
  EXISTS (
    SELECT 1 FROM public.zadachi 
    WHERE zadachi.zakaz_id = zakazi.id_zakaza 
    AND zadachi.responsible_user_id = auth.uid()
  )
);