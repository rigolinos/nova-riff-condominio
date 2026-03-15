-- Criar triggers para as funções corrigidas

-- Trigger para atualizar contador de participantes
DROP TRIGGER IF EXISTS event_participants_count_trigger ON event_participants;
CREATE TRIGGER event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Trigger para criar notificações quando alguém se inscreve em eventos
DROP TRIGGER IF EXISTS event_join_notification_trigger ON event_participants;
CREATE TRIGGER event_join_notification_trigger
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir esportes básicos se a tabela estiver vazia
INSERT INTO sports (name) 
SELECT * FROM (VALUES
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tennis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM sports LIMIT 1);