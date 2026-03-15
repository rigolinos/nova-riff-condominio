-- Criar política para permitir que usuários autenticados vejam perfis básicos de outros usuários
-- Isso é necessário para a funcionalidade de busca
CREATE POLICY "Users can view basic public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Atualizar a função de busca de perfis para garantir que funcione corretamente
DROP FUNCTION IF EXISTS public.search_profiles_normalized(text);

CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
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