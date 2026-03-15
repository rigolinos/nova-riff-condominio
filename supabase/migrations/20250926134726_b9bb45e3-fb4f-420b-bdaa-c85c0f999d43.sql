-- Apenas adicionar campo para esporte customizado na tabela events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_sport_name text;