-- Limpar todos os dados de usuários para começar do zero
-- Primeiro deletar dados das tabelas dependentes
DELETE FROM public.profiles;
DELETE FROM public.event_participants;
DELETE FROM public.events;
DELETE FROM public.user_sports;
DELETE FROM public.user_ratings;
DELETE FROM public.reviews;
DELETE FROM public.notifications;
DELETE FROM public.messages;
DELETE FROM public.event_comments;
DELETE FROM public.club_members;
DELETE FROM public.clubs;

-- Deletar usuários da tabela auth (isso também remove as sessões)
DELETE FROM auth.users;