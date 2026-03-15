-- ==========================================
-- SCRIPT DE MOCK DE DADOS FASE 3 (COMPLETO)
-- Cria: Condomínio, Amenidades, Perfis Falsos, Eventos, Check-ins e Matchmaking
-- ==========================================

DO $$ 
DECLARE
    v_condo_id UUID;
    v_quadra_id UUID;
    v_acad_id UUID;
    v_piscina_id UUID;
    v_user1_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
BEGIN
    -- 1. CRIAR CONDOMÍNIO
    INSERT INTO public.condominiums (name, invite_code)
    VALUES ('Condomínio Riff Sports', 'RIFFCODE2026')
    ON CONFLICT (invite_code) DO NOTHING
    RETURNING id INTO v_condo_id;

    IF v_condo_id IS NULL THEN
        SELECT id INTO v_condo_id FROM public.condominiums WHERE invite_code = 'RIFFCODE2026' LIMIT 1;
    END IF;

    -- 2. CRIAR AMENIDADES DO CONDOMÍNIO
    INSERT INTO public.amenities (condominium_id, name, capacity, type) VALUES 
        (v_condo_id, 'Quadra de Tênis', 4, 'Quartos'),
        (v_condo_id, 'Academia', 15, 'Fitness'),
        (v_condo_id, 'Piscina', 30, 'Clube'),
        (v_condo_id, 'Churrasqueira', 20, 'Lazer')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_quadra_id FROM public.amenities WHERE name = 'Quadra de Tênis' AND condominium_id = v_condo_id LIMIT 1;
    SELECT id INTO v_acad_id FROM public.amenities WHERE name = 'Academia' AND condominium_id = v_condo_id LIMIT 1;
    SELECT id INTO v_piscina_id FROM public.amenities WHERE name = 'Piscina' AND condominium_id = v_condo_id LIMIT 1;

    -- 3. CRIAR USUÁRIOS FAKE DE TESTE
    -- Nota: Como Auth do Supabase é separado da tabela Profiles, inserimos mock na Profiles
    -- Eles não poderão logar, mas aparecerão nas listas e ranks
    INSERT INTO public.profiles (user_id, condominium_id, full_name, block_number, apt_number, user_rating, total_reviews_received) 
    VALUES 
        (uuid_generate_v4(), v_condo_id, 'João Silva', 'A', '101', 4.8, 12),
        (uuid_generate_v4(), v_condo_id, 'Maria Souza', 'B', '202', 4.9, 8),
        (uuid_generate_v4(), v_condo_id, 'Carlos Pereira', 'A', '305', 4.2, 3)
    RETURNING id INTO v_user1_id; -- Pega apenas o primeiro para usar de ref

    SELECT id INTO v_user2_id FROM public.profiles WHERE full_name = 'Maria Souza' LIMIT 1;
    SELECT id INTO v_user3_id FROM public.profiles WHERE full_name = 'Carlos Pereira' LIMIT 1;

    -- 4. CRIAR JOGOS (RESERVAS DE AMENIDADES)
    -- Evento para amanhã
    INSERT INTO public.events (title, condominium_id, amenity_id, location, date, time, max_participants, created_by, status)
    VALUES 
        ('Treino Tênis Duplas', v_condo_id, v_quadra_id, 'Quadra de Tênis', CURRENT_DATE + INTERVAL '1 day', '18:00', 4, v_user1_id, 'active'),
        ('Racha de Condomínio', v_condo_id, v_quadra_id, 'Quadra de Tênis', CURRENT_DATE + INTERVAL '2 days', '10:00', 4, v_user2_id, 'active');

    -- 5. CRIAR MATCHMAKING ("TÔ DISPONÍVEL")
    INSERT INTO public.matchmaking_requests (user_id, condominium_id, sport_name, time_preference, status)
    VALUES 
        (v_user1_id, v_condo_id, 'Tênis', 'Hoje à noite', 'active'),
        (v_user2_id, v_condo_id, 'Vôlei', 'Final de semana', 'active'),
        (v_user3_id, v_condo_id, 'Academia (Parceiro de Treino)', 'Agora', 'active');

    -- 6. CRIAR CHECK-INS (GENTE USANDO AGORA)
    INSERT INTO public.amenity_checkins (user_id, amenity_id, status)
    VALUES 
        (v_user1_id, v_acad_id, 'active'),
        (v_user2_id, v_acad_id, 'active'),
        (v_user3_id, v_piscina_id, 'active');

END $$;
