-- Add salary field to zadachi table if it doesn't exist
ALTER TABLE public.zadachi 
ADD COLUMN IF NOT EXISTS salary numeric DEFAULT 0;