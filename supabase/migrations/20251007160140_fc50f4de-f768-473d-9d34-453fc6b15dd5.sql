-- Add new fields to zadachi table for dispatcher review system
ALTER TABLE zadachi 
  ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dispatcher_id UUID REFERENCES users(uuid_user),
  ADD COLUMN IF NOT EXISTS dispatcher_reward_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS dispatcher_reward_applied BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS dispatcher_reward_applied_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS review_returns JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS original_deadline TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dispatcher_percentage NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS penalty_applied BOOLEAN DEFAULT FALSE;

-- Create admin penalty log table
CREATE TABLE IF NOT EXISTS admin_penalty_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id NUMERIC REFERENCES zadachi(id_zadachi),
  admin_id UUID REFERENCES users(uuid_user),
  dispatcher_id UUID REFERENCES users(uuid_user),
  penalty_amount NUMERIC(12,2),
  reason TEXT DEFAULT 'Ошибка диспетчера',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on admin_penalty_log
ALTER TABLE admin_penalty_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for dispatcher review functionality
CREATE POLICY "Dispatchers can view their review tasks"
ON zadachi FOR SELECT
USING (
  dispatcher_id = auth.uid() AND status = 'under_review'
);

CREATE POLICY "Dispatchers can update their review tasks"
ON zadachi FOR UPDATE
USING (
  dispatcher_id = auth.uid() AND status IN ('under_review', 'in_progress')
);

-- RLS for admin_penalty_log
CREATE POLICY "Admins can insert penalties"
ON admin_penalty_log FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid_user = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins and affected dispatchers can view penalties"
ON admin_penalty_log FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE uuid_user = auth.uid() AND role = 'admin'
  ) 
  OR dispatcher_id = auth.uid()
);