-- CORRIGIR POLÍTICA QUE JÁ EXISTE

-- 1. Remover a view anterior (já feito)
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Verificar políticas existentes e remover se necessário
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- 3. Criar política restritiva: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Função segura para obter dados públicos limitados
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

-- 5. Verificar política de mensagens
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Strict message access control" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- 6. Política de notificações já está correta (só service_role pode criar)
-- Vamos verificar se a política de SELECT existe e está correta
DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);