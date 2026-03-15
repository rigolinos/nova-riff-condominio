-- Fix comment notification logic to prevent self-notifications
-- The previous logic used OR which could still notify the commenter in some cases
-- Changed to AND to ensure the commenter is never notified

CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  -- FIXED: Changed OR to AND to properly exclude the commenter from notifications
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END AS target_user_id,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object(
      'event_id', NEW.event_id, 
      'comment_id', NEW.id, 
      'commenter_name', p.full_name
    )
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    -- CRITICAL FIX: Ensure we don't notify the commenter (user who created the comment)
    -- This checks if the target user (participant OR organizer) is different from the commenter
    AND COALESCE(ep.user_id, e.created_by) != NEW.user_id;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_notification_on_comment() IS 'Creates notifications for event participants and organizer when a new comment is posted. Ensures the commenter does not receive a notification for their own comment.';

