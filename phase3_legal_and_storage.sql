-- =========================================================================
-- FASE 3: TERMOS, FOTOS DE PERFIL E EXCLUSÃO DE CONTA
-- =========================================================================

-- 1. Criação do Bucket de Storage para Avatares (profile photos)
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de RLS para Storage (avatars)
-- Policy: Qualquer pessoa pode ver a foto de perfil
DROP POLICY IF EXISTS "Public avatars access" ON storage.objects;
CREATE POLICY "Public avatars access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

-- Policy: Usuário autenticado pode subir sua própria foto
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() = owner
  );

-- Policy: Usuário autenticado pode atualizar sua própria foto
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'avatars' AND 
    auth.uid() = owner
  );

-- Policy: Usuário autenticado pode deletar sua própria foto
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' AND 
    auth.uid() = owner
  );

-- 3. Função RPC para deletar/anonimizar a conta (Direito de Exclusão - LGPD)
-- Esta função precisa ser SECURITY DEFINER para poder remover a linha da `auth.users`
CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Identifica o usuário chamador
  v_user_id := auth.uid();
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'unauthorized',
      'message', 'Usuário não autenticado.'
    );
  END IF;

  -- Ação: Deletar registro do usuário da auth.users.
  -- Supabase Auth tem DELETE CASCADE para auth.users -> public.profiles, etc.
  DELETE FROM auth.users WHERE id = v_user_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Conta excluída com sucesso.'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user_account TO authenticated;
