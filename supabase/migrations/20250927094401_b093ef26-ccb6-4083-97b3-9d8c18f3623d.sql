-- Создаем таблицу для настроек автоматизации
CREATE TABLE public.automation_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_id TEXT NOT NULL UNIQUE,
  stage_name TEXT NOT NULL,
  responsible_user_id UUID REFERENCES public.users(uuid_user),
  task_title_template TEXT NOT NULL DEFAULT '',
  task_description_template TEXT NOT NULL DEFAULT '',
  payment_amount NUMERIC DEFAULT 0,
  duration_days INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Включаем RLS
ALTER TABLE public.automation_settings ENABLE ROW LEVEL SECURITY;

-- Политики RLS
CREATE POLICY "Anyone can view automation settings" 
ON public.automation_settings 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can update automation settings" 
ON public.automation_settings 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can insert automation settings" 
ON public.automation_settings 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can delete automation settings" 
ON public.automation_settings 
FOR DELETE 
USING (true);

-- Создаем триггер для обновления updated_at
CREATE TRIGGER update_automation_settings_updated_at
BEFORE UPDATE ON public.automation_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Заполняем начальными данными для этапов производства
INSERT INTO public.automation_settings (stage_id, stage_name, task_title_template, task_description_template, payment_amount, duration_days)
VALUES 
  ('cutting', 'Распил', 'Распил для заказа #{order_id}', 'Выполнить распил материалов согласно техническому заданию', 1500, 1),
  ('edging', 'Кромление', 'Кромление для заказа #{order_id}', 'Обработать кромки деталей', 800, 1),
  ('drilling', 'Присадка', 'Присадка для заказа #{order_id}', 'Выполнить сверление отверстий', 600, 1),
  ('sanding', 'Шлифовка', 'Шлифовка для заказа #{order_id}', 'Отшлифовать поверхности деталей', 700, 1),
  ('priming', 'Грунт', 'Грунтовка для заказа #{order_id}', 'Нанести грунтовочное покрытие', 900, 1),
  ('painting', 'Покраска', 'Покраска для заказа #{order_id}', 'Выполнить финишную покраску', 1200, 2);