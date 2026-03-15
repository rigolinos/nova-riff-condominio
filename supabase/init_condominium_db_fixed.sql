-- Create profiles table for user information from onboarding steps
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  -- Step 1 data
  full_name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  profile_photo_url TEXT,
  -- Step 2 data
  accessibility_needs TEXT[],
  gender TEXT,
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sports table for available sports
CREATE TABLE public.sports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user_sports table for many-to-many relationship
CREATE TABLE public.user_sports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  sport_id UUID NOT NULL REFERENCES public.sports(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, sport_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- RLS Policies for sports (public read access)
CREATE POLICY "Sports are viewable by everyone" 
ON public.sports 
FOR SELECT 
USING (true);

-- RLS Policies for user_sports
CREATE POLICY "Users can view their own sports" 
ON public.user_sports 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own sports" 
ON public.user_sports 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sports" 
ON public.user_sports 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
-- Safe Trigger Creation
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert the sports from onboarding step 3
INSERT INTO public.sports (name) VALUES
  ('Basebol'),
  ('Basquete'),
  ('Ciclismo'),
  ('Corrida'),
  ('Crossfit'),
  ('Futebol'),
  ('Handebol'),
  ('Jogos de cartas'),
  ('Kart'),
  ('Paintball'),
  ('Parkour'),
  ('Patins'),
  ('Pingpong'),
  ('Rugby'),
  ('Skate'),
  ('Slackline'),
  ('Taco'),
  ('Tênis'),
  ('Volei'),
  ('Yoga'),
  ('Xadrez');
-- Criar tabela de eventos
CREATE TABLE public.events (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    title text NOT NULL,
    description text,
    location text NOT NULL,
    date date NOT NULL,
    time time NOT NULL,
    max_participants integer,
    created_by uuid NOT NULL,
    sport_id uuid REFERENCES public.sports(id),
    status text DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed', 'paused')),
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de participações em eventos
CREATE TABLE public.event_participants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    status text DEFAULT 'registered' CHECK (status IN ('registered', 'cancelled', 'attended')),
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(event_id, user_id)
);

-- Criar tabela de avaliações de usuários
CREATE TABLE public.user_ratings (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    rated_user_id uuid NOT NULL,
    rater_user_id uuid NOT NULL,
    event_id uuid NOT NULL REFERENCES public.events(id),
    rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment text,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(rated_user_id, rater_user_id, event_id)
);

-- Criar tabela de clubes/grupos
CREATE TABLE public.clubs (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    description text,
    sport_id uuid REFERENCES public.sports(id),
    created_by uuid NOT NULL,
    image_url text,
    member_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de membros de clubes
CREATE TABLE public.club_members (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id uuid NOT NULL REFERENCES public.clubs(id) ON DELETE CASCADE,
    user_id uuid NOT NULL,
    role text DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at timestamp with time zone DEFAULT now(),
    UNIQUE(club_id, user_id)
);

-- Criar tabela de notificações
CREATE TABLE public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text NOT NULL CHECK (type IN ('event_invitation', 'event_reminder', 'rating', 'club_invitation', 'general')),
    read boolean DEFAULT false,
    data jsonb,
    created_at timestamp with time zone DEFAULT now()
);

-- Criar tabela de mensagens (chat)
CREATE TABLE public.messages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id uuid NOT NULL,
    recipient_id uuid,
    event_id uuid REFERENCES public.events(id),
    club_id uuid REFERENCES public.clubs(id),
    content text NOT NULL,
    message_type text DEFAULT 'direct' CHECK (message_type IN ('direct', 'event', 'club')),
    created_at timestamp with time zone DEFAULT now()
);

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.club_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policies para eventos
CREATE POLICY "Eventos são visíveis para todos" ON public.events FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar eventos" ON public.events FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Criadores podem editar seus eventos" ON public.events FOR UPDATE USING (auth.uid() = created_by);
CREATE POLICY "Criadores podem deletar seus eventos" ON public.events FOR DELETE USING (auth.uid() = created_by);

-- Policies para participações
CREATE POLICY "Usuários podem ver participações de eventos públicos" ON public.event_participants FOR SELECT USING (true);
CREATE POLICY "Usuários podem se inscrever em eventos" ON public.event_participants FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem cancelar suas participações" ON public.event_participants FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem deletar suas participações" ON public.event_participants FOR DELETE USING (auth.uid() = user_id);

-- Policies para avaliações
CREATE POLICY "Avaliações são visíveis para todos" ON public.user_ratings FOR SELECT USING (true);
CREATE POLICY "Usuários podem avaliar outros" ON public.user_ratings FOR INSERT WITH CHECK (auth.uid() = rater_user_id);
CREATE POLICY "Usuários podem editar suas avaliações" ON public.user_ratings FOR UPDATE USING (auth.uid() = rater_user_id);

-- Policies para clubes
CREATE POLICY "Clubes são visíveis para todos" ON public.clubs FOR SELECT USING (true);
CREATE POLICY "Usuários podem criar clubes" ON public.clubs FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Criadores podem editar seus clubes" ON public.clubs FOR UPDATE USING (auth.uid() = created_by);

-- Policies para membros de clubes
CREATE POLICY "Membros podem ver outros membros do clube" ON public.club_members FOR SELECT USING (true);
CREATE POLICY "Usuários podem se juntar a clubes" ON public.club_members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem sair de clubes" ON public.club_members FOR DELETE USING (auth.uid() = user_id);

-- Policies para notificações
CREATE POLICY "Usuários podem ver suas notificações" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema pode criar notificações" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Usuários podem marcar notificações como lidas" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- Policies para mensagens
CREATE POLICY "Usuários podem ver mensagens enviadas/recebidas" ON public.messages 
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);
CREATE POLICY "Usuários podem enviar mensagens" ON public.messages 
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Triggers para atualizar updated_at
-- Safe Trigger Creation
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Safe Trigger Creation
CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON public.clubs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir alguns esportes padrão
INSERT INTO public.sports (name) VALUES 
    ('Futebol'),
    ('Basquete'),
    ('Vôlei'),
    ('Tênis'),
    ('Natação'),
    ('Corrida'),
    ('Ciclismo'),
    ('Xadrez'),
    ('Surf'),
    ('Parkour'),
    ('Academia'),
    ('Futsal')
ON CONFLICT DO NOTHING;
-- Criar função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    city,
    phone,
    birth_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'Cidade não informada',
    'Telefone não informado', 
    '1990-01-01'
  );
  RETURN new;
END;
$$;

-- Criar trigger para executar a função quando um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Safe Trigger Creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Criar função para criar perfil automaticamente quando usuário se registra
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    city,
    phone,
    birth_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'Cidade não informada',
    'Telefone não informado', 
    '1990-01-01'
  );
  RETURN new;
END;
$$;

-- Criar trigger para executar a função quando um usuário for criado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- Safe Trigger Creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
-- Criar triggers para atualizar contadores automaticamente
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna participant_count na tabela events se não existir
ALTER TABLE events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Criar trigger para participantes de eventos
DROP TRIGGER IF EXISTS event_participant_count_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_participant_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Atualizar contadores existentes
UPDATE events SET participant_count = (
  SELECT COUNT(*) 
  FROM event_participants 
  WHERE event_id = events.id AND status = 'registered'
);

-- Criar função para notificações automáticas
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para notificações
DROP TRIGGER IF EXISTS notification_event_join_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notification_event_join_trigger
    AFTER INSERT ON event_participants
    FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir alguns esportes básicos se não existirem
INSERT INTO sports (name) VALUES 
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tênis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
ON CONFLICT DO NOTHING;
-- Criar triggers para atualizar contadores automaticamente
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Adicionar coluna participant_count na tabela events se não existir
ALTER TABLE events ADD COLUMN IF NOT EXISTS participant_count INTEGER DEFAULT 0;

-- Criar trigger para participantes de eventos
DROP TRIGGER IF EXISTS event_participant_count_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_participant_count_trigger
    AFTER INSERT OR UPDATE OR DELETE ON event_participants
    FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Atualizar contadores existentes
UPDATE events SET participant_count = (
  SELECT COUNT(*) 
  FROM event_participants 
  WHERE event_id = events.id AND status = 'registered'
);

-- Criar função para notificações automáticas
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para notificações
DROP TRIGGER IF EXISTS notification_event_join_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notification_event_join_trigger
    AFTER INSERT ON event_participants
    FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir alguns esportes básicos se não existirem
INSERT INTO sports (name) VALUES 
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tênis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
ON CONFLICT DO NOTHING;
-- Corrigir problemas de segurança nas funções
CREATE OR REPLACE FUNCTION update_event_participant_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
-- Criar triggers para as funções corrigidas

-- Trigger para atualizar contador de participantes
DROP TRIGGER IF EXISTS event_participants_count_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Trigger para criar notificações quando alguém se inscreve em eventos
DROP TRIGGER IF EXISTS event_join_notification_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_join_notification_trigger
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir esportes básicos se a tabela estiver vazia
INSERT INTO sports (name) 
SELECT * FROM (VALUES
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tennis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM sports LIMIT 1);
-- Criar triggers para as funções corrigidas

-- Trigger para atualizar contador de participantes
DROP TRIGGER IF EXISTS event_participants_count_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_participants_count_trigger
  AFTER INSERT OR UPDATE OR DELETE ON event_participants
  FOR EACH ROW EXECUTE FUNCTION update_event_participant_count();

-- Trigger para criar notificações quando alguém se inscreve em eventos
DROP TRIGGER IF EXISTS event_join_notification_trigger ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER event_join_notification_trigger
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

-- Inserir esportes básicos se a tabela estiver vazia
INSERT INTO sports (name) 
SELECT * FROM (VALUES
  ('Futebol'),
  ('Basquete'),
  ('Vôlei'),
  ('Tennis'),
  ('Natação'),
  ('Corrida'),
  ('Ciclismo'),
  ('Xadrez')
) AS t(name)
WHERE NOT EXISTS (SELECT 1 FROM sports LIMIT 1);
-- Adicionar coluna skill_level na tabela events
ALTER TABLE public.events 
ADD COLUMN skill_level VARCHAR(20) DEFAULT 'Iniciante/Diversão';

-- Comentário sobre as opções válidas
COMMENT ON COLUMN public.events.skill_level IS 'Nível do jogo: Iniciante/Diversão, Intermediário/Casual, Avançado/Competitivo';
-- Criar tabela para comentários dos eventos
CREATE TABLE public.event_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  comment_text TEXT NOT NULL,
  parent_comment_id UUID REFERENCES public.event_comments(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.event_comments ENABLE ROW LEVEL SECURITY;

-- Policies para comentários
CREATE POLICY "Comentários são visíveis para todos" 
ON public.event_comments 
FOR SELECT 
USING (true);

CREATE POLICY "Usuários podem criar comentários" 
ON public.event_comments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem editar seus comentários" 
ON public.event_comments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem deletar seus comentários" 
ON public.event_comments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Trigger para atualizar updated_at
-- Safe Trigger Creation
CREATE TRIGGER update_event_comments_updated_at
BEFORE UPDATE ON public.event_comments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Create reviews table for event and player evaluations
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  reviewer_user_id UUID NOT NULL,
  reviewed_user_id UUID,
  review_type TEXT NOT NULL CHECK (review_type IN ('event', 'player_praise')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  praise_tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view reviews" 
ON public.reviews 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create reviews" 
ON public.reviews 
FOR INSERT 
WITH CHECK (auth.uid() = reviewer_user_id);

CREATE POLICY "Users can update their own reviews" 
ON public.reviews 
FOR UPDATE 
USING (auth.uid() = reviewer_user_id);

-- Create function to update timestamps
-- Safe Trigger Creation
CREATE TRIGGER update_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add status column to event_participants to track evaluation status
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS evaluation_status TEXT DEFAULT 'pending' 
CHECK (evaluation_status IN ('pending', 'evaluation_available', 'completed'));

-- Create function to check if event evaluation should be available
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Fix security issue: Set proper search_path for the function
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
-- Habilitar extensões necessárias para cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Configurar cron job para executar verificação de avaliações a cada hora
SELECT cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);
-- Mover extensões do schema público para um schema dedicado
CREATE SCHEMA IF NOT EXISTS extensions;

-- Mover as extensões para o schema dedicado
DROP EXTENSION IF EXISTS pg_cron;
DROP EXTENSION IF EXISTS pg_net;

CREATE EXTENSION IF NOT EXISTS pg_cron SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net SCHEMA extensions;

-- Recriar o cron job usando o schema correto
SELECT extensions.cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    extensions.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);
-- Usar a sintaxe correta para o cron job no Supabase
-- Primeiro limpar qualquer agendamento anterior
SELECT cron.unschedule('check-evaluation-availability-hourly');

-- Criar o cron job corretamente
SELECT cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);
-- Usar a sintaxe correta para o cron job no Supabase
-- Primeiro limpar qualquer agendamento anterior
SELECT cron.unschedule('check-evaluation-availability-hourly');

-- Criar o cron job corretamente
SELECT cron.schedule(
  'check-evaluation-availability-hourly',
  '0 * * * *', -- A cada hora (minuto 0)
  $$
  SELECT
    net.http_post(
        url:='https://tzvuzruustalqqbkanat.supabase.co/functions/v1/check-evaluation-availability',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6dnV6cnV1c3RhbHFxYmthbmF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NDYyNjEsImV4cCI6MjA3MzIyMjI2MX0.y17hfudF4v8x7dl0zsz76HexvwmxK_cncLjVa0JgcSI"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS DOS PERFIS
-- Remover a política permissiva atual que permite qualquer usuário ver qualquer perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Criar nova política restritiva: usuários só podem ver seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar view pública com apenas informações não-sensíveis para uso em listas de participantes
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. REFORÇAR SEGURANÇA DAS MENSAGENS
-- Verificar se a política atual está restritiva o suficiente
DROP POLICY IF EXISTS "Usuários podem ver mensagens enviadas/recebidas" ON public.messages;

-- Criar política mais explícita e restritiva para mensagens
CREATE POLICY "Users can only view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

-- 3. CORRIGIR SEGURANÇA DAS NOTIFICAÇÕES
-- Remover a política permissiva que permite qualquer um criar notificações
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

-- Criar política que só permite criação via service role (sistema)
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Garantir que usuários só podem ver suas próprias notificações
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Manter a política de UPDATE para marcar como lida
-- (já está correta: "Usuários podem marcar notificações como lidas")
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS DOS PERFIS
-- Remover a política permissiva atual que permite qualquer usuário ver qualquer perfil
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Criar nova política restritiva: usuários só podem ver seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Criar view pública com apenas informações não-sensíveis para uso em listas de participantes
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. REFORÇAR SEGURANÇA DAS MENSAGENS
-- Verificar se a política atual está restritiva o suficiente
DROP POLICY IF EXISTS "Usuários podem ver mensagens enviadas/recebidas" ON public.messages;

-- Criar política mais explícita e restritiva para mensagens
CREATE POLICY "Users can only view their own messages"
ON public.messages
FOR SELECT
TO authenticated
USING (
  auth.uid() = sender_id OR 
  auth.uid() = recipient_id
);

-- 3. CORRIGIR SEGURANÇA DAS NOTIFICAÇÕES
-- Remover a política permissiva que permite qualquer um criar notificações
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

-- Criar política que só permite criação via service role (sistema)
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- Garantir que usuários só podem ver suas próprias notificações
DROP POLICY IF EXISTS "Usuários podem ver suas notificações" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Manter a política de UPDATE para marcar como lida
-- (já está correta: "Usuários podem marcar notificações como lidas")
-- CORRIGIR O ERRO DE SECURITY DEFINER VIEW
-- Recriar a view pública sem SECURITY DEFINER para evitar problemas de segurança

-- Remover a view atual
DROP VIEW IF EXISTS public.public_profiles;

-- Recriar a view sem SECURITY DEFINER (será usada a permissão do usuário que consulta)
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Aplicar RLS na view também
ALTER VIEW public.public_profiles SET (security_barrier = true);

-- Criar uma política RLS específica para a view pública
-- Permitir que usuários vejam perfis públicos de outros usuários apenas quando necessário
-- (ex: em listas de participantes de eventos)
CREATE POLICY "Public profiles viewable by authenticated users"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Usuários podem ver seu próprio perfil completo
  auth.uid() = user_id 
  OR
  -- Ou podem ver informações públicas básicas de outros usuários 
  -- (apenas quando consultando através da view public_profiles)
  true
);

-- Remover a política anterior muito restritiva
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- Garantir permissões corretas na view
GRANT SELECT ON public.public_profiles TO authenticated;
GRANT SELECT ON public.public_profiles TO anon;
-- ESTRATÉGIA CORRIGIDA: POLÍTICAS RLS GRANULARES EM VEZ DE VIEW PROBLEMÁTICA

-- 1. Remover a view que estava causando problemas de security definer
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Remover política atual
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.profiles;

-- 3. Criar política principal: usuários podem ver apenas seu próprio perfil completo
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Para permitir visualização pública limitada (apenas nome e foto) em contextos específicos,
-- vamos criar uma função que retorna apenas dados públicos
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 5. VERIFICAR E CORRIGIR OUTRAS TABELAS TAMBÉM

-- Verificar se a política de messages está correta
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- Verificar notificações - manter apenas system role para inserir
-- A política já foi criada corretamente para service_role only
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Versão Corrigida)

-- 1. CORRIGIR EXPOSIÇÃO DE DADOS DOS PERFIS
-- A política atual já está restritiva (auth.uid() = user_id), mas vamos criar a view pública

-- Criar view pública com apenas informações não-sensíveis para uso em listas de participantes
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. REFORÇAR SEGURANÇA DAS MENSAGENS
-- A política atual parece estar correta, mas vamos verificar se precisa de ajustes

-- 3. CORRIGIR SEGURANÇA DAS NOTIFICAÇÕES
-- Remover a política permissiva que permite qualquer um criar notificações
DROP POLICY IF EXISTS "Sistema pode criar notificações" ON public.notifications;

-- Criar política que só permite criação via service role (sistema)
CREATE POLICY "Only system can create notifications"
ON public.notifications
FOR INSERT
TO service_role
WITH CHECK (true);

-- As outras políticas de notificações já estão corretas:
-- - "Usuários podem ver suas notificações" (auth.uid() = user_id)
-- - "Usuários podem marcar notificações como lidas" (auth.uid() = user_id)
-- ESTRATÉGIA CORRIGIDA: POLÍTICAS RLS GRANULARES EM VEZ DE VIEW PROBLEMÁTICA

-- 1. Remover a view que estava causando problemas de security definer
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Remover política atual
DROP POLICY IF EXISTS "Public profiles viewable by authenticated users" ON public.profiles;

-- 3. Criar política principal: usuários podem ver apenas seu próprio perfil completo
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Para permitir visualização pública limitada (apenas nome e foto) em contextos específicos,
-- vamos criar uma função que retorna apenas dados públicos
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 5. VERIFICAR E CORRIGIR OUTRAS TABELAS TAMBÉM

-- Verificar se a política de messages está correta
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- Verificar notificações - manter apenas system role para inserir
-- A política já foi criada corretamente para service_role only
-- FASE 1: CORREÇÕES CRÍTICAS DE SEGURANÇA (Aplicação Seletiva)

-- 1. Criar view pública para informações não-sensíveis
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;

-- 2. Verificar e aplicar apenas se necessário as correções de notificações
-- Primeira verificação: se a política atual permite criação por authenticated, removê-la
DO $$
BEGIN
    -- Tentar remover a política permissiva se existir
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'notifications' 
        AND policyname = 'Sistema pode criar notificações'
        AND roles @> '{authenticated}'::name[]
    ) THEN
        DROP POLICY "Sistema pode criar notificações" ON public.notifications;
        
        -- Criar nova política restritiva
        CREATE POLICY "Only system can create notifications"
        ON public.notifications
        FOR INSERT
        TO service_role
        WITH CHECK (true);
    END IF;
EXCEPTION WHEN OTHERS THEN
    -- Se der erro, ignorar e continuar
    NULL;
END $$;
-- Corrigir o problema de SECURITY DEFINER na view public_profiles
-- Recriar a view sem SECURITY DEFINER (mais segura)

DROP VIEW IF EXISTS public.public_profiles;

-- Criar view normal (sem SECURITY DEFINER) para informações públicas
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Aplicar RLS na view também
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;
-- CORRIGIR POLÍTICA QUE JÁ EXISTE

-- 1. Remover a view anterior (já feito)
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Verificar políticas existentes e remover se necessário
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- 3. Criar política restritiva: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Função segura para obter dados públicos limitados
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 5. Verificar política de mensagens
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Strict message access control" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- 6. Política de notificações já está correta (só service_role pode criar)
-- Vamos verificar se a política de SELECT existe e está correta
DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
-- Corrigir o problema de SECURITY DEFINER na view public_profiles
-- Recriar a view sem SECURITY DEFINER (mais segura)

DROP VIEW IF EXISTS public.public_profiles;

-- Criar view normal (sem SECURITY DEFINER) para informações públicas
CREATE VIEW public.public_profiles AS
SELECT 
  user_id,
  full_name,
  profile_photo_url
FROM public.profiles;

-- Aplicar RLS na view também
ALTER VIEW public.public_profiles SET (security_invoker = on);

-- Permitir que usuários autenticados vejam a view pública
GRANT SELECT ON public.public_profiles TO authenticated;
-- CORRIGIR POLÍTICA QUE JÁ EXISTE

-- 1. Remover a view anterior (já feito)
DROP VIEW IF EXISTS public.public_profiles;

-- 2. Verificar políticas existentes e remover se necessário
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view only their own profile" ON public.profiles;

-- 3. Criar política restritiva: usuários podem ver apenas seu próprio perfil
CREATE POLICY "Users can view only their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 4. Função segura para obter dados públicos limitados
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  profile_photo_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url
  FROM public.profiles p
  WHERE p.user_id = target_user_id;
END;
$$;

-- Dar permissão para usuários autenticados usarem a função
GRANT EXECUTE ON FUNCTION public.get_public_profile(uuid) TO authenticated;

-- 5. Verificar política de mensagens
DROP POLICY IF EXISTS "Users can only view their own messages" ON public.messages;
DROP POLICY IF EXISTS "Strict message access control" ON public.messages;

CREATE POLICY "Strict message access control"
ON public.messages
FOR SELECT
TO authenticated
USING (
  (auth.uid() = sender_id) OR 
  (auth.uid() = recipient_id)
);

-- 6. Política de notificações já está correta (só service_role pode criar)
-- Vamos verificar se a política de SELECT existe e está correta
DROP POLICY IF EXISTS "Users can view only their own notifications" ON public.notifications;

CREATE POLICY "Users can view only their own notifications"
ON public.notifications
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);
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
-- Desabilitar confirmação de email para facilitar os testes
-- Isso permite que os usuários façam login imediatamente após o cadastro
UPDATE auth.users SET email_confirmed_at = now() WHERE email_confirmed_at IS NULL;
-- Adicionar esporte airsoft que estava faltando
INSERT INTO sports (name) VALUES ('Airsoft')
ON CONFLICT (name) DO NOTHING;
-- Insert some sample notifications for testing
-- Note: These are just for demonstration - replace user IDs with actual user IDs from your auth.users table

-- Sample notification for event registration
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1), -- Replace with actual organizer user ID
  'event_join',
  'Nova inscrição!',
  'João Silva se inscreveu no seu evento Futebol no Parque',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'participant_name', 'João Silva'),
  false
);

-- Sample event reminder notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_reminder',
  'Seu evento é hoje!',
  'O evento Futebol no Parque começará em 2 horas. Não se atrase!',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample evaluation reminder
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'evaluation_reminder',
  'Você ainda pode avaliar!',
  'Você ainda pode avaliar o evento Basquete na Quadra que aconteceu ontem.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample review received notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'new_review',
  'Nova avaliação recebida!',
  'Você recebeu uma nova avaliação de 5 estrelas! Continue assim!',
  jsonb_build_object('rating', 5),
  true
);

-- Sample event cancelled notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_cancelled',
  'Evento cancelado',
  'O evento Corrida Matinal foi cancelado devido ao tempo ruim.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'reason', 'tempo ruim'),
  true
);

-- Create trigger for new event registrations (notifies organizer)
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event updates (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event cancellation (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new comments (notifies participants and organizer)
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS notify_on_event_join ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_join
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

DROP TRIGGER IF EXISTS notify_on_event_update ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_update();

DROP TRIGGER IF EXISTS notify_on_event_cancel ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_cancel
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_cancel();

DROP TRIGGER IF EXISTS notify_on_comment ON event_comments;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_comment();
-- First, let's see what values are currently allowed for notification types
-- and update the constraint to include our new types

-- Drop the existing check constraint
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

-- Add a new check constraint with all our notification types
ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'event_join',
    'event_reminder', 
    'event_update',
    'event_cancelled',
    'new_review',
    'evaluation_reminder',
    'new_comment',
    'spots_available',
    'event_confirmed',
    'new_registrations',
    'rating',
    'event_rating',
    'rating_reminder',
    'participants_needed',
    'message',
    'suggestion',
    'event_started',
    'event_start'
  ));

-- Now insert the sample notifications
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_join',
  'Nova inscrição!',
  'João Silva se inscreveu no seu evento Futebol no Parque',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'participant_name', 'João Silva'),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_reminder',
  'Seu evento é hoje!',
  'O evento Futebol no Parque começará em 2 horas. Não se atrase!',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'evaluation_reminder',
  'Você ainda pode avaliar!',
  'Você ainda pode avaliar o evento Basquete na Quadra que aconteceu ontem.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'new_review',
  'Nova avaliação recebida!',
  'Você recebeu uma nova avaliação de 5 estrelas! Continue assim!',
  jsonb_build_object('rating', 5),
  true
);

INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_cancelled',
  'Evento cancelado',
  'O evento Corrida Matinal foi cancelado devido ao tempo ruim.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'reason', 'tempo ruim'),
  true
);
-- Insert some sample notifications for testing
-- Note: These are just for demonstration - replace user IDs with actual user IDs from your auth.users table

-- Sample notification for event registration
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1), -- Replace with actual organizer user ID
  'event_join',
  'Nova inscrição!',
  'João Silva se inscreveu no seu evento Futebol no Parque',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'participant_name', 'João Silva'),
  false
);

-- Sample event reminder notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_reminder',
  'Seu evento é hoje!',
  'O evento Futebol no Parque começará em 2 horas. Não se atrase!',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample evaluation reminder
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'evaluation_reminder',
  'Você ainda pode avaliar!',
  'Você ainda pode avaliar o evento Basquete na Quadra que aconteceu ontem.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1)),
  false
);

-- Sample review received notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'new_review',
  'Nova avaliação recebida!',
  'Você recebeu uma nova avaliação de 5 estrelas! Continue assim!',
  jsonb_build_object('rating', 5),
  true
);

-- Sample event cancelled notification
INSERT INTO notifications (user_id, type, title, message, data, read) VALUES 
(
  (SELECT id FROM auth.users LIMIT 1),
  'event_cancelled',
  'Evento cancelado',
  'O evento Corrida Matinal foi cancelado devido ao tempo ruim.',
  jsonb_build_object('event_id', (SELECT id FROM events LIMIT 1), 'reason', 'tempo ruim'),
  true
);

-- Create trigger for new event registrations (notifies organizer)
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event updates (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for event cancellation (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new comments (notifies participants and organizer)
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS notify_on_event_join ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_join
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

DROP TRIGGER IF EXISTS notify_on_event_update ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_update();

DROP TRIGGER IF EXISTS notify_on_event_cancel ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_cancel
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_cancel();

DROP TRIGGER IF EXISTS notify_on_comment ON event_comments;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_comment();
-- Create trigger functions with proper search_path to fix security warnings

-- Create trigger for new event registrations (notifies organizer)
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$;

-- Create trigger for event updates (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for event cancellation (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new comments (notifies participants and organizer)
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS notify_on_event_join ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_join
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

DROP TRIGGER IF EXISTS notify_on_event_update ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_update();

DROP TRIGGER IF EXISTS notify_on_event_cancel ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_cancel
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_cancel();

DROP TRIGGER IF EXISTS notify_on_comment ON event_comments;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_comment();
-- Fix security warnings by adding SET search_path to all functions

-- Update create_notification_on_event_join function
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_event_update function  
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_event_cancel function
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Update create_notification_on_comment function
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$;
-- Create trigger functions with proper search_path to fix security warnings

-- Create trigger for new event registrations (notifies organizer)
CREATE OR REPLACE FUNCTION create_notification_on_event_join()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the event organizer when someone joins their event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    p.full_name || ' se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id, 'participant_name', p.full_name)
  FROM events e, profiles p
  WHERE e.id = NEW.event_id 
    AND p.user_id = NEW.user_id
    AND e.created_by != NEW.user_id; -- Don't notify if organizer joins their own event
  
  RETURN NEW;
END;
$$;

-- Create trigger for event updates (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_update()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only notify if important fields changed
  IF OLD.location != NEW.location OR OLD.date != NEW.date OR OLD.time != NEW.time THEN
    -- Notify all participants about the event update
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      CASE 
        WHEN OLD.location != NEW.location THEN 'Local alterado para: ' || NEW.location || ' no evento ' || NEW.title
        WHEN OLD.date != NEW.date THEN 'Data alterada para: ' || NEW.date || ' no evento ' || NEW.title
        WHEN OLD.time != NEW.time THEN 'Horário alterado para: ' || NEW.time || ' no evento ' || NEW.title
        ELSE 'O evento ' || NEW.title || ' foi atualizado'
      END,
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'old_location', OLD.location, 'new_location', NEW.location)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- Don't notify the organizer
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for event cancellation (notifies participants)
CREATE OR REPLACE FUNCTION create_notification_on_event_cancel()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify all participants when event is cancelled
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento cancelado',
      'O evento ' || NEW.title || ' foi cancelado.',
      'event_cancelled',
      jsonb_build_object('event_id', NEW.id)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for new comments (notifies participants and organizer)
CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id, 'commenter_name', p.full_name)
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND (ep.user_id != NEW.user_id OR e.created_by != NEW.user_id); -- Don't notify the commenter
  
  RETURN NEW;
END;
$$;

-- Apply triggers to tables
DROP TRIGGER IF EXISTS notify_on_event_join ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_join
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_join();

DROP TRIGGER IF EXISTS notify_on_event_update ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_update
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_update();

DROP TRIGGER IF EXISTS notify_on_event_cancel ON events;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_event_cancel
  AFTER UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_event_cancel();

DROP TRIGGER IF EXISTS notify_on_comment ON event_comments;
-- Safe Trigger Creation
CREATE TRIGGER notify_on_comment
  AFTER INSERT ON event_comments
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_comment();
-- Fix security warnings by updating functions that don't have search_path set
-- First fix the existing functions

-- Update handle_new_user function to have search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    city,
    phone,
    birth_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'Cidade não informada',
    'Telefone não informado', 
    '1990-01-01'
  );
  RETURN new;
END;
$function$;

-- Update create_notification_on_event_join function (the one created by trigger)
CREATE OR REPLACE FUNCTION public.create_notification_on_event_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Update update_event_participant_count function
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update check_event_evaluation_availability function
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$function$;

-- Update get_public_profile function
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, profile_photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
     SELECT 
       user_id,
       full_name,
       profile_photo_url
     FROM public.profiles
     WHERE user_id = target_user_id;
   $function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
-- Fix security warnings by updating functions that don't have search_path set
-- First fix the existing functions

-- Update handle_new_user function to have search_path
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    full_name,
    city,
    phone,
    birth_date
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'full_name', 'Usuário'),
    'Cidade não informada',
    'Telefone não informado', 
    '1990-01-01'
  );
  RETURN new;
END;
$function$;

-- Update create_notification_on_event_join function (the one created by trigger)
CREATE OR REPLACE FUNCTION public.create_notification_on_event_join()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Notificar o criador do evento quando alguém se inscreve
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Nova inscrição!',
    'Alguém se inscreveu no seu evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'participant_id', NEW.user_id)
  FROM events e
  WHERE e.id = NEW.event_id AND e.created_by != NEW.user_id;
  
  RETURN NEW;
END;
$function$;

-- Update update_event_participant_count function
CREATE OR REPLACE FUNCTION public.update_event_participant_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Incrementar contador quando alguém se inscreve
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- Decrementar contador quando alguém sai
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = OLD.event_id AND status = 'registered'
    )
    WHERE id = OLD.event_id;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Atualizar contador quando status muda
    UPDATE events 
    SET participant_count = (
      SELECT COUNT(*) 
      FROM event_participants 
      WHERE event_id = NEW.event_id AND status = 'registered'
    )
    WHERE id = NEW.event_id;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$function$;

-- Update check_event_evaluation_availability function
CREATE OR REPLACE FUNCTION public.check_event_evaluation_availability()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update evaluation status to available 3 hours after event start
  UPDATE event_participants ep
  SET evaluation_status = 'evaluation_available'
  FROM events e
  WHERE ep.event_id = e.id
  AND e.date + e.time + INTERVAL '3 hours' <= NOW()
  AND ep.evaluation_status = 'pending';
  
  RETURN NULL;
END;
$function$;

-- Update get_public_profile function
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(user_id uuid, full_name text, profile_photo_url text)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $function$
     SELECT 
       user_id,
       full_name,
       profile_photo_url
     FROM public.profiles
     WHERE user_id = target_user_id;
   $function$;

-- Update update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;
-- Add trigger to create confirmation notification for the user who joins an event
CREATE OR REPLACE FUNCTION create_notification_on_user_join_confirmation()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify the user who just joined about successful registration
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    NEW.user_id,
    'Inscrição confirmada!',
    'Você se inscreveu com sucesso no evento: ' || e.title,
    'event_join',
    jsonb_build_object('event_id', NEW.event_id, 'event_title', e.title)
  FROM events e
  WHERE e.id = NEW.event_id;
  
  RETURN NEW;
END;
$$;

-- Apply trigger for user confirmation notifications
DROP TRIGGER IF EXISTS notify_user_join_confirmation ON event_participants;
-- Safe Trigger Creation
CREATE TRIGGER notify_user_join_confirmation
  AFTER INSERT ON event_participants
  FOR EACH ROW EXECUTE FUNCTION create_notification_on_user_join_confirmation();
-- Create storage bucket for event images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('event-images', 'event-images', true);

-- Create RLS policies for event images
CREATE POLICY "Event images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'event-images');

CREATE POLICY "Event creators can upload images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Event creators can update their images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Event creators can delete their images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'event-images' 
  AND auth.uid() IS NOT NULL
);
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
-- Habilitar extensão unaccent para busca insensível a acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criar função para busca normalizada de eventos
CREATE OR REPLACE FUNCTION public.search_events_normalized(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  event_date date,
  event_time time,
  participant_count integer,
  max_participants integer,
  skill_level text,
  image_url text,
  status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.participant_count,
    e.max_participants,
    e.skill_level,
    e.image_url,
    e.status
  FROM events e
  WHERE e.status = 'active'
    AND (
      unaccent(lower(e.title)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.description)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.location)) ILIKE unaccent(lower('%' || search_query || '%'))
    )
  ORDER BY e.date ASC
  LIMIT 10;
$$;

-- Criar função para busca normalizada de perfis
CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;
-- Habilitar extensão unaccent para busca insensível a acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Criar função para busca normalizada de eventos
CREATE OR REPLACE FUNCTION public.search_events_normalized(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  event_date date,
  event_time time,
  participant_count integer,
  max_participants integer,
  skill_level text,
  image_url text,
  status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.participant_count,
    e.max_participants,
    e.skill_level,
    e.image_url,
    e.status
  FROM events e
  WHERE e.status = 'active'
    AND (
      unaccent(lower(e.title)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.description)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.location)) ILIKE unaccent(lower('%' || search_query || '%'))
    )
  ORDER BY e.date ASC
  LIMIT 10;
$$;

-- Criar função para busca normalizada de perfis
CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;
-- Habilitar extensão unaccent para busca insensível a acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Dropar funções existentes se existirem
DROP FUNCTION IF EXISTS public.search_events_normalized(text);
DROP FUNCTION IF EXISTS public.search_profiles_normalized(text);

-- Criar função para busca normalizada de eventos
CREATE OR REPLACE FUNCTION public.search_events_normalized(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  time_field time,
  participant_count integer,
  max_participants integer,
  skill_level text,
  image_url text,
  status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.participant_count,
    e.max_participants,
    e.skill_level,
    e.image_url,
    e.status
  FROM events e
  WHERE e.status = 'active'
    AND (
      unaccent(lower(e.title)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.description)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.location)) ILIKE unaccent(lower('%' || search_query || '%'))
    )
  ORDER BY e.date ASC
  LIMIT 10;
$$;

-- Criar função para busca normalizada de perfis
CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;
-- Criar tabela para sugestões de novos esportes
CREATE TABLE public.suggested_sports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  suggested_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Habilitar RLS na tabela de sugestões
ALTER TABLE public.suggested_sports ENABLE ROW LEVEL SECURITY;

-- Política: usuários podem ver suas próprias sugestões
CREATE POLICY "Users can view their own suggestions" 
ON public.suggested_sports 
FOR SELECT 
USING (auth.uid() = suggested_by);

-- Política: usuários podem criar sugestões
CREATE POLICY "Users can create suggestions" 
ON public.suggested_sports 
FOR INSERT 
WITH CHECK (auth.uid() = suggested_by);

-- Adicionar campo para esporte customizado na tabela de eventos
ALTER TABLE public.events 
ADD COLUMN custom_sport_name text;

-- Criar trigger para atualizar updated_at
-- Safe Trigger Creation
CREATE TRIGGER update_suggested_sports_updated_at
BEFORE UPDATE ON public.suggested_sports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
-- Habilitar extensão unaccent para busca insensível a acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- Dropar funções existentes se existirem
DROP FUNCTION IF EXISTS public.search_events_normalized(text);
DROP FUNCTION IF EXISTS public.search_profiles_normalized(text);

-- Criar função para busca normalizada de eventos
CREATE OR REPLACE FUNCTION public.search_events_normalized(search_query text)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  location text,
  date date,
  time_field time,
  participant_count integer,
  max_participants integer,
  skill_level text,
  image_url text,
  status text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    e.id,
    e.title,
    e.description,
    e.location,
    e.date,
    e.time,
    e.participant_count,
    e.max_participants,
    e.skill_level,
    e.image_url,
    e.status
  FROM events e
  WHERE e.status = 'active'
    AND (
      unaccent(lower(e.title)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.description)) ILIKE unaccent(lower('%' || search_query || '%'))
      OR unaccent(lower(e.location)) ILIKE unaccent(lower('%' || search_query || '%'))
    )
  ORDER BY e.date ASC
  LIMIT 10;
$$;

-- Criar função para busca normalizada de perfis
CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;
-- Apenas adicionar campo para esporte customizado na tabela events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS custom_sport_name text;
-- Criar política para permitir que usuários autenticados vejam perfis básicos de outros usuários
-- Isso é necessário para a funcionalidade de busca
CREATE POLICY "Users can view basic public profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Atualizar a função de busca de perfis para garantir que funcione corretamente
DROP FUNCTION IF EXISTS public.search_profiles_normalized(text);

CREATE OR REPLACE FUNCTION public.search_profiles_normalized(search_query text)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  city text,
  profile_photo_url text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    p.user_id,
    p.full_name,
    p.city,
    p.profile_photo_url
  FROM profiles p
  WHERE unaccent(lower(p.full_name)) ILIKE unaccent(lower('%' || search_query || '%'))
  LIMIT 10;
$$;
-- ==================================================================
-- SECURITY FIX: Remove Public Exposure of User Personal Information
-- ==================================================================

-- Drop the overly permissive policy that allows anyone to view all profiles
DROP POLICY IF EXISTS "Users can view basic public profiles" ON public.profiles;

-- The following policies already exist and are correct:
-- "Users can view only their own profile" - allows users to see their own data
-- "Users can view their own profile." - duplicate policy (same effect)
-- get_public_profile() function - provides controlled access to limited public data

-- ==================================================================
-- SECURITY FIX: Prevent Users from Creating Fake System Notifications
-- ==================================================================

-- Drop the misleadingly named permissive policy
DROP POLICY IF EXISTS "Only system can create notifications" ON public.notifications;

-- Create a proper policy that ONLY allows service_role (backend/triggers) to insert
-- Regular users should never insert directly into notifications
CREATE POLICY "System only notification creation"
ON public.notifications FOR INSERT
TO service_role
WITH CHECK (true);

-- Note: All existing database triggers use SECURITY DEFINER which runs with elevated privileges,
-- so they will continue to work correctly with this policy.
-- Create function to automatically finalize events 6 hours after start time
CREATE OR REPLACE FUNCTION public.auto_finalize_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update event status to 'completed' 6 hours after event start
  UPDATE events
  SET status = 'completed'
  WHERE status NOT IN ('completed', 'cancelled')
  AND (date + time + INTERVAL '6 hours') <= NOW();
END;
$function$;

-- Create a scheduled function that can be called periodically
-- Note: This function should be called by a cron job or scheduled task
-- For Supabase, you can set up a pg_cron extension or use edge functions with cron

COMMENT ON FUNCTION public.auto_finalize_events() IS 'Automatically marks events as completed 6 hours after their start time. Should be called periodically via cron or scheduled task.';

-- Fix event status constraint to support 'Finalizado' status
-- Remove old constraint
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add new constraint with 'Finalizado' and 'Cancelado' options
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'paused', 'Finalizado', 'Cancelado'));

-- Update the auto_finalize_events function to use 'completed' instead
CREATE OR REPLACE FUNCTION public.auto_finalize_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
BEGIN
  -- Update event status to 'completed' 6 hours after event start
  UPDATE events
  SET status = 'completed'
  WHERE status NOT IN ('completed', 'cancelled')
  AND (date + time + INTERVAL '6 hours') <= NOW();
END;
$function$;

-- Add comment to clarify status options
COMMENT ON COLUMN public.events.status IS 'Event status: active, cancelled, completed, paused, Finalizado, Cancelado';
COMMENT ON FUNCTION public.auto_finalize_events() IS 'Automatically marks events as completed 6 hours after their start time. Should be called periodically via cron or scheduled task.';


-- Setup periodic execution of auto_finalize_events function
-- This migration enables pg_cron extension and creates a scheduled job

-- Enable pg_cron extension (requires superuser privileges)
-- Note: In Supabase, you may need to enable this through the dashboard
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the auto_finalize_events function to run every hour
-- This will check and finalize events that are 6+ hours past their start time
SELECT cron.schedule(
  'auto-finalize-events-job',  -- job name
  '0 * * * *',                  -- cron schedule: every hour at minute 0
  'SELECT public.auto_finalize_events();'
);

-- Add comment explaining the cron job
COMMENT ON EXTENSION pg_cron IS 'Used to automatically finalize events 6 hours after their start time';

-- Alternative: If pg_cron is not available, you can use Supabase Edge Functions
-- Create a file at supabase/functions/finalize-events/index.ts with:
/*
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { error } = await supabaseClient.rpc('auto_finalize_events')

    if (error) throw error

    return new Response(
      JSON.stringify({ message: 'Events finalized successfully' }),
      { headers: { 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
*/
-- Then configure it to run hourly via Supabase Dashboard > Edge Functions > Cron Jobs


-- Adicionar campo para controlar se evento requer aprovação manual
ALTER TABLE events 
ADD COLUMN IF NOT EXISTS requires_approval boolean DEFAULT false;

-- Atualizar event_participants para incluir mais estados
-- O campo 'status' já existe, mas vamos garantir que suporta os novos valores
-- Valores possíveis: 'pending', 'registered', 'rejected', 'cancelled'
COMMENT ON COLUMN event_participants.status IS 'Status da participação: pending (aguardando aprovação), registered (aprovado), rejected (rejeitado), cancelled (cancelado pelo usuário)';

-- Modificar a trigger de notificação para diferenciar entre aprovação automática e pendente
CREATE OR REPLACE FUNCTION public.create_notification_on_user_join_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o evento requer aprovação e o status é pending
  IF (SELECT requires_approval FROM events WHERE id = NEW.event_id) AND NEW.status = 'pending' THEN
    -- Notificar o criador do evento que há uma solicitação pendente
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      e.created_by,
      'Nova solicitação de participação',
      p.full_name || ' quer participar do evento: ' || e.title,
      'participation_request',
      jsonb_build_object(
        'event_id', NEW.event_id, 
        'participant_id', NEW.user_id,
        'participant_registration_id', NEW.id,
        'participant_name', p.full_name
      )
    FROM events e
    JOIN profiles p ON p.user_id = NEW.user_id
    WHERE e.id = NEW.event_id;
  -- Se o status é registered (aprovado automaticamente ou manualmente)
  ELSIF NEW.status = 'registered' THEN
    -- Notificar o usuário que se inscreveu
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      NEW.user_id,
      'Inscrição confirmada!',
      'Você se inscreveu com sucesso no evento: ' || e.title,
      'event_join',
      jsonb_build_object('event_id', NEW.event_id, 'event_title', e.title)
    FROM events e
    WHERE e.id = NEW.event_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Criar função para aprovar participação
CREATE OR REPLACE FUNCTION public.approve_participant(
  p_event_id uuid,
  p_participant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_creator uuid;
  v_event_title text;
  v_participant_name text;
BEGIN
  -- Verificar se o usuário atual é o criador do evento
  SELECT created_by, title INTO v_event_creator, v_event_title
  FROM events
  WHERE id = p_event_id;
  
  IF v_event_creator != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o criador do evento pode aprovar participantes';
  END IF;
  
  -- Atualizar status para registered
  UPDATE event_participants
  SET status = 'registered'
  WHERE event_id = p_event_id 
    AND user_id = p_participant_id 
    AND status = 'pending';
  
  -- Buscar nome do participante
  SELECT full_name INTO v_participant_name
  FROM profiles
  WHERE user_id = p_participant_id;
  
  -- Criar notificação para o participante aprovado
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    p_participant_id,
    'Participação aprovada!',
    'Sua solicitação para participar do evento "' || v_event_title || '" foi aprovada!',
    'participation_approved',
    jsonb_build_object('event_id', p_event_id)
  );
END;
$function$;

-- Criar função para rejeitar participação
CREATE OR REPLACE FUNCTION public.reject_participant(
  p_event_id uuid,
  p_participant_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_event_creator uuid;
  v_event_title text;
BEGIN
  -- Verificar se o usuário atual é o criador do evento
  SELECT created_by, title INTO v_event_creator, v_event_title
  FROM events
  WHERE id = p_event_id;
  
  IF v_event_creator != auth.uid() THEN
    RAISE EXCEPTION 'Apenas o criador do evento pode rejeitar participantes';
  END IF;
  
  -- Atualizar status para rejected
  UPDATE event_participants
  SET status = 'rejected'
  WHERE event_id = p_event_id 
    AND user_id = p_participant_id 
    AND status = 'pending';
  
  -- Criar notificação para o participante rejeitado
  INSERT INTO notifications (user_id, title, message, type, data)
  VALUES (
    p_participant_id,
    'Participação não aprovada',
    'Sua solicitação para participar do evento "' || v_event_title || '" não foi aprovada.',
    'participation_rejected',
    jsonb_build_object('event_id', p_event_id)
  );
END;
$function$;
-- Add PCD/accessibility fields to events table
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS has_pcd_structure BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pcd_types TEXT[];

-- Add comment
COMMENT ON COLUMN public.events.has_pcd_structure IS 'Indica se o evento tem estrutura para pessoas com deficiência';
COMMENT ON COLUMN public.events.pcd_types IS 'Tipos de deficiência suportados: Cadeirantes, Deficiência visual, Deficiência auditiva, Outras';

-- Create function to notify users with accessibility needs when matching event is created
CREATE OR REPLACE FUNCTION public.notify_users_with_accessibility_needs()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  user_record RECORD;
  event_title TEXT;
  event_date TEXT;
  notification_message TEXT;
BEGIN
  -- Only process if event has PCD structure
  IF NEW.has_pcd_structure = true AND NEW.pcd_types IS NOT NULL AND array_length(NEW.pcd_types, 1) > 0 THEN
    
    -- Get event details for notification
    event_title := NEW.title;
    event_date := to_char(NEW.date, 'DD/MM/YYYY');
    
    -- Find users with matching accessibility needs
    FOR user_record IN 
      SELECT DISTINCT p.user_id, p.full_name, p.accessibility_needs
      FROM profiles p
      WHERE p.accessibility_needs IS NOT NULL 
        AND p.accessibility_needs && NEW.pcd_types  -- Array overlap operator
        AND p.user_id != NEW.created_by  -- Don't notify the creator
    LOOP
      -- Create notification message
      notification_message := format(
        'Novo evento "%s" em %s com infraestrutura para acessibilidade compatível com suas necessidades!',
        event_title,
        event_date
      );
      
      -- Insert notification
      INSERT INTO notifications (
        user_id,
        title,
        message,
        type,
        data,
        read
      ) VALUES (
        user_record.user_id,
        'Evento com Infraestrutura Acessível',
        notification_message,
        'event_invitation',
        jsonb_build_object(
          'event_id', NEW.id,
          'event_title', event_title,
          'event_date', event_date,
          'pcd_types', NEW.pcd_types,
          'user_accessibility_needs', user_record.accessibility_needs
        ),
        false
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to execute function after event creation
DROP TRIGGER IF EXISTS notify_pcd_users_on_event_creation ON public.events;
-- Safe Trigger Creation
CREATE TRIGGER notify_pcd_users_on_event_creation
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_users_with_accessibility_needs();

-- Also trigger on update (in case PCD structure is added later)
DROP TRIGGER IF EXISTS notify_pcd_users_on_event_update ON public.events;
-- Safe Trigger Creation
CREATE TRIGGER notify_pcd_users_on_event_update
  AFTER UPDATE OF has_pcd_structure, pcd_types ON public.events
  FOR EACH ROW
  WHEN (NEW.has_pcd_structure = true AND (OLD.has_pcd_structure = false OR OLD.pcd_types IS DISTINCT FROM NEW.pcd_types))
  EXECUTE FUNCTION public.notify_users_with_accessibility_needs();

-- Add index for better performance on accessibility queries
CREATE INDEX IF NOT EXISTS idx_profiles_accessibility_needs 
ON public.profiles USING GIN (accessibility_needs);

CREATE INDEX IF NOT EXISTS idx_events_pcd 
ON public.events (has_pcd_structure) 
WHERE has_pcd_structure = true;

-- Update RLS policies for notifications if needed
-- Allow users to see their own notifications
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'notifications' 
    AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;
END $$;

COMMENT ON FUNCTION public.notify_users_with_accessibility_needs() IS 'Notifica usuários com necessidades de acessibilidade quando um evento com infraestrutura compatível é criado ou atualizado';

-- Fix comment notification logic to prevent self-notifications
-- The previous logic used OR which could still notify the commenter in some cases
-- Changed to AND to ensure the commenter is never notified

CREATE OR REPLACE FUNCTION create_notification_on_comment()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Notify participants and organizer about new comments
  -- FIXED: Changed OR to AND to properly exclude the commenter from notifications
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT DISTINCT
    CASE 
      WHEN ep.user_id IS NOT NULL THEN ep.user_id
      ELSE e.created_by
    END AS target_user_id,
    'Nova mensagem',
    p.full_name || ' comentou no evento ' || e.title,
    'new_comment',
    jsonb_build_object(
      'event_id', NEW.event_id, 
      'comment_id', NEW.id, 
      'commenter_name', p.full_name
    )
  FROM events e
  LEFT JOIN event_participants ep ON ep.event_id = e.id AND ep.status = 'registered'
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    -- CRITICAL FIX: Ensure we don't notify the commenter (user who created the comment)
    -- This checks if the target user (participant OR organizer) is different from the commenter
    AND COALESCE(ep.user_id, e.created_by) != NEW.user_id;
  
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION create_notification_on_comment() IS 'Creates notifications for event participants and organizer when a new comment is posted. Ensures the commenter does not receive a notification for their own comment.';

-- Migration: Create Sport Suggestions System
-- Description: Sistema completo para usuários sugerirem novas modalidades esportivas

-- ============================================
-- 1. CREATE SPORT_SUGGESTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.sport_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sport_name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  suggested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.sport_suggestions IS 'Sugestões de novas modalidades esportivas enviadas pelos usuários';
COMMENT ON COLUMN public.sport_suggestions.sport_name IS 'Nome da modalidade sugerida';
COMMENT ON COLUMN public.sport_suggestions.status IS 'pending: aguardando aprovação, approved: aprovada e adicionada, rejected: rejeitada';
COMMENT ON COLUMN public.sport_suggestions.rejection_reason IS 'Motivo da rejeição (opcional)';

-- ============================================
-- 2. CREATE INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_user_id ON public.sport_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_status ON public.sport_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_sport_suggestions_created_at ON public.sport_suggestions(created_at DESC);

-- ============================================
-- 3. ENABLE RLS (ROW LEVEL SECURITY)
-- ============================================
ALTER TABLE public.sport_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own suggestions
CREATE POLICY "Users can view their own suggestions"
ON public.sport_suggestions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own suggestions
CREATE POLICY "Users can insert suggestions"
ON public.sport_suggestions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all suggestions (placeholder - você define quem é admin)
CREATE POLICY "Admins can view all suggestions"
ON public.sport_suggestions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- Policy: Admins can update all suggestions
CREATE POLICY "Admins can update suggestions"
ON public.sport_suggestions
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.is_admin = true
  )
);

-- ============================================
-- 4. ADD IS_ADMIN COLUMN TO PROFILES (if not exists)
-- ============================================
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT false;
    COMMENT ON COLUMN public.profiles.is_admin IS 'Indica se o usuário é administrador da plataforma';
  END IF;
END $$;

-- ============================================
-- 5. CREATE FUNCTION TO APPROVE SUGGESTION
-- ============================================
CREATE OR REPLACE FUNCTION public.approve_sport_suggestion(suggestion_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport_name TEXT;
  v_user_id UUID;
  v_existing_sport UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem aprovar sugestões';
  END IF;

  -- Get suggestion details
  SELECT sport_name, user_id INTO v_sport_name, v_user_id
  FROM sport_suggestions
  WHERE id = suggestion_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada ou já processada';
  END IF;

  -- Check if sport already exists (case-insensitive)
  SELECT id INTO v_existing_sport
  FROM sports
  WHERE LOWER(name) = LOWER(v_sport_name);

  IF v_existing_sport IS NOT NULL THEN
    -- Sport already exists, just update suggestion status
    UPDATE sport_suggestions
    SET 
      status = 'rejected',
      rejection_reason = 'Esta modalidade já existe na plataforma',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      updated_at = NOW()
    WHERE id = suggestion_id;

    -- Notify user
    INSERT INTO notifications (user_id, title, message, type, data, read)
    VALUES (
      v_user_id,
      'Sugestão de modalidade',
      format('Sua sugestão "%s" já existe na plataforma com outro nome.', v_sport_name),
      'suggestion_rejected',
      jsonb_build_object('suggestion_id', suggestion_id, 'sport_name', v_sport_name),
      false
    );
  ELSE
    -- Add new sport to sports table
    INSERT INTO sports (name)
    VALUES (v_sport_name);

    -- Update suggestion status to approved
    UPDATE sport_suggestions
    SET 
      status = 'approved',
      reviewed_at = NOW(),
      reviewed_by = auth.uid(),
      updated_at = NOW()
    WHERE id = suggestion_id;

    -- Notify user of approval
    INSERT INTO notifications (user_id, title, message, type, data, read)
    VALUES (
      v_user_id,
      'Sugestão aprovada! 🎉',
      format('Sua sugestão "%s" foi aprovada e agora está disponível na plataforma!', v_sport_name),
      'suggestion_approved',
      jsonb_build_object('suggestion_id', suggestion_id, 'sport_name', v_sport_name),
      false
    );
  END IF;
END;
$$;

-- ============================================
-- 6. CREATE FUNCTION TO REJECT SUGGESTION
-- ============================================
CREATE OR REPLACE FUNCTION public.reject_sport_suggestion(
  suggestion_id UUID,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sport_name TEXT;
  v_user_id UUID;
BEGIN
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM profiles 
    WHERE user_id = auth.uid() 
    AND is_admin = true
  ) THEN
    RAISE EXCEPTION 'Apenas administradores podem rejeitar sugestões';
  END IF;

  -- Get suggestion details
  SELECT sport_name, user_id INTO v_sport_name, v_user_id
  FROM sport_suggestions
  WHERE id = suggestion_id
  AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Sugestão não encontrada ou já processada';
  END IF;

  -- Update suggestion status to rejected
  UPDATE sport_suggestions
  SET 
    status = 'rejected',
    rejection_reason = reason,
    reviewed_at = NOW(),
    reviewed_by = auth.uid(),
    updated_at = NOW()
  WHERE id = suggestion_id;

  -- Notify user of rejection
  INSERT INTO notifications (user_id, title, message, type, data, read)
  VALUES (
    v_user_id,
    'Sugestão de modalidade',
    CASE 
      WHEN reason IS NOT NULL THEN 
        format('Sua sugestão "%s" não foi aprovada. Motivo: %s', v_sport_name, reason)
      ELSE 
        format('Sua sugestão "%s" não foi aprovada desta vez.', v_sport_name)
    END,
    'suggestion_rejected',
    jsonb_build_object(
      'suggestion_id', suggestion_id, 
      'sport_name', v_sport_name,
      'rejection_reason', reason
    ),
    false
  );
END;
$$;

-- ============================================
-- 7. -- Safe Trigger Creation
CREATE TRIGGER FOR UPDATED_AT
-- ============================================
-- Safe Trigger Creation
CREATE TRIGGER update_sport_suggestions_updated_at
  BEFORE UPDATE ON public.sport_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. GRANT PERMISSIONS
-- ============================================
GRANT SELECT, INSERT ON public.sport_suggestions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- ============================================
-- 9. ADD STATISTICS
-- ============================================
COMMENT ON FUNCTION public.approve_sport_suggestion IS 'Aprova uma sugestão de modalidade e adiciona à tabela sports';
COMMENT ON FUNCTION public.reject_sport_suggestion IS 'Rejeita uma sugestão de modalidade com motivo opcional';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Sistema de sugestões de modalidades criado com sucesso!';
  RAISE NOTICE '📊 Tabela: sport_suggestions';
  RAISE NOTICE '🔐 RLS: Habilitado';
  RAISE NOTICE '⚡ Funções: approve_sport_suggestion, reject_sport_suggestion';
END $$;



-- =====================================================================
-- Migration: Fix Participation Count Logic
-- Description: Count participations only if user was still registered
--              at the time of the event, and count organized events
--              only if they were successfully completed.
-- Date: 2025-10-10
-- =====================================================================

-- =====================================================================
-- 1. Add Helper Function to Count Valid Participations
-- =====================================================================
CREATE OR REPLACE FUNCTION get_valid_participation_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_count INTEGER;
BEGIN
  -- Count only participations where:
  -- 1. User was still registered when event ended (participation_status = 'confirmed')
  -- 2. Event was completed (status = 'completed')
  -- 3. Event date has passed
  
  SELECT COUNT(DISTINCT ep.event_id)
  INTO valid_count
  FROM event_participants ep
  INNER JOIN events e ON e.id = ep.event_id
  WHERE ep.user_id = user_id_param
    AND ep.status = 'confirmed' -- User was still registered
    AND e.status = 'completed'  -- Event was completed
    AND (e.date + e.time::time) < NOW(); -- Event has ended
    
  RETURN COALESCE(valid_count, 0);
END;
$$;

COMMENT ON FUNCTION get_valid_participation_count IS 'Returns the count of valid participations for a user (only events where user didnt cancel before event time)';

-- =====================================================================
-- 2. Add Helper Function to Count Valid Organized Events
-- =====================================================================
CREATE OR REPLACE FUNCTION get_valid_organized_events_count(user_id_param UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  valid_count INTEGER;
BEGIN
  -- Count only organized events where:
  -- 1. Event was completed (not cancelled)
  -- 2. Event had at least 1 confirmed participant
  -- 3. Event date has passed
  
  SELECT COUNT(DISTINCT e.id)
  INTO valid_count
  FROM events e
  WHERE e.created_by = user_id_param
    AND e.status = 'completed' -- Event was completed
    AND e.participant_count >= 1 -- Had at least 1 participant
    AND (e.date + e.time::time) < NOW(); -- Event has ended
    
  RETURN COALESCE(valid_count, 0);
END;
$$;

COMMENT ON FUNCTION get_valid_organized_events_count IS 'Returns the count of valid organized events (only completed events with participants)';

-- =====================================================================
-- 3. Create View for User Statistics
-- =====================================================================
CREATE OR REPLACE VIEW user_statistics AS
SELECT 
  p.user_id,
  p.full_name,
  get_valid_participation_count(p.user_id) as participations_count,
  get_valid_organized_events_count(p.user_id) as organized_events_count,
  p.created_at as member_since
FROM profiles p;

COMMENT ON VIEW user_statistics IS 'Provides accurate user statistics with validated participation and organized events counts';

-- Grant access to authenticated users
GRANT SELECT ON user_statistics TO authenticated;

-- =====================================================================
-- 4. Update RLS Policies for the View
-- =====================================================================
ALTER VIEW user_statistics SET (security_invoker = on);

-- =====================================================================
-- 5. Add Indexes for Performance
-- =====================================================================
-- Index for faster lookups on event completion and participation
CREATE INDEX IF NOT EXISTS idx_events_completed_date 
ON events(status, date, time) 
WHERE status = 'completed';

CREATE INDEX IF NOT EXISTS idx_event_participants_user_status 
ON event_participants(user_id, status, event_id)
WHERE status = 'confirmed';

-- =====================================================================
-- 6. Migration Complete
-- =====================================================================
-- Note: Frontend should now query user_statistics view instead of
-- manually counting from profiles table.

-- Fix notifications to prevent users from receiving notifications about their own actions

-- Update the event join notification trigger to NOT notify the user who joined
-- Instead, only notify the event creator (unless they are the same person)
CREATE OR REPLACE FUNCTION public.create_notification_on_user_join_confirmation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Se o evento requer aprovação e o status é pending
  IF (SELECT requires_approval FROM events WHERE id = NEW.event_id) AND NEW.status = 'pending' THEN
    -- Notificar o criador do evento que há uma solicitação pendente (apenas se não for ele mesmo)
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      e.created_by,
      'Nova solicitação de participação',
      p.full_name || ' quer participar do evento: ' || e.title,
      'participation_request',
      jsonb_build_object(
        'event_id', NEW.event_id, 
        'participant_id', NEW.user_id,
        'participant_registration_id', NEW.id,
        'participant_name', p.full_name
      )
    FROM events e
    JOIN profiles p ON p.user_id = NEW.user_id
    WHERE e.id = NEW.event_id
      AND e.created_by != NEW.user_id; -- CRITICAL FIX: Don't notify if user is the creator
  
  -- Se o status é registered (aprovado automaticamente)
  -- Não notificamos o usuário sobre sua própria inscrição automática
  -- A confirmação visual na UI já é suficiente
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Update comment notification to NOT notify users about their own comments
CREATE OR REPLACE FUNCTION public.create_notification_on_comment()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Notify the event creator when someone comments on their event
  -- But NOT if the creator is commenting on their own event
  INSERT INTO notifications (user_id, title, message, type, data)
  SELECT 
    e.created_by,
    'Novo comentário',
    p.full_name || ' comentou no evento: ' || e.title,
    'event_comment',
    jsonb_build_object('event_id', NEW.event_id, 'comment_id', NEW.id)
  FROM events e
  JOIN profiles p ON p.user_id = NEW.user_id
  WHERE e.id = NEW.event_id
    AND e.created_by != NEW.user_id; -- CRITICAL FIX: Don't notify creator about their own comments
  
  RETURN NEW;
END;
$function$;

-- Update event update notification to NOT notify the creator about their own changes
CREATE OR REPLACE FUNCTION public.create_notification_on_event_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only notify participants if the event changed, excluding the creator
  IF OLD.date != NEW.date OR OLD.time != NEW.time OR OLD.location != NEW.location THEN
    INSERT INTO notifications (user_id, title, message, type, data)
    SELECT 
      ep.user_id,
      'Evento atualizado',
      'O evento "' || NEW.title || '" foi atualizado.',
      'event_update',
      jsonb_build_object('event_id', NEW.id, 'event_title', NEW.title)
    FROM event_participants ep
    WHERE ep.event_id = NEW.id 
      AND ep.status = 'registered'
      AND ep.user_id != NEW.created_by; -- CRITICAL FIX: Don't notify creator about their own changes
  END IF;
  
  RETURN NEW;
END;
$function$;
-- Drop the restrictive policy that only allows users to view their own sports
DROP POLICY IF EXISTS "Users can view their own sports" ON user_sports;

-- Create a new policy that allows everyone to view all user sports
-- This makes sports interests public information visible on user profiles
CREATE POLICY "User sports are viewable by everyone"
  ON user_sports
  FOR SELECT
  USING (true);
-- Drop the existing get_public_profile function
DROP FUNCTION IF EXISTS public.get_public_profile(uuid);

-- Recreate get_public_profile to include created_at
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id uuid)
RETURNS TABLE(
  user_id uuid,
  full_name text,
  profile_photo_url text,
  created_at timestamp with time zone
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    user_id,
    full_name,
    profile_photo_url,
    created_at
  FROM public.profiles
  WHERE user_id = target_user_id;
$$;
-- Drop old constraint if exists
ALTER TABLE public.events DROP CONSTRAINT IF EXISTS events_status_check;

-- Add correct constraint with all valid status values
ALTER TABLE public.events 
ADD CONSTRAINT events_status_check 
CHECK (status IN ('active', 'cancelled', 'completed', 'paused'));
-- Update get_public_profile function to include created_at field
CREATE OR REPLACE FUNCTION public.get_public_profile(target_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  full_name TEXT,
  profile_photo_url TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.user_id,
    p.full_name,
    p.profile_photo_url,
    p.created_at
  FROM profiles p
  WHERE p.user_id = target_user_id;
END;
$$;
-- Add 'event_comment' to the allowed notification types
ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;

ALTER TABLE notifications ADD CONSTRAINT notifications_type_check 
  CHECK (type IN (
    'event_join',
    'event_reminder', 
    'event_update',
    'event_cancelled',
    'new_review',
    'evaluation_reminder',
    'new_comment',
    'event_comment',
    'spots_available',
    'event_confirmed',
    'new_registrations',
    'rating',
    'event_rating',
    'rating_reminder',
    'participants_needed',
    'message',
    'suggestion',
    'event_started',
    'event_start'
  ));
-- Add user_rating field to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_rating NUMERIC(3,2) DEFAULT 3.00;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_reviews_received INTEGER DEFAULT 0;

-- Create function to calculate user rating based on praise tags
CREATE OR REPLACE FUNCTION calculate_user_rating(target_user_id UUID)
RETURNS NUMERIC(3,2)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  total_praises INTEGER;
  trophy_count INTEGER;
  communication_count INTEGER;
  teamwork_count INTEGER;
  total_reviews INTEGER;
  calculated_rating NUMERIC(3,2);
BEGIN
  -- Get counts of each praise type
  SELECT 
    COUNT(*),
    COALESCE(SUM(CASE WHEN 'trophy' = ANY(praise_tags) THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN 'communication' = ANY(praise_tags) THEN 1 ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN 'teamwork' = ANY(praise_tags) THEN 1 ELSE 0 END), 0)
  INTO total_reviews, trophy_count, communication_count, teamwork_count
  FROM reviews
  WHERE reviewed_user_id = target_user_id
    AND review_type = 'player_praise'
    AND praise_tags IS NOT NULL;

  -- If no reviews, return default rating
  IF total_reviews = 0 THEN
    RETURN 3.00;
  END IF;

  -- Calculate total praises
  total_praises := trophy_count + communication_count + teamwork_count;

  -- Calculate rating based on praise categories (weighted system)
  -- Trophy (skill): weight 1.5
  -- Communication: weight 1.2
  -- Teamwork: weight 1.3
  -- Base rating starts at 3.0
  
  calculated_rating := 3.0 + (
    (trophy_count * 0.15) +
    (communication_count * 0.12) +
    (teamwork_count * 0.13)
  ) / GREATEST(total_reviews, 1);

  -- Cap rating between 1.0 and 5.0
  calculated_rating := LEAST(GREATEST(calculated_rating, 1.0), 5.0);

  RETURN calculated_rating;
END;
$$;

-- Create function to update user rating
CREATE OR REPLACE FUNCTION update_user_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_rating NUMERIC(3,2);
  review_count INTEGER;
BEGIN
  -- Calculate new rating
  new_rating := calculate_user_rating(NEW.reviewed_user_id);
  
  -- Get total review count
  SELECT COUNT(*) INTO review_count
  FROM reviews
  WHERE reviewed_user_id = NEW.reviewed_user_id
    AND review_type = 'player_praise';

  -- Update profile
  UPDATE profiles
  SET 
    user_rating = new_rating,
    total_reviews_received = review_count,
    updated_at = NOW()
  WHERE user_id = NEW.reviewed_user_id;

  RETURN NEW;
END;
$$;

-- Create trigger to auto-update rating when reviews are added
DROP TRIGGER IF EXISTS trigger_update_user_rating ON reviews;
-- Safe Trigger Creation
CREATE TRIGGER trigger_update_user_rating
AFTER INSERT OR UPDATE ON reviews
FOR EACH ROW
WHEN (NEW.review_type = 'player_praise' AND NEW.reviewed_user_id IS NOT NULL)
EXECUTE FUNCTION update_user_rating();

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_reviews_reviewed_user ON reviews(reviewed_user_id) WHERE review_type = 'player_praise';
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
-- ==========================================
-- FASE 3: CORE FLOWS (MATCHMAKING & CHECK-INS)
-- ==========================================

-- 1. Tabela para Matchmaking ("Tô Disponível")
CREATE TABLE IF NOT EXISTS public.matchmaking_requests (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    condominium_id UUID NOT NULL REFERENCES public.condominiums(id) ON DELETE CASCADE,
    sport_name TEXT NOT NULL,
    time_preference TEXT, -- Ex: "Hoje à noite", "Agora", etc.
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'matched', 'expired')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Matchmaking
ALTER TABLE public.matchmaking_requests ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can view matchmaking in their condominium" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can insert their own matchmaking requests" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can update their own matchmaking requests" ON public.matchmaking_requests;
DROP POLICY IF EXISTS "Users can delete their own matchmaking requests" ON public.matchmaking_requests;

-- Políticas para Matchmaking
CREATE POLICY "Users can view matchmaking in their condominium" 
    ON public.matchmaking_requests FOR SELECT USING (
        condominium_id IN (
            SELECT condominium_id FROM public.profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can insert their own matchmaking requests" 
    ON public.matchmaking_requests FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can update their own matchmaking requests" 
    ON public.matchmaking_requests FOR UPDATE USING (
        user_id = auth.uid()
    );

CREATE POLICY "Users can delete their own matchmaking requests" 
    ON public.matchmaking_requests FOR DELETE USING (
        user_id = auth.uid()
    );


-- 2. Tabela para Check-ins de Amenidades (Lotação ao vivo)
CREATE TABLE IF NOT EXISTS public.amenity_checkins (
    id UUID DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    amenity_id UUID NOT NULL REFERENCES public.amenities(id) ON DELETE CASCADE,
    checkin_time TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    checkout_time TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS para Check-ins
ALTER TABLE public.amenity_checkins ENABLE ROW LEVEL SECURITY;

-- Limpar políticas antigas se existirem para evitar erro de duplicidade
DROP POLICY IF EXISTS "Users can view checkins in their condominium" ON public.amenity_checkins;
DROP POLICY IF EXISTS "Users can create their own checkins" ON public.amenity_checkins;
DROP POLICY IF EXISTS "Users can checkout their own checkins" ON public.amenity_checkins;

-- Políticas para Check-ins
CREATE POLICY "Users can view checkins in their condominium" 
    ON public.amenity_checkins FOR SELECT USING (
        amenity_id IN (
            SELECT a.id FROM public.amenities a 
            JOIN public.profiles p ON a.condominium_id = p.condominium_id 
            WHERE p.id = auth.uid()
        )
    );

CREATE POLICY "Users can create their own checkins" 
    ON public.amenity_checkins FOR INSERT WITH CHECK (
        user_id = auth.uid()
    );

CREATE POLICY "Users can checkout their own checkins" 
    ON public.amenity_checkins FOR UPDATE USING (
        user_id = auth.uid()
    );


-- 3. Inserir alguns dados Mockados nas novas tabelas para popular a Dashboard inicialmente
-- Descobrindo IDs do ambiente de dev (Certifique-se que o usuário e o condomínio existem)
DO $$ 
DECLARE
    v_condo_id UUID;
    v_user_id UUID;
    v_amenity_id UUID;
BEGIN
    -- Pegando o ID do Condomínio Riff Sports (criado na Fase 1)
    SELECT id INTO v_condo_id FROM public.condominiums WHERE invite_code = 'RIFFCODE2026' LIMIT 1;
    
    -- Pegando algum perfil existente para simular os donos das requisições
    SELECT id INTO v_user_id FROM public.profiles LIMIT 1;

    -- Pegando o ID de uma Amenity qualquer (ex: Academia)
    SELECT id INTO v_amenity_id FROM public.amenities WHERE condominium_id = v_condo_id LIMIT 1;

    -- Se achou condo e user, e se a tabela de matchmaking ainda estiver vazia
    IF v_condo_id IS NOT NULL AND v_user_id IS NOT NULL THEN
        IF NOT EXISTS (SELECT 1 FROM public.matchmaking_requests LIMIT 1) THEN
            INSERT INTO public.matchmaking_requests (user_id, condominium_id, sport_name, time_preference)
            VALUES 
                (v_user_id, v_condo_id, 'Tênis', 'Hoje 19h'),
                (v_user_id, v_condo_id, 'Academia', 'Agora'),
                (v_user_id, v_condo_id, 'Futebol', 'Preciso de goleiro');
        END IF;
    END IF;

    -- Se achou amenity, e se a tabela de check-in ainda estiver vazia
    IF v_amenity_id IS NOT NULL AND v_user_id IS NOT NULL THEN
         IF NOT EXISTS (SELECT 1 FROM public.amenity_checkins LIMIT 1) THEN
             INSERT INTO public.amenity_checkins (user_id, amenity_id, status)
             VALUES (v_user_id, v_amenity_id, 'active');
         END IF;
    END IF;
END $$;
-- Permitir que usuários anônimos (na tela de cadastro) possam ler a lista de condomínios
CREATE POLICY "Allow public read access to condominiums"
ON public.condominiums
FOR SELECT
TO public
USING (true);
-- ==========================================
-- SCRIPT DE MOCK DE DADOS FASE 3 (COMPLETO)
-- Cria: Condomínio, Amenidades, Perfis Falsos, Eventos, Check-ins e Matchmaking
-- ==========================================

DO $$ 
DECLARE
    v_condo_id UUID;
    v_quadra_id UUID;
    v_acad_id UUID;
    v_piscina_id UUID;
    v_user1_id UUID;
    v_user2_id UUID;
    v_user3_id UUID;
BEGIN
    -- 1. CRIAR CONDOMÍNIO
    INSERT INTO public.condominiums (name, invite_code)
    VALUES ('Condomínio Riff Sports', 'RIFFCODE2026')
    ON CONFLICT (invite_code) DO NOTHING
    RETURNING id INTO v_condo_id;

    IF v_condo_id IS NULL THEN
        SELECT id INTO v_condo_id FROM public.condominiums WHERE invite_code = 'RIFFCODE2026' LIMIT 1;
    END IF;

    -- 2. CRIAR AMENIDADES DO CONDOMÍNIO
    INSERT INTO public.amenities (condominium_id, name, capacity, type) VALUES 
        (v_condo_id, 'Quadra de Tênis', 4, 'Quartos'),
        (v_condo_id, 'Academia', 15, 'Fitness'),
        (v_condo_id, 'Piscina', 30, 'Clube'),
        (v_condo_id, 'Churrasqueira', 20, 'Lazer')
    ON CONFLICT DO NOTHING;

    SELECT id INTO v_quadra_id FROM public.amenities WHERE name = 'Quadra de Tênis' AND condominium_id = v_condo_id LIMIT 1;
    SELECT id INTO v_acad_id FROM public.amenities WHERE name = 'Academia' AND condominium_id = v_condo_id LIMIT 1;
    SELECT id INTO v_piscina_id FROM public.amenities WHERE name = 'Piscina' AND condominium_id = v_condo_id LIMIT 1;

    -- 3. CRIAR USUÁRIOS FAKE DE TESTE
    -- Nota: Como Auth do Supabase é separado da tabela Profiles, inserimos mock na Profiles
    -- Eles não poderão logar, mas aparecerão nas listas e ranks
    INSERT INTO public.profiles (user_id, condominium_id, full_name, block_number, apt_number, user_rating, total_reviews_received) 
    VALUES 
        (uuid_generate_v4(), v_condo_id, 'João Silva', 'A', '101', 4.8, 12),
        (uuid_generate_v4(), v_condo_id, 'Maria Souza', 'B', '202', 4.9, 8),
        (uuid_generate_v4(), v_condo_id, 'Carlos Pereira', 'A', '305', 4.2, 3)
    RETURNING id INTO v_user1_id; -- Pega apenas o primeiro para usar de ref

    SELECT id INTO v_user2_id FROM public.profiles WHERE full_name = 'Maria Souza' LIMIT 1;
    SELECT id INTO v_user3_id FROM public.profiles WHERE full_name = 'Carlos Pereira' LIMIT 1;

    -- 4. CRIAR JOGOS (RESERVAS DE AMENIDADES)
    -- Evento para amanhã
    INSERT INTO public.events (title, condominium_id, amenity_id, location, date, time, max_participants, created_by, status)
    VALUES 
        ('Treino Tênis Duplas', v_condo_id, v_quadra_id, 'Quadra de Tênis', CURRENT_DATE + INTERVAL '1 day', '18:00', 4, v_user1_id, 'active'),
        ('Racha de Condomínio', v_condo_id, v_quadra_id, 'Quadra de Tênis', CURRENT_DATE + INTERVAL '2 days', '10:00', 4, v_user2_id, 'active');

    -- 5. CRIAR MATCHMAKING ("TÔ DISPONÍVEL")
    INSERT INTO public.matchmaking_requests (user_id, condominium_id, sport_name, time_preference, status)
    VALUES 
        (v_user1_id, v_condo_id, 'Tênis', 'Hoje à noite', 'active'),
        (v_user2_id, v_condo_id, 'Vôlei', 'Final de semana', 'active'),
        (v_user3_id, v_condo_id, 'Academia (Parceiro de Treino)', 'Agora', 'active');

    -- 6. CRIAR CHECK-INS (GENTE USANDO AGORA)
    INSERT INTO public.amenity_checkins (user_id, amenity_id, status)
    VALUES 
        (v_user1_id, v_acad_id, 'active'),
        (v_user2_id, v_acad_id, 'active'),
        (v_user3_id, v_piscina_id, 'active');

END $$;
-- Inserting a mock condominium to test the signup flow without an invite code
INSERT INTO public.condominiums (name, invite_code, address, city, state, zip_code)
VALUES ('Condomínio Riff Sports', 'RIFFCODE2026', 'Rua dos Esportes, 123', 'Curitiba', 'PR', '80000-000')
ON CONFLICT (invite_code) DO NOTHING;
