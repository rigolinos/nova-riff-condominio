-- Fix security warnings by adding SET search_path to all functions

-- Update create_notification_on_event_join function
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_event_update function  
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_event_cancel function
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_comment function
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$;