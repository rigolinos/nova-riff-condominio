-- supabase/seed.sql

-- 1. Create Mock Condominium
INSERT INTO public.condominiums (id, name, invite_code)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Condomínio Riff Sports',
  'RIFF2026'
) ON CONFLICT (id) DO NOTHING;

-- 2. Create Mock Amenities for the Condominium
INSERT INTO public.amenities (id, condominium_id, name, capacity, requires_booking)
VALUES 
  ('22222222-2222-2222-2222-222222222221', '11111111-1111-1111-1111-111111111111', 'Quadra de Tênis', 4, true),
  ('22222222-2222-2222-2222-222222222222', '11111111-1111-1111-1111-111111111111', 'Campo Society', 14, true),
  ('22222222-2222-2222-2222-222222222223', '11111111-1111-1111-1111-111111111111', 'Academia', 15, false),
  ('22222222-2222-2222-2222-222222222224', '11111111-1111-1111-1111-111111111111', 'Piscina Raia', 6, false),
  ('22222222-2222-2222-2222-222222222225', '11111111-1111-1111-1111-111111111111', 'Churrasqueira', 30, true)
ON CONFLICT (id) DO NOTHING;
