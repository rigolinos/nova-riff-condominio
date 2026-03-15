-- ==========================================
-- FASE 3: CORE FLOWS (MATCHMAKING & CHECK-INS)
-- ==========================================

-- 1. Tabela para Matchmaking ("Tô Disponível")
CREATE TABLE IF NOT EXISTS public.matchmaking_requests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    sport_name TEXT NOT NULL,
    time_preference TEXT, -- Ex: "Hoje à noite", "Agora", etc.
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Matchmaking
ALTER TABLE public.matchmaking_requests ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can view matchmaking in their condominium" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can insert their own matchmaking requests" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can update their own matchmaking requests" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can delete their own matchmaking requests" ON public.matchmaking_requests;

-- Políticas para Matchmaking
CREATE POLICY "Users can view matchmaking in their condominium" 
    ON public.matchmaking_requests FOR SELECT USING (
        condominium_id IN (
            SELECT condominium_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own matchmaking requests" 
    ON public.matchmaking_requests FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own matchmaking requests" 
    ON public.matchmaking_requests FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own matchmaking requests" 
    ON public.matchmaking_requests FOR DELETE USING (
        user_id = auth.uid()
    );


-- 2. Tabela para Check-ins de Amenidades (Lotação ao vivo)
CREATE TABLE IF NOT EXISTS public.amenity_checkins (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Check-ins
ALTER TABLE public.amenity_checkins ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can view checkins in their condominium" ON public.amenity_checkins;
DROP POLICY IF EXISTS "Users can create their own checkins" ON public.amenity_checkins;
DROP POLICY IF EXISTS "Users can checkout their own checkins" ON public.amenity_checkins;

-- Políticas para Check-ins
CREATE POLICY "Users can view checkins in their condominium" 
    ON public.amenity_checkins FOR SELECT USING (
        amenity_id IN (
            SELECT a.id FROM public.amenities a 
            JOIN public.profiles p ON a.condominium_id = p.condominium_id 
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own checkins" 
    ON public.amenity_checkins FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can checkout their own checkins" 
    ON public.amenity_checkins FOR UPDATE USING (
        user_id = auth.uid()
    );


-- 3. Inserir alguns dados Mockados nas novas tabelas para popular a Dashboard inicialmente
-- Descobrindo IDs do ambiente de dev (Certifique-se que o usuário e o condomínio existem)
DO $$ 
DECLARE
    v_condo_id UUID;
    v_user_id UUID;
    v_amenity_id UUID;
BEGIN
    -- Pegando o ID do Condomínio Riff Sports (criado na Fase 1)
    SELECT id INTO v_condo_id FROM public.condominiums WHERE invite_code = 'RIFFCODE2026' LIMIT 1;
    
    -- Pegando algum perfil existente para simular os donos das requisições
    SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

    -- Pegando o ID de uma Amenity qualquer (ex: Academia)
    SELECT id INTO v_amenity_id FROM public.amenities WHERE condominium_id = v_condo_id LIMIT 1;

    -- Se achou condo e user, e se a tabela de matchmaking ainda estiver vazia
    IF v_condo_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.matchmaking_requests LIMIT 1) THEN
            INSERT INTO public.matchmaking_requests (user_id, condominium_id, sport_name, time_preference)
            VALUES 
                (v_user_id, v_condo_id, 'Tênis', 'Hoje 19h'),
                (v_user_id, v_condo_id, 'Academia', 'Agora'),
                (v_user_id, v_condo_id, 'Futebol', 'Preciso de goleiro');
        END IF;
    END IF;

    -- Se achou amenity, e se a tabela de check-in ainda estiver vazia
    IF v_amenity_id IS NOT NULL AND v_user_id IS NOT NULL THEN
         IF NOT EXISTS (SELECT 1 FROM public.amenity_checkins LIMIT 1) THEN
             INSERT INTO public.amenity_checkins (user_id, amenity_id, status)
             VALUES (v_user_id, v_amenity_id, 'active');
         END IF;
    END IF;
END $$;
