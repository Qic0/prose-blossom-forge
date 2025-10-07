-- Add dispatcher_percentage column to automation_settings table
ALTER TABLE automation_settings 
ADD COLUMN dispatcher_percentage numeric DEFAULT 0 CHECK (dispatcher_percentage >= 0 AND dispatcher_percentage <= 100);