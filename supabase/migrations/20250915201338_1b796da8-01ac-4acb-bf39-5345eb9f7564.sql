-- ESTRATÉGIA CORRIGIDA: POLÍTICAS RLS GRANULARES EM VEZ DE VIEW PROBLEMÁTICA

-- 1. Remover a view que estava causando problemas de security definer
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Remover política atual
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.profiles;

-- 3. Criar política principal: usuários podem ver apenas seu próprio perfil completo
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Para permitir visualização pública limitada (apenas nome e foto) em contextos específicos,
-- vamos criar uma função que retorna apenas dados públicos
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 5. VERIFICAR E CORRIGIR OUTRAS TABELAS TAMBÉM

-- Verificar se a política de messages está correta
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- Verificar notificações - manter apenas system role para inserir
-- A política já foi criada corretamente para service_role only