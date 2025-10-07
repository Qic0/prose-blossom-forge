-- Исправляем дубликат в completed_tasks для пользователя Иван
-- Сначала удаляем текущие completed_tasks
UPDATE users 
SET completed_tasks = ARRAY[]::jsonb[]
WHERE uuid_user = 'f6b06d6c-6425-47f8-999a-07d2a13e3eef';

-- Добавляем правильные записи
UPDATE users 
SET completed_tasks = ARRAY[
    '{"task_id": 16, "payment": 1500}'::jsonb,
    '{"task_id": 17, "payment": 1500}'::jsonb
]
WHERE uuid_user = 'f6b06d6c-6425-47f8-999a-07d2a13e3eef';