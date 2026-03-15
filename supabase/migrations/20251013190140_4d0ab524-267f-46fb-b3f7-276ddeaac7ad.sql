-- Drop the restrictive policy that only allows users to view their own sports
DROP POLICY IF EXISTS "Users can view their own sports" ON user_sports;

-- Create a new policy that allows everyone to view all user sports
-- This makes sports interests public information visible on user profiles
CREATE POLICY "User sports are viewable by everyone"
  ON user_sports
  FOR SELECT
  USING (true);