-- Create function to automatically finalize events 6 hours after start time
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

-- Create a scheduled function that can be called periodically
-- Note: This function should be called by a cron job or scheduled task
-- For Supabase, you can set up a pg_cron extension or use edge functions with cron

COMMENT ON FUNCTION public.auto_finalize_events() IS 'Automatically marks events as completed 6 hours after their start time. Should be called periodically via cron or scheduled task.';

