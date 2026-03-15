-- Inserting a mock condominium to test the signup flow without an invite code
INSERT INTO public.condominiums (name, invite_code, address, city, state, zip_code)
VALUES ('Condomínio Riff Sports', 'RIFFCODE2026', 'Rua dos Esportes, 123', 'Curitiba', 'PR', '80000-000')
ON CONFLICT (invite_code) DO NOTHING;
