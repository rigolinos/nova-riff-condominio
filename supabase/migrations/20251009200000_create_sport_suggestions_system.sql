-- Migration: Create Sport Suggestions System
-- Description: Sistema completo para usuários sugerirem novas modalidades esportivas

-- ============================================
-- 1. CREATE SPORT_SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sport_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.sport_suggestions IS 'Sugestões de novas modalidades esportivas enviadas pelos usuários';
COMMENT ON COLUMN public.sport_suggestions.sport_name IS 'Nome da modalidade sugerida';
COMMENT ON COLUMN public.sport_suggestions.status IS 'pending: aguardando aprovação, approved: aprovada e adicionada, rejected: rejeitada';
COMMENT ON COLUMN public.sport_suggestions.rejection_reason IS 'Motivo da rejeição (opcional)';

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_user_id ON public.sport_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_status ON public.sport_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_created_at ON public.sport_suggestions(created_at DESC);

-- ============================================
-- 3. ENABLE RLS (ROW LEVEL SECURITY)
-- ============================================
ALTER TABLE public.sport_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.sport_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own suggestions
CREATE POLICY "Users can insert suggestions"
ON public.sport_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all suggestions (placeholder - você define quem é admin)
CREATE POLICY "Admins can view all suggestions"
ON public.sport_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update all suggestions
CREATE POLICY "Admins can update suggestions"
ON public.sport_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- 4. ADD IS_ADMIN COLUMN TO PROFILES (if not exists)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.profiles.is_admin IS 'Indica se o usuário é administrador da plataforma';
  END IF;
END $$;

-- ============================================
-- 5. CREATE FUNCTION TO APPROVE SUGGESTION
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_sport_suggestion(suggestion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport_name TEXT;
  v_user_id UUID;
  v_existing_sport UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar sugestões';
  END IF;

  -- Get suggestion details
  SELECT sport_name, user_id INTO v_sport_name, v_user_id
  FROM sport_suggestions
  WHERE id = suggestion_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada ou já processada';
  END IF;

  -- Check if sport already exists (case-insensitive)
  SELECT id INTO v_existing_sport
  FROM sports
  WHERE LOWER(name) = LOWER(v_sport_name);

  IF v_existing_sport IS NOT NULL THEN
    -- Sport already exists, just update suggestion status
    UPDATE sport_suggestions
    SET 
      status = 'rejected',
      rejection_reason = 'Esta modalidade já existe na plataforma',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      updated_at = NOW()
    WHERE id = suggestion_id;

    -- Notify user
    INSERT INTO notifications (user_id, title, message, type, data, read)
    VALUES (
      v_user_id,
      'Sugestão de modalidade',
      format('Sua sugestão "%s" já existe na plataforma com outro nome.', v_sport_name),
      'suggestion_rejected',
      jsonb_build_object('suggestion_id', suggestion_id, 'sport_name', v_sport_name),
      false
    );
  ELSE
    -- Add new sport to sports table
    INSERT INTO sports (name)
    VALUES (v_sport_name);

    -- Update suggestion status to approved
    UPDATE sport_suggestions
    SET 
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      updated_at = NOW()
    WHERE id = suggestion_id;

    -- Notify user of approval
    INSERT INTO notifications (user_id, title, message, type, data, read)
    VALUES (
      v_user_id,
      'Sugestão aprovada! 🎉',
      format('Sua sugestão "%s" foi aprovada e agora está disponível na plataforma!', v_sport_name),
      'suggestion_approved',
      jsonb_build_object('suggestion_id', suggestion_id, 'sport_name', v_sport_name),
      false
    );
  END IF;
END;
$$;

-- ============================================
-- 6. CREATE FUNCTION TO REJECT SUGGESTION
-- ============================================
CREATE OR REPLACE FUNCTION public.reject_sport_suggestion(
  suggestion_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport_name TEXT;
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar sugestões';
  END IF;

  -- Get suggestion details
  SELECT sport_name, user_id INTO v_sport_name, v_user_id
  FROM sport_suggestions
  WHERE id = suggestion_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada ou já processada';
  END IF;

  -- Update suggestion status to rejected
  UPDATE sport_suggestions
  SET 
    status = 'rejected',
    rejection_reason = reason,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = suggestion_id;

  -- Notify user of rejection
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão de modalidade',
    CASE 
      WHEN reason IS NOT NULL THEN 
        format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport_name, reason)
      ELSE 
        format('Sua sugestão "%s" não foi aprovada desta vez.', v_sport_name)
    END,
    'suggestion_rejected',
    jsonb_build_object(
      'suggestion_id', suggestion_id, 
      'sport_name', v_sport_name,
      'rejection_reason', reason
    ),
    false
  );
END;
$$;

-- ============================================
-- 7. CREATE TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_sport_suggestions_updated_at
  BEFORE UPDATE ON public.sport_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT ON public.sport_suggestions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 9. ADD STATISTICS
-- ============================================
COMMENT ON FUNCTION public.approve_sport_suggestion IS 'Aprova uma sugestão de modalidade e adiciona à tabela sports';
COMMENT ON FUNCTION public.reject_sport_suggestion IS 'Rejeita uma sugestão de modalidade com motivo opcional';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de sugestões de modalidades criado com sucesso!';
  RAISE NOTICE '📊 Tabela: sport_suggestions';
  RAISE NOTICE '🔐 RLS: Habilitado';
  RAISE NOTICE '⚡ Funções: approve_sport_suggestion, reject_sport_suggestion';
END $$;



