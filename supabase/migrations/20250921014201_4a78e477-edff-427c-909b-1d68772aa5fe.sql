-- Add trigger to create confirmation notification for the user who joins an event
CREATE OR REPLACE FUNCTION create_notification_on_user_join_confirmation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the user who just joined about successful registration
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    NEW.user_id,
    'Inscrição confirmada!',
    'Você se inscreveu com sucesso no evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'event_title', e.title)
  FROM events e
  WHERE e.id = NEW.event_id;
  
  RETURN NEW;
END;
$$;

-- Apply trigger for user confirmation notifications
DROP TRIGGER IF EXISTS notify_user_join_confirmation ON event_participants;
CREATE TRIGGER notify_user_join_confirmation
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_user_join_confirmation();