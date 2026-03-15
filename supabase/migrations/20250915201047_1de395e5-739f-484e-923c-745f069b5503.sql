-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS DOS PERFIS
-- Remover a política permissiva atual que permite qualquer usuário ver qualquer perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Criar nova política restritiva: usuários só podem ver seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar view pública com apenas informações não-sensíveis para uso em listas de participantes
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. REFORÇAR SEGURANÇA DAS MENSAGENS
-- Verificar se a política atual está restritiva o suficiente
DROP POLICY IF EXISTS "Usuários podem ver mensagens enviadas/recebidas" ON public.messages;

-- Criar política mais explícita e restritiva para mensagens
CREATE POLICY "Users can only view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

-- 3. CORRIGIR SEGURANÇA DAS NOTIFICAÇÕES
-- Remover a política permissiva que permite qualquer um criar notificações
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

-- Criar política que só permite criação via service role (sistema)
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Garantir que usuários só podem ver suas próprias notificações
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Manter a política de UPDATE para marcar como lida
-- (já está correta: "Usuários podem marcar notificações como lidas")