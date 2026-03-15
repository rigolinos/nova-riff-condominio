-- Fix event status constraint to support 'Finalizado' status
-- Remove old constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add new constraint with 'Finalizado' and 'Cancelado' options
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'paused', 'Finalizado', 'Cancelado'));

-- Update the auto_finalize_events function to use 'completed' instead
CREATE OR REPLACE FUNCTION public.auto_finalize_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update event status to 'completed' 6 hours after event start
  UPDATE events
  SET status = 'completed'
  WHERE status NOT IN ('completed', 'cancelled')
  AND (date + time + INTERVAL '6 hours') <= NOW();
END;
$function$;

-- Add comment to clarify status options
COMMENT ON COLUMN public.events.status IS 'Event status: active, cancelled, completed, paused, Finalizado, Cancelado';
COMMENT ON FUNCTION public.auto_finalize_events() IS 'Automatically marks events as completed 6 hours after their start time. Should be called periodically via cron or scheduled task.';


