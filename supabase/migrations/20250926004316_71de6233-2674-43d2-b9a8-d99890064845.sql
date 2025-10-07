-- Create storage bucket for order attachments
INSERT INTO storage.buckets (id, name, public) 
VALUES ('order-attachments', 'order-attachments', true);

-- Create order_attachments table
CREATE TABLE public.order_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.zakazi(uuid_zakaza) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_by UUID REFERENCES public.users(uuid_user),
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_attachments ENABLE ROW LEVEL SECURITY;

-- RLS policies for order_attachments
CREATE POLICY "Anyone can view order attachments" 
ON public.order_attachments 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create order attachments" 
ON public.order_attachments 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update order attachments" 
ON public.order_attachments 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete order attachments" 
ON public.order_attachments 
FOR DELETE 
USING (true);

-- Storage policies for order-attachments bucket
CREATE POLICY "Anyone can view order attachment files" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can upload order attachment files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can update order attachment files" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'order-attachments');

CREATE POLICY "Anyone can delete order attachment files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'order-attachments');

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_order_attachments_updated_at
BEFORE UPDATE ON public.order_attachments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();