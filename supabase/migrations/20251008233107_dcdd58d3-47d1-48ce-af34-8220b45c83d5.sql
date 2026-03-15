-- Adicionar campo para controlar se evento requer aprovação manual
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- Atualizar event_participants para incluir mais estados
-- O campo 'status' já existe, mas vamos garantir que suporta os novos valores
-- Valores possíveis: 'pending', 'registered', 'rejected', 'cancelled'
COMMENT ON COLUMN event_participants.status IS 'Status da participação: pending (aguardando aprovação), registered (aprovado), rejected (rejeitado), cancelled (cancelado pelo usuário)';

-- Modificar a trigger de notificação para diferenciar entre aprovação automática e pendente
CREATE OR REPLACE FUNCTION public.create_notification_on_user_join_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o evento requer aprovação e o status é pending
  IF (SELECT requires_approval FROM events WHERE id = NEW.event_id) AND NEW.status = 'pending' THEN
    -- Notificar o criador do evento que há uma solicitação pendente
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
    WHERE e.id = NEW.event_id;
  -- Se o status é registered (aprovado automaticamente ou manualmente)
  ELSIF NEW.status = 'registered' THEN
    -- Notificar o usuário que se inscreveu
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      NEW.user_id,
      'Inscrição confirmada!',
      'Você se inscreveu com sucesso no evento: ' || e.title,
      'event_join',
      jsonb_build_object('event_id', NEW.event_id, 'event_title', e.title)
    FROM events e
    WHERE e.id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar função para aprovar participação
CREATE OR REPLACE FUNCTION public.approve_participant(
  p_event_id uuid,
  p_participant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_creator uuid;
  v_event_title text;
  v_participant_name text;
BEGIN
  -- Verificar se o usuário atual é o criador do evento
  SELECT created_by, title INTO v_event_creator, v_event_title
  FROM events
  WHERE id = p_event_id;
  
  IF v_event_creator != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o criador do evento pode aprovar participantes';
  END IF;
  
  -- Atualizar status para registered
  UPDATE event_participants
  SET status = 'registered'
  WHERE event_id = p_event_id 
    AND user_id = p_participant_id 
    AND status = 'pending';
  
  -- Buscar nome do participante
  SELECT full_name INTO v_participant_name
  FROM profiles
  WHERE user_id = p_participant_id;
  
  -- Criar notificação para o participante aprovado
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    p_participant_id,
    'Participação aprovada!',
    'Sua solicitação para participar do evento "' || v_event_title || '" foi aprovada!',
    'participation_approved',
    jsonb_build_object('event_id', p_event_id)
  );
END;
$function$;

-- Criar função para rejeitar participação
CREATE OR REPLACE FUNCTION public.reject_participant(
  p_event_id uuid,
  p_participant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_creator uuid;
  v_event_title text;
BEGIN
  -- Verificar se o usuário atual é o criador do evento
  SELECT created_by, title INTO v_event_creator, v_event_title
  FROM events
  WHERE id = p_event_id;
  
  IF v_event_creator != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o criador do evento pode rejeitar participantes';
  END IF;
  
  -- Atualizar status para rejected
  UPDATE event_participants
  SET status = 'rejected'
  WHERE event_id = p_event_id 
    AND user_id = p_participant_id 
    AND status = 'pending';
  
  -- Criar notificação para o participante rejeitado
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    p_participant_id,
    'Participação não aprovada',
    'Sua solicitação para participar do evento "' || v_event_title || '" não foi aprovada.',
    'participation_rejected',
    jsonb_build_object('event_id', p_event_id)
  );
END;
$function$;