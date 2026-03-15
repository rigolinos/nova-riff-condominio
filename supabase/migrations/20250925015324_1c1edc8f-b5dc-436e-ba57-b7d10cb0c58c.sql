-- Habilitar extensão unaccent para busca insensível a acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Dropar funções existentes se existirem
DROP FUNCTION IF EXISTS public.search_events_normalized(text);
DROP FUNCTION IF EXISTS public.search_profiles_normalized(text);

-- Criar função para busca normalizada de eventos
CREATE OR REPLACE FUNCTION public.search_events_normalized(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  time_field time,
  participant_count integer,
  max_participants integer,
  skill_level text,
  image_url text,
  status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.participant_count,
    e.max_participants,
    e.skill_level,
    e.image_url,
    e.status
  FROM events e
  WHERE e.status = 'active'
    AND (
      unaccent(lower(e.title)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.description)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.location)) ILIKE unaccent(lower('%' || search_query || '%'))
    )
  ORDER BY e.date ASC
  LIMIT 10;
$$;

-- Criar função para busca normalizada de perfis
CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;