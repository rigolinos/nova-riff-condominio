-- Usar a sintaxe correta para o cron job no Supabase
-- Primeiro limpar qualquer agendamento anterior
SELECT cron.unschedule('check-evaluation-availability-hourly');

-- Criar o cron job corretamente
SELECT cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);