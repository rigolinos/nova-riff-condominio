-- Criar triggers para atualizar contadores automaticamente
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Adicionar coluna participant_count na tabela events se não existir
ALTER TABLE events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Criar trigger para participantes de eventos
DROP TRIGGER IF EXISTS event_participant_count_trigger ON event_participants;
CREATE TRIGGER event_participant_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Atualizar contadores existentes
UPDATE events SET participant_count = (
  SELECT COUNT(*) 
  FROM event_participants 
  WHERE event_id = events.id AND status = 'registered'
);

-- Criar função para notificações automáticas
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql;

-- Criar trigger para notificações
DROP TRIGGER IF EXISTS notification_event_join_trigger ON event_participants;
CREATE TRIGGER notification_event_join_trigger
    AFTER INSERT ON event_participants
    FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir alguns esportes básicos se não existirem
INSERT INTO sports (name) VALUES 
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tênis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
ON CONFLICT DO NOTHING;