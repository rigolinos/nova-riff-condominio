-- Fix security issue: Set proper search_path for the function
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;