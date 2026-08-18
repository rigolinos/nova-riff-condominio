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
    set({ loading: true, error: null });
    // FAKE DATA BYPASS
    setTimeout(() => {
      set({ 
        events: [
          {
            id: 'event-1',
            title: 'Futebol dos Amigos',
            location: 'Quadra Society',
            date: new Date().toISOString().split('T')[0],
            time: '19:00',
            max_participants: 14,
            created_by: 'fake-user-id',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            participant_count: 10,
            is_participant: true,
            creator_name: 'João da Silva',
            skill_level: 'Amigável',
            user_participation_status: 'registered'
          },
          {
            id: 'event-2',
            title: 'Tênis Matinal',
            location: 'Quadra de Tênis',
            date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
            time: '08:00',
            max_participants: 4,
            created_by: 'another-user-id',
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            participant_count: 2,
            is_participant: false,
            creator_name: 'Maria Souza',
            skill_level: 'Intermediário'
          }
        ], 
        loading: false 
      });
    }, 500);
  },

  joinEvent: async (eventId: string) => {
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
    return { success: true, eventData: get().events.find(e => e.id === eventId) };
  },

  leaveEvent: async (eventId: string) => {
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