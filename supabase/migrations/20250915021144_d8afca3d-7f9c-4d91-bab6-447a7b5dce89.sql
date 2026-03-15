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
CREATE TRIGGER update_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

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