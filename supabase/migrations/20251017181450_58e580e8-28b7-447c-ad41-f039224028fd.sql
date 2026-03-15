-- Drop old constraint if exists
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add correct constraint with all valid status values
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'paused'));