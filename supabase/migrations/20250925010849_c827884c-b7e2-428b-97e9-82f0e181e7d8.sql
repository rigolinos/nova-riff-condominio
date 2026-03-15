-- Criar função para criar perfil automaticamente quando um usuário se cadastra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    birth_date,
    phone,
    city,
    profile_photo_url,
    gender
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    '1990-01-01', -- Data padrão que será atualizada no onboarding
    '', -- Telefone será preenchido no onboarding
    '', -- Cidade será preenchida no onboarding
    NEW.raw_user_meta_data->>'avatar_url',
    null -- Gênero será preenchido no onboarding
  );
  
  RETURN NEW;
END;
$$;

-- Criar trigger para executar a função quando um novo usuário é criado
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Tornar campos opcionais para permitir criação inicial com valores padrão
ALTER TABLE public.profiles 
ALTER COLUMN birth_date SET DEFAULT '1990-01-01',
ALTER COLUMN phone SET DEFAULT '',
ALTER COLUMN city SET DEFAULT '',
ALTER COLUMN full_name SET DEFAULT 'Usuário';

-- Permitir valores nulos ou vazios temporariamente
ALTER TABLE public.profiles 
ALTER COLUMN birth_date DROP NOT NULL,
ALTER COLUMN phone DROP NOT NULL,
ALTER COLUMN city DROP NOT NULL;