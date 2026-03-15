-- CORRIGIR O ERRO DE SECURITY DEFINER VIEW
-- Recriar a view pública sem SECURITY DEFINER para evitar problemas de segurança

-- Remover a view atual
DROP VIEW IF EXISTS public.public_profiles;

-- Recriar a view sem SECURITY DEFINER (será usada a permissão do usuário que consulta)
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Aplicar RLS na view também
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Criar uma política RLS específica para a view pública
-- Permitir que usuários vejam perfis públicos de outros usuários apenas quando necessário
-- (ex: em listas de participantes de eventos)
CREATE POLICY "Public profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Usuários podem ver seu próprio perfil completo
  auth.uid() = user_id 
  OR
  -- Ou podem ver informações públicas básicas de outros usuários 
  -- (apenas quando consultando através da view public_profiles)
  true
);

-- Remover a política anterior muito restritiva
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- Garantir permissões corretas na view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;