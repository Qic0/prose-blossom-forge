-- Create enum for user roles
CREATE TYPE public.user_role AS ENUM ('admin', 'editor', 'user');

-- Create enum for task status
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- Create enum for task priority
CREATE TYPE public.task_priority AS ENUM ('low', 'medium', 'high', 'urgent');

-- Create users table (extending auth.users with profile info)
CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  avatar_url TEXT,
  phone TEXT,
  salary DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create zakazi (orders) table
CREATE TABLE public.zakazi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  client_name TEXT NOT NULL,
  client_phone TEXT,
  client_email TEXT,
  total_amount DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'new',
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE
);

-- Create zadachi (tasks) table
CREATE TABLE public.zadachi (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  zakaz_id UUID REFERENCES public.zakazi(id) ON DELETE CASCADE,
  responsible_user_id UUID REFERENCES public.users(id),
  author_id UUID REFERENCES public.users(id),
  status task_status DEFAULT 'pending',
  priority task_priority DEFAULT 'medium',
  image_url TEXT,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zakazi ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.zadachi ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY "Users can view all profiles" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can do everything with users" ON public.users FOR ALL USING (
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for zakazi
CREATE POLICY "Anyone can view zakazi" ON public.zakazi FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create zakazi" ON public.zakazi FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update zakazi they created or admins" ON public.zakazi FOR UPDATE USING (
  created_by = auth.uid() OR 
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- RLS Policies for zadachi
CREATE POLICY "Anyone can view zadachi" ON public.zadachi FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create zadachi" ON public.zadachi FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Users can update their tasks or admins" ON public.zadachi FOR UPDATE USING (
  responsible_user_id = auth.uid() OR 
  author_id = auth.uid() OR
  EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
);

-- Create update triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zakazi_updated_at BEFORE UPDATE ON public.zakazi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_zadachi_updated_at BEFORE UPDATE ON public.zadachi FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for new user registration
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert test data

-- Test users (these will be created when auth users are created)
-- For now, let's insert some sample users with fake UUIDs for testing
INSERT INTO public.users (id, email, full_name, role, phone, salary) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@mebel.ru', 'Администратор Системы', 'admin', '+7 (495) 123-45-67', 80000),
('22222222-2222-2222-2222-222222222222', 'master@mebel.ru', 'Петров Иван', 'editor', '+7 (495) 234-56-78', 65000),
('33333333-3333-3333-3333-333333333333', 'worker@mebel.ru', 'Сидоров Алексей', 'user', '+7 (495) 345-67-89', 50000),
('44444444-4444-4444-4444-444444444444', 'designer@mebel.ru', 'Королева Анна', 'editor', '+7 (495) 456-78-90', 55000);

-- Test zakazi (orders)
INSERT INTO public.zakazi (id, title, description, client_name, client_phone, client_email, total_amount, status, created_by, due_date) VALUES
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Изготовление кухни', 'Кухонный гарнитур в современном стиле, 3.5 метра', 'Битаров Вячеслав', '+7 (916) 123-45-67', 'bitarov@email.ru', 485000, 'new', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '30 days'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Шкаф-купе в спальню', 'Встроенный шкаф-купе 2.5м с зеркальными дверями', 'Смирнова Елена', '+7 (916) 234-56-78', 'smirnova@email.ru', 125000, 'in_progress', '11111111-1111-1111-1111-111111111111', NOW() + INTERVAL '20 days'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Детская мебель', 'Комплект детской мебели: кровать, стол, шкаф', 'Козлов Дмитрий', '+7 (916) 345-67-89', 'kozlov@email.ru', 95000, 'design', '22222222-2222-2222-2222-222222222222', NOW() + INTERVAL '25 days');

-- Test zadachi (tasks)
INSERT INTO public.zadachi (title, description, zakaz_id, responsible_user_id, author_id, status, priority, start_date, due_date) VALUES
('Замер помещения', 'Выезд к клиенту для точного замера кухни', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', 'high', NOW() - INTERVAL '5 days', NOW() + INTERVAL '2 days'),
('Создание дизайн-проекта', 'Разработка 3D визуализации кухни', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '44444444-4444-4444-4444-444444444444', '11111111-1111-1111-1111-111111111111', 'in_progress', 'high', NOW() - INTERVAL '2 days', NOW() + INTERVAL '5 days'),
('Изготовление каркасов', 'Распил и сборка каркасов шкафов', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'pending', 'medium', NOW() + INTERVAL '3 days', NOW() + INTERVAL '15 days'),
('Установка фурнитуры', 'Монтаж петель, направляющих, ручек', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'pending', 'medium', NOW() + INTERVAL '16 days', NOW() + INTERVAL '20 days'),

('Замер шкафа', 'Замер ниши для встроенного шкафа', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'completed', 'medium', NOW() - INTERVAL '10 days', NOW() - INTERVAL '8 days'),
('Изготовление корпуса', 'Сборка основного корпуса шкафа', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '33333333-3333-3333-3333-333333333333', '22222222-2222-2222-2222-222222222222', 'in_progress', 'medium', NOW() - INTERVAL '3 days', NOW() + INTERVAL '10 days'),
('Установка зеркал', 'Монтаж зеркальных дверей', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'pending', 'low', NOW() + INTERVAL '11 days', NOW() + INTERVAL '18 days'),

('Дизайн детской', 'Создание проекта детской комнаты', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'in_progress', 'medium', NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days'),
('Согласование с клиентом', 'Презентация проекта заказчику', 'cccccccc-cccc-cccc-cccc-cccccccccccc', '44444444-4444-4444-4444-444444444444', '22222222-2222-2222-2222-222222222222', 'pending', 'high', NOW() + INTERVAL '8 days', NOW() + INTERVAL '10 days');