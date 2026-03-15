-- =====================================================================
-- Migration: Fix Participation Count Logic
-- Description: Count participations only if user was still registered
--              at the time of the event, and count organized events
--              only if they were successfully completed.
-- Date: 2025-10-10
-- =====================================================================

-- =====================================================================
-- 1. Add Helper Function to Count Valid Participations
-- =====================================================================
CREATE OR REPLACE FUNCTION get_valid_participation_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_count INTEGER;
BEGIN
  -- Count only participations where:
  -- 1. User was still registered when event ended (participation_status = 'confirmed')
  -- 2. Event was completed (status = 'completed')
  -- 3. Event date has passed
  
  SELECT COUNT(DISTINCT ep.event_id)
  INTO valid_count
  FROM event_participants ep
  INNER JOIN events e ON e.id = ep.event_id
  WHERE ep.user_id = user_id_param
    AND ep.status = 'confirmed' -- User was still registered
    AND e.status = 'completed'  -- Event was completed
    AND (e.date + e.time::time) < NOW(); -- Event has ended
    
  RETURN COALESCE(valid_count, 0);
END;
$$;

COMMENT ON FUNCTION get_valid_participation_count IS 'Returns the count of valid participations for a user (only events where user didnt cancel before event time)';

-- =====================================================================
-- 2. Add Helper Function to Count Valid Organized Events
-- =====================================================================
CREATE OR REPLACE FUNCTION get_valid_organized_events_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_count INTEGER;
BEGIN
  -- Count only organized events where:
  -- 1. Event was completed (not cancelled)
  -- 2. Event had at least 1 confirmed participant
  -- 3. Event date has passed
  
  SELECT COUNT(DISTINCT e.id)
  INTO valid_count
  FROM events e
  WHERE e.created_by = user_id_param
    AND e.status = 'completed' -- Event was completed
    AND e.participant_count >= 1 -- Had at least 1 participant
    AND (e.date + e.time::time) < NOW(); -- Event has ended
    
  RETURN COALESCE(valid_count, 0);
END;
$$;

COMMENT ON FUNCTION get_valid_organized_events_count IS 'Returns the count of valid organized events (only completed events with participants)';

-- =====================================================================
-- 3. Create View for User Statistics
-- =====================================================================
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.user_id,
  p.full_name,
  get_valid_participation_count(p.user_id) as participations_count,
  get_valid_organized_events_count(p.user_id) as organized_events_count,
  p.created_at as member_since
FROM profiles p;

COMMENT ON VIEW user_statistics IS 'Provides accurate user statistics with validated participation and organized events counts';

-- Grant access to authenticated users
GRANT SELECT ON user_statistics TO authenticated;

-- =====================================================================
-- 4. Update RLS Policies for the View
-- =====================================================================
ALTER VIEW user_statistics SET (security_invoker = on);

-- =====================================================================
-- 5. Add Indexes for Performance
-- =====================================================================
-- Index for faster lookups on event completion and participation
CREATE INDEX IF NOT EXISTS idx_events_completed_date 
ON events(status, date, time) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_event_participants_user_status 
ON event_participants(user_id, status, event_id)
WHERE status = 'confirmed';

-- =====================================================================
-- 6. Migration Complete
-- =====================================================================
-- Note: Frontend should now query user_statistics view instead of
-- manually counting from profiles table.

