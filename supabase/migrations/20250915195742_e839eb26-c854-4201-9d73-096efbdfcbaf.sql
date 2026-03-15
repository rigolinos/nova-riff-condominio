-- Mover extensões do schema público para um schema dedicado
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover as extensões para o schema dedicado
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Recriar o cron job usando o schema correto
SELECT extensions.cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    extensions.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);