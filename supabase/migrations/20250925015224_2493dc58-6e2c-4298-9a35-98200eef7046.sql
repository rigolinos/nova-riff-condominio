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
CREATE TRIGGER update_suggested_sports_updated_at
BEFORE UPDATE ON public.suggested_sports
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();