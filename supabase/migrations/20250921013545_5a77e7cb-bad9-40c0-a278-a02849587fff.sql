-- Fix security warnings by updating functions that don't have search_path set
-- First fix the existing functions

-- Update handle_new_user function to have search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    city,
    phone,
    birth_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'Cidade não informada',
    'Telefone não informado', 
    '1990-01-01'
  );
  RETURN new;
END;
$function$;

-- Update create_notification_on_event_join function (the one created by trigger)
CREATE OR REPLACE FUNCTION public.create_notification_on_event_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Update update_event_participant_count function
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update check_event_evaluation_availability function
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$function$;

-- Update get_public_profile function
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, profile_photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
     SELECT 
       user_id,
       full_name,
       profile_photo_url
     FROM public.profiles
     WHERE user_id = target_user_id;
   $function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;