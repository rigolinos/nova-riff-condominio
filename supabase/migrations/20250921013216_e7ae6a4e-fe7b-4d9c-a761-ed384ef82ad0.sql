-- First, let's see what values are currently allowed for notification types
-- and update the constraint to include our new types

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a new check constraint with all our notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'event_join',
    'event_reminder', 
    'event_update',
    'event_cancelled',
    'new_review',
    'evaluation_reminder',
    'new_comment',
    'spots_available',
    'event_confirmed',
    'new_registrations',
    'rating',
    'event_rating',
    'rating_reminder',
    'participants_needed',
    'message',
    'suggestion',
    'event_started',
    'event_start'
  ));

-- Now insert the sample notifications
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_join',
  'Nova inscrição!',
  'João Silva se inscreveu no seu evento Futebol no Parque',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'participant_name', 'João Silva'),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_reminder',
  'Seu evento é hoje!',
  'O evento Futebol no Parque começará em 2 horas. Não se atrase!',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'evaluation_reminder',
  'Você ainda pode avaliar!',
  'Você ainda pode avaliar o evento Basquete na Quadra que aconteceu ontem.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'new_review',
  'Nova avaliação recebida!',
  'Você recebeu uma nova avaliação de 5 estrelas! Continue assim!',
  jsonb_build_object('rating', 5),
  true
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_cancelled',
  'Evento cancelado',
  'O evento Corrida Matinal foi cancelado devido ao tempo ruim.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'reason', 'tempo ruim'),
  true
);