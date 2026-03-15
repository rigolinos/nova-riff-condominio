-- Adicionar esporte airsoft que estava faltando
INSERT INTO sports (name) VALUES ('Airsoft')
ON CONFLICT (name) DO NOTHING;