-- Add zakaz_id column to zadachi table to establish proper relationship
ALTER TABLE public.zadachi 
ADD COLUMN zakaz_id numeric;

-- Create foreign key constraint to ensure data integrity
ALTER TABLE public.zadachi 
ADD CONSTRAINT fk_zadachi_zakaz 
FOREIGN KEY (zakaz_id) REFERENCES public.zakazi(id_zakaza);

-- Create index for better performance on queries
CREATE INDEX idx_zadachi_zakaz_id ON public.zadachi(zakaz_id);