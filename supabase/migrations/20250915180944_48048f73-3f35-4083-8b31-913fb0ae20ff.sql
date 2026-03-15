-- Adicionar coluna skill_level na tabela events
ALTER TABLE public.events 
ADD COLUMN skill_level VARCHAR(20) DEFAULT 'Iniciante/Diversão';

-- Comentário sobre as opções válidas
COMMENT ON COLUMN public.events.skill_level IS 'Nível do jogo: Iniciante/Diversão, Intermediário/Casual, Avançado/Competitivo';