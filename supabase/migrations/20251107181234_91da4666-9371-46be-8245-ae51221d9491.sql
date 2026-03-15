-- Add 'event_comment' to the allowed notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'event_join',
    'event_reminder', 
    'event_update',
    'event_cancelled',
    'new_review',
    'evaluation_reminder',
    'new_comment',
    'event_comment',
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