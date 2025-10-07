-- Add dispatcher_id column to automation_settings table
ALTER TABLE automation_settings 
ADD COLUMN dispatcher_id uuid REFERENCES auth.users(id);