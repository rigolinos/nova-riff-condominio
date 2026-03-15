-- =========================================================================
-- SUPER SCRIPT DE INICIALIZAÇÃO "NOVA RIFF CONDOMÍNIO" (IDEMPOTENTE E LIMPO)
-- Este script limpa triggers antigas e cria toda a base do zero para um novo db.
-- =========================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. CONDOMINIUMS & AMENITIES
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read condominiums" ON public.condominiums;
CREATE POLICY "Allow authenticated users to read condominiums" ON public.condominiums FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  requires_booking BOOLEAN DEFAULT true,
  type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated users to read amenities" ON public.amenities;
CREATE POLICY "Allow authenticated users to read amenities" ON public.amenities FOR SELECT TO authenticated USING (true);

-- 2. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  condominium_id UUID REFERENCES public.condominiums(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  profile_photo_url TEXT,
  block_number TEXT,
  apt_number TEXT,
  user_rating NUMERIC(3,2) DEFAULT 5.0,
  total_reviews_received INTEGER DEFAULT 0,
  praise_tags TEXT[] DEFAULT '{}'::TEXT[],
  accessibility_needs TEXT[] DEFAULT '{}'::TEXT[],
  system_role TEXT DEFAULT 'morador' CHECK (system_role IN ('morador', 'sindico', 'master')),
  events_participated INTEGER DEFAULT 0,
  events_created INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

-- 3. USER SPORTS
CREATE TABLE IF NOT EXISTS public.user_sports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  sport_name TEXT NOT NULL,
  skill_level TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(user_id, sport_name)
);
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read all sports" ON public.user_sports;
DROP POLICY IF EXISTS "Users can insert own sports" ON public.user_sports;
DROP POLICY IF EXISTS "Users can delete own sports" ON public.user_sports;
CREATE POLICY "Users can read all sports" ON public.user_sports FOR SELECT USING (true);
CREATE POLICY "Users can insert own sports" ON public.user_sports FOR INSERT WITH CHECK (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));
CREATE POLICY "Users can delete own sports" ON public.user_sports FOR DELETE USING (user_id IN (SELECT id FROM profiles WHERE user_id = auth.uid()));

-- 4. EVENTS & GUEST LISTS & PARTICIPANTS
CREATE TABLE IF NOT EXISTS public.events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID REFERENCES public.condominiums(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES public.amenities(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  date DATE NOT NULL,
  time TIME NOT NULL,
  max_participants INTEGER NOT NULL,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.guest_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);
ALTER TABLE public.guest_lists ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.event_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  UNIQUE(event_id, user_id)
);
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;

-- 5. MATCHMAKING ("TÔ DISPONÍVEL") & CHECKINS
CREATE TABLE IF NOT EXISTS public.matchmaking_requests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    sport_name TEXT NOT NULL,
    time_preference TEXT, 
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.matchmaking_requests ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.amenity_checkins (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
ALTER TABLE public.amenity_checkins ENABLE ROW LEVEL SECURITY;

-- 6. AUTH TRIGGER FOR NEW REGISTRATIONS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, profile_photo_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário ' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- DROP IF EXISTS BEFORE CREATE TO AVOID ERROR
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 7. MOCK DATA BÁSICO (Condomínio Riff Sports)
DO $$ 
DECLARE
    v_condo_id UUID;
BEGIN
    INSERT INTO public.condominiums (name, invite_code)
    VALUES ('Condomínio Riff Sports', 'RIFFCODE2026')
    ON CONFLICT (invite_code) DO NOTHING
    RETURNING id INTO v_condo_id;

    IF v_condo_id IS NULL THEN
        SELECT id INTO v_condo_id FROM public.condominiums WHERE invite_code = 'RIFFCODE2026' LIMIT 1;
    END IF;

    -- AMENIDADES BÁSICAS
    INSERT INTO public.amenities (condominium_id, name, capacity, type) VALUES 
        (v_condo_id, 'Quadra de Tênis', 4, 'Quartos'),
        (v_condo_id, 'Academia', 15, 'Fitness'),
        (v_condo_id, 'Piscina', 30, 'Clube'),
        (v_condo_id, 'Churrasqueira', 20, 'Lazer')
    ON CONFLICT DO NOTHING;
END $$;
