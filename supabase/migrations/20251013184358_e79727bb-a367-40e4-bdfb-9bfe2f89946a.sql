-- Fix notifications to prevent users from receiving notifications about their own actions

-- Update the event join notification trigger to NOT notify the user who joined
-- Instead, only notify the event creator (unless they are the same person)
CREATE OR REPLACE FUNCTION public.create_notification_on_user_join_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o evento requer aprovação e o status é pending
  IF (SELECT requires_approval FROM events WHERE id = NEW.event_id) AND NEW.status = 'pending' THEN
    -- Notificar o criador do evento que há uma solicitação pendente (apenas se não for ele mesmo)
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      e.created_by,
      'Nova solicitação de participação',
      p.full_name || ' quer participar do evento: ' || e.title,
      'participation_request',
      jsonb_build_object(
        'event_id', NEW.event_id, 
        'participant_id', NEW.user_id,
        'participant_registration_id', NEW.id,
        'participant_name', p.full_name
      )
    FROM events e
    JOIN profiles p ON p.user_id = NEW.user_id
    WHERE e.id = NEW.event_id
      AND e.created_by != NEW.user_id; -- CRITICAL FIX: Don't notify if user is the creator
  
  -- Se o status é registered (aprovado automaticamente)
  -- Não notificamos o usuário sobre sua própria inscrição automática
  -- A confirmação visual na UI já é suficiente
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update comment notification to NOT notify users about their own comments
CREATE OR REPLACE FUNCTION public.create_notification_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notify the event creator when someone comments on their event
  -- But NOT if the creator is commenting on their own event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Novo comentário',
    p.full_name || ' comentou no evento: ' || e.title,
    'event_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id)
  FROM events e
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND e.created_by != NEW.user_id; -- CRITICAL FIX: Don't notify creator about their own comments
  
  RETURN NEW;
END;
$function$;

-- Update event update notification to NOT notify the creator about their own changes
CREATE OR REPLACE FUNCTION public.create_notification_on_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify participants if the event changed, excluding the creator
  IF OLD.date != NEW.date OR OLD.time != NEW.time OR OLD.location != NEW.location THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      'O evento "' || NEW.title || '" foi atualizado.',
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'event_title', NEW.title)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- CRITICAL FIX: Don't notify creator about their own changes
  END IF;
  
  RETURN NEW;
END;
$function$;