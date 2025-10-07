-- Remove duplicate and unused date columns from zadachi table
ALTER TABLE public.zadachi 
DROP COLUMN IF EXISTS start_date,
DROP COLUMN IF EXISTS updated_at;