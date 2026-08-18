-- ============================================================
-- SPRINT 3: Operação Premium
-- Portaria com QR Code + Expiração + Fila de Espera Automática
-- Riff Sports 2.0
-- ============================================================


-- ------------------------------------------------------------
-- 1. TABELA: guest_passes (Passes de Convidados com UUID seguro)
--    O QR Code carrega apenas o `pass_token` (UUID leve).
--    Dados sensíveis ficam no banco, nunca expostos no QR.
-- ------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.guest_passes (
  id              UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  
  -- Token leve e único que vai no QR Code (sem dados sensíveis)
  pass_token      UUID UNIQUE NOT NULL DEFAULT extensions.uuid_generate_v4(),
  
  -- Relacionamentos
  event_id        UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  
  -- Dados do convidado
  guest_name      TEXT NOT NULL,
  guest_document  TEXT,  -- CPF/RG (opcional, não vai no QR)
  
  -- Controle de acesso
  status          TEXT NOT NULL DEFAULT 'active'
                  CHECK (status IN ('active', 'used', 'expired', 'cancelled')),
  
  -- Janela de validade (baseada no TIMESTAMPTZ do evento — Sprint 1)
  valid_from      TIMESTAMPTZ NOT NULL,
  valid_until     TIMESTAMPTZ NOT NULL,  -- evento + 30 min de grace period
  
  -- Auditoria de entrada
  checked_in_at   TIMESTAMPTZ,
  checked_in_by   UUID REFERENCES public.profiles(id),  -- ID do porteiro
  
  -- Metadata
  created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- RLS para guest_passes
ALTER TABLE public.guest_passes ENABLE ROW LEVEL SECURITY;

-- Criador do evento pode criar/ver/cancelar passes
CREATE POLICY "Event organizer manages passes"
  ON public.guest_passes FOR ALL
  USING (
    created_by = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_passes.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Porteiros (role = 'gatekeeper') podem ler e validar passes
CREATE POLICY "Gatekeeper can read active passes"
  ON public.guest_passes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (role = 'gatekeeper' OR role = 'admin')
    )
    OR created_by = auth.uid()
  );

-- Índice para busca rápida por token (chamado a cada scan do porteiro)
CREATE INDEX IF NOT EXISTS idx_guest_passes_token
  ON public.guest_passes(pass_token)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_guest_passes_event
  ON public.guest_passes(event_id, status);


-- ------------------------------------------------------------
-- 2. CAMPO role NA TABELA profiles (para distinguir porteiro)
-- ------------------------------------------------------------

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'resident'
  CHECK (role IN ('resident', 'gatekeeper', 'admin', 'organizer'));


-- ------------------------------------------------------------
-- 3. RPC: validate_guest_pass (Check-in atômico — 1 clique)
--    Chamada pelo porteiro via scan do QR Code.
--    Verifica: token válido + dentro da janela de tempo + status active.
--    Marca como 'used' atomicamente (sem race condition).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.validate_guest_pass(
  p_pass_token    UUID,
  p_gatekeeper_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_pass          public.guest_passes%ROWTYPE;
  v_event_title   TEXT;
  v_now           TIMESTAMPTZ := NOW();
BEGIN
  -- Busca o passe com trava consultiva para evitar duplo scan simultâneo
  SELECT * INTO v_pass
  FROM public.guest_passes
  WHERE pass_token = p_pass_token
  FOR UPDATE;  -- trava a linha durante a transação

  -- Passe não existe
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'not_found',
      'message', 'QR Code inválido ou não encontrado.'
    );
  END IF;

  -- Busca título do evento para mensagem de feedback
  SELECT title INTO v_event_title
  FROM public.events WHERE id = v_pass.event_id;

  -- Passe já foi utilizado
  IF v_pass.status = 'used' THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'already_used',
      'message', 'Este passe já foi utilizado.',
      'guest_name', v_pass.guest_name,
      'checked_in_at', v_pass.checked_in_at
    );
  END IF;

  -- Passe cancelado
  IF v_pass.status = 'cancelled' THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'cancelled',
      'message', 'Este passe foi cancelado pelo organizador.',
      'guest_name', v_pass.guest_name
    );
  END IF;

  -- Passe expirado
  IF v_pass.status = 'expired' OR v_now > v_pass.valid_until THEN
    -- Atualiza status para expired se ainda não estava
    UPDATE public.guest_passes
    SET status = 'expired', updated_at = v_now
    WHERE id = v_pass.id AND status = 'active';

    RETURN jsonb_build_object(
      'success', false,
      'status', 'expired',
      'message', 'Este passe expirou. O evento já encerrou.',
      'guest_name', v_pass.guest_name,
      'valid_until', v_pass.valid_until
    );
  END IF;

  -- Passe ainda não é válido (muito cedo)
  IF v_now < v_pass.valid_from THEN
    RETURN jsonb_build_object(
      'success', false,
      'status', 'not_yet_valid',
      'message', 'Este passe ainda não é válido.',
      'guest_name', v_pass.guest_name,
      'valid_from', v_pass.valid_from
    );
  END IF;

  -- ✅ TUDO OK: Marca como usado atomicamente
  UPDATE public.guest_passes
  SET
    status        = 'used',
    checked_in_at = v_now,
    checked_in_by = p_gatekeeper_id,
    updated_at    = v_now
  WHERE id = v_pass.id;

  RETURN jsonb_build_object(
    'success', true,
    'status', 'checked_in',
    'message', 'Entrada autorizada! ✅',
    'guest_name', v_pass.guest_name,
    'event_title', v_event_title,
    'checked_in_at', v_now
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_guest_pass TO authenticated;


-- ------------------------------------------------------------
-- 4. RPC: expire_old_guest_passes (Job automático de expiração)
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_old_guest_passes()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE public.guest_passes
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND valid_until < NOW();

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_guest_passes TO service_role;


-- ------------------------------------------------------------
-- 5. FILA DE ESPERA: Campo waitlist na tabela event_participants
-- ------------------------------------------------------------

ALTER TABLE public.event_participants
  ADD COLUMN IF NOT EXISTS waitlist_position INTEGER,
  ADD COLUMN IF NOT EXISTS promoted_from_waitlist_at TIMESTAMPTZ;

-- Status 'waiting_list' adicionado ao CHECK constraint
-- (caso o CHECK exista, recriamos com o novo valor)
DO $$
BEGIN
  ALTER TABLE public.event_participants
    DROP CONSTRAINT IF EXISTS event_participants_status_check;

  ALTER TABLE public.event_participants
    ADD CONSTRAINT event_participants_status_check
    CHECK (status IN ('registered', 'waiting_list', 'cancelled', 'attended', 'no_show'));
EXCEPTION WHEN OTHERS THEN
  -- Ignora se constraint não existe ou tem outro nome
  NULL;
END;
$$;

-- Índice para buscar o próximo da fila rapidamente
CREATE INDEX IF NOT EXISTS idx_participants_waitlist
  ON public.event_participants(event_id, waitlist_position)
  WHERE status = 'waiting_list';


-- ------------------------------------------------------------
-- 6. RPC: join_event_or_waitlist (Inscrição com fila automática)
--    Se lotado → entra na fila. Se há vaga → confirma direto.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.join_event_or_waitlist(
  p_event_id UUID,
  p_user_id  UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_event             public.events%ROWTYPE;
  v_current_count     INTEGER;
  v_waitlist_position INTEGER;
  v_already_exists    INTEGER;
BEGIN
  -- Trava consultiva para evitar race condition na contagem de vagas
  PERFORM pg_advisory_xact_lock(hashtext(p_event_id::TEXT || 'participants'));

  SELECT * INTO v_event FROM public.events WHERE id = p_event_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'message', 'Evento não encontrado.');
  END IF;

  -- Verifica se usuário já está inscrito
  SELECT COUNT(*) INTO v_already_exists
  FROM public.event_participants
  WHERE event_id = p_event_id AND user_id = p_user_id
    AND status IN ('registered', 'waiting_list');

  IF v_already_exists > 0 THEN
    RETURN jsonb_build_object('success', false, 'message', 'Você já está inscrito ou na fila.');
  END IF;

  -- Conta participantes confirmados
  SELECT COUNT(*) INTO v_current_count
  FROM public.event_participants
  WHERE event_id = p_event_id AND status = 'registered';

  -- Verifica se há vagas
  IF v_event.max_participants IS NULL OR v_current_count < v_event.max_participants THEN
    -- ✅ Há vaga: inscrição direta
    INSERT INTO public.event_participants (event_id, user_id, status)
    VALUES (p_event_id, p_user_id, 'registered');

    RETURN jsonb_build_object(
      'success', true,
      'status', 'registered',
      'message', 'Inscrição confirmada!'
    );
  ELSE
    -- ❌ Lotado: entra na fila de espera
    SELECT COALESCE(MAX(waitlist_position), 0) + 1 INTO v_waitlist_position
    FROM public.event_participants
    WHERE event_id = p_event_id AND status = 'waiting_list';

    INSERT INTO public.event_participants (event_id, user_id, status, waitlist_position)
    VALUES (p_event_id, p_user_id, 'waiting_list', v_waitlist_position);

    RETURN jsonb_build_object(
      'success', true,
      'status', 'waiting_list',
      'position', v_waitlist_position,
      'message', format('Evento lotado! Você é o %sº da fila de espera.', v_waitlist_position)
    );
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.join_event_or_waitlist TO authenticated;


-- ------------------------------------------------------------
-- 7. TRIGGER: Promoção automática da fila quando alguém cancela
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.promote_from_waitlist()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_next_in_line  public.event_participants%ROWTYPE;
  v_max_participants INTEGER;
  v_confirmed_count  INTEGER;
BEGIN
  -- Só age quando alguém cancela uma inscrição confirmada
  IF OLD.status = 'registered' AND NEW.status = 'cancelled' THEN

    -- Verifica se agora existe vaga
    SELECT max_participants INTO v_max_participants
    FROM public.events WHERE id = NEW.event_id;

    SELECT COUNT(*) INTO v_confirmed_count
    FROM public.event_participants
    WHERE event_id = NEW.event_id AND status = 'registered';

    IF v_max_participants IS NULL OR v_confirmed_count < v_max_participants THEN
      -- Pega o primeiro da fila (menor posição)
      SELECT * INTO v_next_in_line
      FROM public.event_participants
      WHERE event_id = NEW.event_id AND status = 'waiting_list'
      ORDER BY waitlist_position ASC, created_at ASC
      LIMIT 1
      FOR UPDATE;

      IF FOUND THEN
        -- Promove para confirmado
        UPDATE public.event_participants
        SET
          status = 'registered',
          waitlist_position = NULL,
          promoted_from_waitlist_at = NOW()
        WHERE id = v_next_in_line.id;

        -- Re-numera os restantes na fila
        UPDATE public.event_participants
        SET waitlist_position = waitlist_position - 1
        WHERE event_id = NEW.event_id
          AND status = 'waiting_list'
          AND waitlist_position > v_next_in_line.waitlist_position;
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_promote_waitlist ON public.event_participants;
CREATE TRIGGER auto_promote_waitlist
  AFTER UPDATE ON public.event_participants
  FOR EACH ROW EXECUTE FUNCTION public.promote_from_waitlist();
