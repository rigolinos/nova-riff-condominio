-- ============================================================
-- SPRINT 1: Segurança, Integridade e Timezone
-- Riff Sports 2.0
-- ============================================================

-- ------------------------------------------------------------
-- 1. TIMESTAMPTZ: Garante que reservas usem timezone correto
--    Refinamento do especialista: previne bugs de fuso horário
-- ------------------------------------------------------------

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS start_datetime_utc TIMESTAMPTZ;

-- Backfill: converte as reservas existentes para TIMESTAMPTZ
UPDATE public.events
  SET start_datetime_utc = (date::TEXT || 'T' || COALESCE(time::TEXT, '00:00') || ':00Z')::TIMESTAMPTZ
  WHERE start_datetime_utc IS NULL AND date IS NOT NULL;

-- Adiciona campo de expiração para matchmaking (status efêmero)
ALTER TABLE public.matchmaking_requests
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Por padrão, requests expiram em 4 horas após a criação
UPDATE public.matchmaking_requests
  SET expires_at = created_at + INTERVAL '4 hours'
  WHERE expires_at IS NULL;


-- ------------------------------------------------------------
-- 2. RPC ANTI-RACE-CONDITION: Reserva atômica de espaço
--    Garante que dois usuários não consigam reservar o mesmo
--    espaço ao mesmo milissegundo (problema de concorrência).
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_reservation_safe(
  p_title         TEXT,
  p_amenity_id    UUID,
  p_condominium_id UUID,
  p_created_by    UUID,
  p_location      TEXT,
  p_date          DATE,
  p_time          TIME,
  p_start_utc     TIMESTAMPTZ,
  p_max_participants INTEGER DEFAULT 10
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER  -- executa com permissões elevadas para verificar conflitos
AS $$
DECLARE
  v_conflict_count INTEGER;
  v_new_event_id   UUID;
  v_grace_minutes  INTEGER := 30; -- buffer de 30 min entre reservas
BEGIN
  -- TRAVA CONSULTIVA: impede race conditions no nível do banco
  -- Bloqueia outras transações concorrentes para o mesmo espaço+data
  PERFORM pg_advisory_xact_lock(
    hashtext(p_amenity_id::TEXT || p_date::TEXT)
  );

  -- Verifica conflito de horário: existe outra reserva ativa no mesmo espaço + janela de tempo?
  SELECT COUNT(*) INTO v_conflict_count
  FROM public.events
  WHERE amenity_id = p_amenity_id
    AND status IN ('active', 'paused')
    AND date = p_date
    AND ABS(
      EXTRACT(EPOCH FROM (start_datetime_utc - p_start_utc)) / 60
    ) < v_grace_minutes;

  IF v_conflict_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'conflict',
      'message', 'Este espaço já está reservado neste horário. Escolha outro horário.'
    );
  END IF;

  -- Sem conflito: insere a reserva com segurança
  INSERT INTO public.events (
    title, amenity_id, condominium_id, created_by, location,
    date, time, start_datetime_utc, max_participants, status
  )
  VALUES (
    p_title, p_amenity_id, p_condominium_id, p_created_by, p_location,
    p_date, p_time, p_start_utc, p_max_participants, 'active'
  )
  RETURNING id INTO v_new_event_id;

  RETURN jsonb_build_object(
    'success', true,
    'event_id', v_new_event_id
  );
END;
$$;

-- Permissão para usuários autenticados chamarem a RPC
GRANT EXECUTE ON FUNCTION public.create_reservation_safe TO authenticated;


-- ------------------------------------------------------------
-- 3. RPC: Matchmaking com expiração automática
--    Insere request e retorna erro se usuário já tem request ativo
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.create_matchmaking_safe(
  p_user_id        UUID,
  p_condominium_id UUID,
  p_sport_name     TEXT,
  p_time_preference TEXT,
  p_expires_hours  INTEGER DEFAULT 4
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing_count INTEGER;
  v_new_id         UUID;
  v_expires_at     TIMESTAMPTZ;
BEGIN
  -- Verifica se usuário já tem request ativo
  SELECT COUNT(*) INTO v_existing_count
  FROM public.matchmaking_requests
  WHERE user_id = p_user_id
    AND condominium_id = p_condominium_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());

  IF v_existing_count > 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'already_active',
      'message', 'Você já tem um aviso ativo. Cancele-o antes de criar outro.'
    );
  END IF;

  -- Calcula expiração em UTC
  v_expires_at := NOW() + (p_expires_hours || ' hours')::INTERVAL;

  INSERT INTO public.matchmaking_requests (
    user_id, condominium_id, sport_name, time_preference, status, expires_at
  )
  VALUES (
    p_user_id, p_condominium_id, p_sport_name, p_time_preference, 'active', v_expires_at
  )
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_new_id,
    'expires_at', v_expires_at
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_matchmaking_safe TO authenticated;


-- ------------------------------------------------------------
-- 4. JOB AUTOMÁTICO: Expira matchmaking requests vencidos
--    Roda periodicamente para limpar a lista de "Tô Disponível"
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.expire_old_matchmaking_requests()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  UPDATE public.matchmaking_requests
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();

  GET DIAGNOSTICS v_expired_count = ROW_COUNT;
  RETURN v_expired_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.expire_old_matchmaking_requests TO service_role;


-- ------------------------------------------------------------
-- 5. RLS REFORÇADO: Políticas de segurança por linha
-- ------------------------------------------------------------

-- Events: somente criador pode modificar/excluir
DROP POLICY IF EXISTS "Owners can update their own events" ON public.events;
CREATE POLICY "Owners can update their own events"
  ON public.events FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Owners can delete their own events" ON public.events;
CREATE POLICY "Owners can delete their own events"
  ON public.events FOR DELETE
  USING (created_by = auth.uid());

-- Profiles: usuário só lê e edita o próprio perfil
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- Guest Lists: somente criador do evento pode adicionar/remover convidados
DROP POLICY IF EXISTS "Event creator manages guests" ON public.guest_lists;
CREATE POLICY "Event creator manages guests"
  ON public.guest_lists FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_lists.event_id
      AND events.created_by = auth.uid()
    )
  );

-- Amenity checkins: somente o próprio usuário pode criar/encerrar seu checkin
DROP POLICY IF EXISTS "Users manage own checkins" ON public.amenity_checkins;
CREATE POLICY "Users manage own checkins"
  ON public.amenity_checkins FOR ALL
  USING (user_id = auth.uid());


-- ------------------------------------------------------------
-- 6. ÍNDICES: Performance nas queries mais comuns
-- ------------------------------------------------------------

-- Busca de eventos por amenidade + data (usado na verificação de conflito)
CREATE INDEX IF NOT EXISTS idx_events_amenity_date
  ON public.events(amenity_id, date)
  WHERE status IN ('active', 'paused');

-- Busca de matchmaking por condomínio e status
CREATE INDEX IF NOT EXISTS idx_matchmaking_condo_status
  ON public.matchmaking_requests(condominium_id, status, expires_at);

-- Busca de checkins ativos por amenidade
CREATE INDEX IF NOT EXISTS idx_checkins_amenity_status
  ON public.amenity_checkins(amenity_id, status)
  WHERE status = 'active';
