-- Permitir que usuários anônimos (na tela de cadastro) possam ler a lista de condomínios
CREATE POLICY "Allow public read access to condominiums"
ON public.condominiums
FOR SELECT
TO public
USING (true);
