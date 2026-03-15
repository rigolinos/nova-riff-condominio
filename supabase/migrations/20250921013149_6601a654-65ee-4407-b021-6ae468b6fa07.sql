-- Insert some sample notifications for testing
-- Note: These are just for demonstration - replace user IDs with actual user IDs from your auth.users table

-- Sample notification for event registration
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1), -- Replace with actual organizer user ID
  'event_join',
  'Nova inscrição!',
  'João Silva se inscreveu no seu evento Futebol no Parque',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'participant_name', 'João Silva'),
  false
);

-- Sample event reminder notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_reminder',
  'Seu evento é hoje!',
  'O evento Futebol no Parque começará em 2 horas. Não se atrase!',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample evaluation reminder
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'evaluation_reminder',
  'Você ainda pode avaliar!',
  'Você ainda pode avaliar o evento Basquete na Quadra que aconteceu ontem.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample review received notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'new_review',
  'Nova avaliação recebida!',
  'Você recebeu uma nova avaliação de 5 estrelas! Continue assim!',
  jsonb_build_object('rating', 5),
  true
);

-- Sample event cancelled notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_cancelled',
  'Evento cancelado',
  'O evento Corrida Matinal foi cancelado devido ao tempo ruim.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'reason', 'tempo ruim'),
  true
);

-- Create trigger for new event registrations (notifies organizer)
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for event updates (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for event cancellation (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Create trigger for new comments (notifies participants and organizer)
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS notify_on_event_join ON event_participants;
CREATE TRIGGER notify_on_event_join
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

DROP TRIGGER IF EXISTS notify_on_event_update ON events;
CREATE TRIGGER notify_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_update();

DROP TRIGGER IF EXISTS notify_on_event_cancel ON events;
CREATE TRIGGER notify_on_event_cancel
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_cancel();

DROP TRIGGER IF EXISTS notify_on_comment ON event_comments;
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_comment();