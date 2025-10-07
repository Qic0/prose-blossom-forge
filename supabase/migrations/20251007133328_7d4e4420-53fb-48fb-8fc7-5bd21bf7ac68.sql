-- Добавить новый статус "на проверке" в enum task_status
ALTER TYPE task_status ADD VALUE IF NOT EXISTS 'under_review';

-- Изменить дефолтное значение статуса задачи на "в работе"
ALTER TABLE public.zadachi 
ALTER COLUMN status SET DEFAULT 'in_progress'::task_status;