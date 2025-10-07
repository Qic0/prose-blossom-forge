-- Add column to store completed tasks with payments
ALTER TABLE users 
ADD COLUMN completed_tasks JSONB[] DEFAULT '{}';

-- Add comment for clarity
COMMENT ON COLUMN users.completed_tasks IS 'Array of completed tasks with format: {"task_id": number, "payment": number}';