-- Setup periodic execution of auto_finalize_events function
-- This migration enables pg_cron extension and creates a scheduled job

-- Enable pg_cron extension (requires superuser privileges)
-- Note: In Supabase, you may need to enable this through the dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto_finalize_events function to run every hour
-- This will check and finalize events that are 6+ hours past their start time
SELECT cron.schedule(
  'auto-finalize-events-job',  -- job name
  '0 * * * *',                  -- cron schedule: every hour at minute 0
  'SELECT public.auto_finalize_events();'
);

-- Add comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS 'Used to automatically finalize events 6 hours after their start time';

-- Alternative: If pg_cron is not available, you can use Supabase Edge Functions
-- Create a file at supabase/functions/finalize-events/index.ts with:
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient.rpc('auto_finalize_events')

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Events finalized successfully' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
*/
-- Then configure it to run hourly via Supabase Dashboard > Edge Functions > Cron Jobs


