-- =========================================================================
-- SCRIPT DE CORREÇÃO DO BANCO DE DADOS (NOVA RIFF SPORTS)
-- Adiciona todas as colunas e tabelas que ficaram faltando na migração inicial
-- =========================================================================

-- 1. Arrumando a tabela PROFILES (Faltava telefone, cidade, etc)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- 2. Arrumando a tabela EVENTS (Faltava contador de participantes, imagens, etc)
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS has_pcd_structure BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pcd_types TEXT[] DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS age_group TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_sport_name TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS latitude NUMERIC;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS longitude NUMERIC;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location_reference TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS skill_level TEXT;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS sport_id UUID;

-- 3. Arrumando a tabela EVENT_PARTICIPANTS (Faltava status de avaliação)
ALTER TABLE public.event_participants ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending';

-- 4. Criando a tabela SPORTS (Esportes disponíveis)
CREATE TABLE IF NOT EXISTS public.sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Criando a tabela USER_SPORTS (Esportes favoritos do usuário)
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, sport_id)
);

-- 6. Criando a tabela REVIEWS (Avaliações de jogadores - Matchmaking)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
  rating NUMERIC(3,2) NOT NULL CHECK (rating >= 1 AND rating <= 5),
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INSERIR ESPORTES BÁSICOS PARA O APP FUNCIONAR
INSERT INTO public.sports (name) 
VALUES 
  ('Futebol'), ('Tênis'), ('Vôlei'), ('Basquete'), ('Beach Tennis'), ('Padel')
ON CONFLICT DO NOTHING;

