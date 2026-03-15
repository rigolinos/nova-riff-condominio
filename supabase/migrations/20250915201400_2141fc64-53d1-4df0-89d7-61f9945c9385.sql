-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Aplicação Seletiva)

-- 1. Criar view pública para informações não-sensíveis
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Verificar e aplicar apenas se necessário as correções de notificações
-- Primeira verificação: se a política atual permite criação por authenticated, removê-la
DO $$
BEGIN
    -- Tentar remover a política permissiva se existir
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Sistema pode criar notificações'
        AND roles @> '{authenticated}'::name[]
    ) THEN
        DROP POLICY "Sistema pode criar notificações" ON public.notifications;
        
        -- Criar nova política restritiva
        CREATE POLICY "Only system can create notifications"
        ON public.notifications
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Se der erro, ignorar e continuar
    NULL;
END $$;