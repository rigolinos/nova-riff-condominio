-- Verificar se existe algum usuário sem perfil e criar um trigger melhorado
DO $$
BEGIN
    -- Criar perfis para usuários existentes que não têm perfil
    INSERT INTO public.profiles (user_id, full_name, city, phone, birth_date)
    SELECT 
        au.id,
        COALESCE(au.raw_user_meta_data ->> 'full_name', 'Usuário'),
        'Cidade não informada',
        'Telefone não informado',
        '1990-01-01'::date
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.user_id
    WHERE p.user_id IS NULL;
END $$;