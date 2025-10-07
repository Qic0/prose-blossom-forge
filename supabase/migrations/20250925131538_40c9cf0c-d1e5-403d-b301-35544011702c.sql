-- Create a policy that allows system-level salary updates
-- (for when tasks are completed and salary needs to be updated)
DROP POLICY IF EXISTS "Allow salary updates for task completion" ON users;

CREATE POLICY "Allow salary updates for task completion" 
ON users 
FOR UPDATE 
USING (true)
WITH CHECK (true);