-- =========================================================================
-- FASE 1: CONDOMÍNIO FUNCIONAL + ONBOARDING
-- Migração segura com IF NOT EXISTS / IF EXISTS para evitar erros
-- =========================================================================

-- 1. Colunas extras na tabela condominiums
ALTER TABLE public.condominiums ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);
ALTER TABLE public.condominiums ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.condominiums ADD COLUMN IF NOT EXISTS city TEXT;

-- Garantir UNIQUE no invite_code
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'condominiums_invite_code_key'
  ) THEN
    ALTER TABLE public.condominiums ADD CONSTRAINT condominiums_invite_code_key UNIQUE (invite_code);
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END;
$$;

-- 2. RPC: Criar condomínio com seed de amenidades
CREATE OR REPLACE FUNCTION public.create_condominium_with_seed(
  p_name TEXT,
  p_address TEXT,
  p_city TEXT,
  p_creator_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite_code TEXT;
  v_condo_id UUID;
  v_exists INTEGER;
BEGIN
  -- Verificar se o usuário já pertence a um condomínio
  SELECT COUNT(*) INTO v_exists
  FROM public.profiles
  WHERE user_id = p_creator_id AND condominium_id IS NOT NULL;

  IF v_exists > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_has_condominium',
      'message', 'Você já está vinculado a um condomínio.'
    );
  END IF;

  -- Gerar código de convite único (6 caracteres alfanuméricos)
  LOOP
    v_invite_code := upper(substr(md5(random()::TEXT || clock_timestamp()::TEXT), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.condominiums WHERE invite_code = v_invite_code);
  END LOOP;

  -- Criar o condomínio
  INSERT INTO public.condominiums (name, invite_code, address, city, created_by)
  VALUES (p_name, v_invite_code, p_address, p_city, p_creator_id)
  RETURNING id INTO v_condo_id;

  -- Seed de amenidades padrão
  INSERT INTO public.amenities (condominium_id, name, capacity, type, requires_booking)
  VALUES
    (v_condo_id, 'Quadra Poliesportiva', 12, 'Esportivo', true),
    (v_condo_id, 'Academia', 15, 'Fitness', false);

  -- Vincular o criador ao condomínio e setar como admin
  UPDATE public.profiles
  SET condominium_id = v_condo_id, is_admin = true
  WHERE user_id = p_creator_id;

  RETURN jsonb_build_object(
    'success', true,
    'condominium_id', v_condo_id,
    'invite_code', v_invite_code,
    'name', p_name,
    'message', 'Condomínio criado com sucesso!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_condominium_with_seed TO authenticated;


-- 3. RPC: Entrar em condomínio por código de convite
CREATE OR REPLACE FUNCTION public.join_condominium_by_code(
  p_invite_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_condo RECORD;
  v_exists INTEGER;
BEGIN
  -- Verificar se o usuário já pertence a um condomínio
  SELECT COUNT(*) INTO v_exists
  FROM public.profiles
  WHERE user_id = p_user_id AND condominium_id IS NOT NULL;

  IF v_exists > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_has_condominium',
      'message', 'Você já está vinculado a um condomínio.'
    );
  END IF;

  -- Buscar condomínio pelo código
  SELECT id, name INTO v_condo
  FROM public.condominiums
  WHERE invite_code = upper(trim(p_invite_code));

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'not_found',
      'message', 'Código de convite inválido. Verifique e tente novamente.'
    );
  END IF;

  -- Vincular o usuário ao condomínio
  UPDATE public.profiles
  SET condominium_id = v_condo.id
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'condominium_id', v_condo.id,
    'name', v_condo.name,
    'message', 'Bem-vindo ao ' || v_condo.name || '!'
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_condominium_by_code TO authenticated;


-- 4. Policy: permitir que usuários autenticados leiam condominiums (para o dropdown)
DROP POLICY IF EXISTS "Anyone can view condominiums" ON public.condominiums;
CREATE POLICY "Anyone can view condominiums"
  ON public.condominiums FOR SELECT
  USING (true);

-- Habilitar RLS se não estiver habilitado
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

-- Policy: permitir insert por autenticados (para a RPC funcionar)
DROP POLICY IF EXISTS "Authenticated users can create condominiums" ON public.condominiums;
CREATE POLICY "Authenticated users can create condominiums"
  ON public.condominiums FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);
