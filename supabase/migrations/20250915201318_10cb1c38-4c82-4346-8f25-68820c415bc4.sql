-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Versão Corrigida)

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS DOS PERFIS
-- A política atual já está restritiva (auth.uid() = user_id), mas vamos criar a view pública

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
-- A política atual parece estar correta, mas vamos verificar se precisa de ajustes

-- 3. CORRIGIR SEGURANÇA DAS NOTIFICAÇÕES
-- Remover a política permissiva que permite qualquer um criar notificações
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

-- Criar política que só permite criação via service role (sistema)
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- As outras políticas de notificações já estão corretas:
-- - "Usuários podem ver suas notificações" (auth.uid() = user_id)
-- - "Usuários podem marcar notificações como lidas" (auth.uid() = user_id)