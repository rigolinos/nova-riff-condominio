import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  max_participants?: number;
  created_by: string;
  sport_id?: string;
  status: 'active' | 'cancelled' | 'completed' | 'paused';
  image_url?: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  is_participant?: boolean;
  creator_name?: string;
  skill_level?: string;
  user_participation_status?: string;
  user_evaluation_status?: string;
}

interface EventStore {
  events: Event[];
  loading: boolean;
  error: string | null;
  
  // Actions
  fetchEvents: () => Promise<void>;
  joinEvent: (eventId: string) => Promise<{ success: boolean; error?: string; eventData?: any }>;
  leaveEvent: (eventId: string) => Promise<{ success: boolean; error?: string }>;
  updateEventInStore: (eventId: string, updates: Partial<Event>) => void;
  refreshSingleEvent: (eventId: string) => Promise<void>;
}

export const useEventStore = create<EventStore>((set, get) => ({
  events: [],
  loading: false,
  error: null,

  fetchEvents: async () => {
    try {
      set({ loading: true, error: null });
      
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants!left (
            user_id,
            status,
            evaluation_status
          )
        `)
        .order('date', { ascending: true });

      if (error) throw error;

      const eventsWithParticipation = data?.map(event => {
        const userParticipation = event.event_participants?.find(
          (participant: any) => participant.user_id === user?.id
        );
        
        return {
          ...event,
          creator_name: 'Usuário',
          status: event.status as 'active' | 'cancelled' | 'completed' | 'paused',
          is_participant: !!userParticipation,
          user_participation_status: userParticipation?.status,
          user_evaluation_status: userParticipation?.evaluation_status
        };
      }) || [];

      set({ events: eventsWithParticipation, loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar eventos';
      set({ error: errorMessage, loading: false });
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive",
      });
    }
  },

  joinEvent: async (eventId: string) => {
    if (!eventId) {
      return { success: false, error: 'ID do evento inválido' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const events = get().events;
      const event = events.find(e => e.id === eventId);
      
      if (!event) {
        return { success: false, error: 'Evento não encontrado' };
      }

      if (event.is_participant) {
        return { success: false, error: 'Você já está inscrito neste evento' };
      }

      if (event.max_participants && event.participant_count! >= event.max_participants) {
        return { success: false, error: 'Evento está lotado' };
      }

      const { error } = await supabase
        .from('event_participants')
        .insert({
          event_id: eventId,
          user_id: user.id,
          status: 'registered'
        });

      if (error) throw error;
      
      // Update local state immediately for better UX
      set(state => ({
        events: state.events.map(e => 
          e.id === eventId 
            ? { 
                ...e, 
                is_participant: true, 
                participant_count: (e.participant_count || 0) + 1,
                user_participation_status: 'registered'
              }
            : e
        )
      }));
      
      return { 
        success: true, 
        eventData: event 
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao se inscrever no evento';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },

  leaveEvent: async (eventId: string) => {
    if (!eventId) {
      return { success: false, error: 'ID do evento inválido' };
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('event_participants')
        .delete()
        .eq('event_id', eventId)
        .eq('user_id', user.id);

      if (error) throw error;
      
      // Update local state immediately
      set(state => ({
        events: state.events.map(e => 
          e.id === eventId 
            ? { 
                ...e, 
                is_participant: false, 
                participant_count: Math.max((e.participant_count || 1) - 1, 0),
                user_participation_status: undefined
              }
            : e
        )
      }));
      
      return { success: true };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao cancelar inscrição';
      return { 
        success: false, 
        error: errorMessage 
      };
    }
  },

  updateEventInStore: (eventId: string, updates: Partial<Event>) => {
    set(state => ({
      events: state.events.map(e => 
        e.id === eventId ? { ...e, ...updates } : e
      )
    }));
  },

  refreshSingleEvent: async (eventId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('events')
        .select(`
          *,
          event_participants!left (
            user_id,
            status,
            evaluation_status
          )
        `)
        .eq('id', eventId)
        .single();

      if (error) throw error;

      const userParticipation = data.event_participants?.find(
        (participant: any) => participant.user_id === user?.id
      );

      const updatedEvent = {
        ...data,
        creator_name: 'Usuário',
        status: data.status as 'active' | 'cancelled' | 'completed' | 'paused',
        is_participant: !!userParticipation,
        user_participation_status: userParticipation?.status,
        user_evaluation_status: userParticipation?.evaluation_status
      };

      set(state => ({
        events: state.events.map(e => 
          e.id === eventId ? updatedEvent : e
        )
      }));
    } catch (err) {
      console.error('Error refreshing single event:', err);
    }
  }
}));