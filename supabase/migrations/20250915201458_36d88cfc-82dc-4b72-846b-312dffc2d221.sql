-- Corrigir o problema de SECURITY DEFINER na view public_profiles
-- Recriar a view sem SECURITY DEFINER (mais segura)

DROP VIEW IF EXISTS public.public_profiles;

-- Criar view normal (sem SECURITY DEFINER) para informações públicas
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Aplicar RLS na view também
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;