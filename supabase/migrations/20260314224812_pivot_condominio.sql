-- Add extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create condominiums table
CREATE TABLE IF NOT EXISTS public.condominiums (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on RLS for condominiums
ALTER TABLE public.condominiums ENABLE ROW LEVEL SECURITY;

-- Allow read access for authenticated users to condominiums
CREATE POLICY "Allow authenticated users to read condominiums"
  ON public.condominiums
  FOR SELECT
  TO authenticated
  USING (true);

-- 2. Create amenities table (Spaces/Infrastructure)
CREATE TABLE IF NOT EXISTS public.amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  capacity INTEGER,
  requires_booking BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on RLS for amenities
ALTER TABLE public.amenities ENABLE ROW LEVEL SECURITY;

-- Allow read access to amenities for authenticated users
CREATE POLICY "Allow authenticated users to read amenities"
  ON public.amenities
  FOR SELECT
  TO authenticated
  USING (true);

-- 3. Alter profiles table to add condominium relations
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS condominium_id UUID REFERENCES public.condominiums(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS block_number TEXT,
  ADD COLUMN IF NOT EXISTS apt_number TEXT;

-- 4. Alter events table to link to amenities and condominiums, making location options nullable
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS amenity_id UUID REFERENCES public.amenities(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS condominium_id UUID REFERENCES public.condominiums(id) ON DELETE CASCADE;

-- 5. Create guest_lists table (For Portaria)
CREATE TABLE IF NOT EXISTS public.guest_lists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  guest_name TEXT NOT NULL,
  guest_document TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- Turn on RLS for guest lists
ALTER TABLE public.guest_lists ENABLE ROW LEVEL SECURITY;

-- Allow users to manage their own event guest lists, and others to view
CREATE POLICY "Event creators can manage guest lists"
  ON public.guest_lists
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.events
      WHERE events.id = guest_lists.event_id
      AND events.created_by = auth.uid()
    )
  );

CREATE POLICY "Attendees can view guest lists"
  ON public.guest_lists
  FOR SELECT
  TO authenticated
  USING (true);
