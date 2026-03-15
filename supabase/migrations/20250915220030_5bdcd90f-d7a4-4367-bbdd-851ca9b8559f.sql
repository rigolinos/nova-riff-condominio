-- Desabilitar confirmação de email para facilitar os testes
-- Isso permite que os usuários façam login imediatamente após o cadastro
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;