import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface MatchmakingRequest {
  id: string;
  user_id: string;
  condominium_id: string;
  sport_name: string;
  time_preference: string;
  status: string;
  created_at: string;
  profiles?: {
    full_name: string;
    apt_number: string;
    block_number: string;
  };
}

interface MatchmakingStore {
  requests: MatchmakingRequest[];
  loading: boolean;
  error: string | null;
  
  fetchRequests: (condominiumId: string) => Promise<void>;
  createRequest: (data: Partial<MatchmakingRequest>) => Promise<{ success: boolean; error?: string }>;
}

export const useMatchmakingStore = create<MatchmakingStore>((set, get) => ({
  requests: [],
  loading: false,
  error: null,

  fetchRequests: async (condominiumId: string) => {
    try {
      set({ loading: true, error: null });
      
      const { data, error } = await supabase
        .from('matchmaking_requests')
        .select(`
          *,
          profiles:user_id (full_name, apt_number, block_number)
        `)
        .eq('condominium_id', condominiumId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ requests: data as MatchmakingRequest[], loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar matchmaking';
      set({ error: errorMessage, loading: false });
    }
  },

  createRequest: async (data: Partial<MatchmakingRequest>) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('matchmaking_requests')
        .insert({
          sport_name: data.sport_name || '',
          time_preference: data.time_preference || '',
          condominium_id: data.condominium_id || '',
          user_id: user.id,
          status: 'active'
        });

      if (error) throw error;
      
      // Re-fetch to get profile data joined correctly
      if (data.condominium_id) {
        get().fetchRequests(data.condominium_id);
      }

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao criar aviso' };
    }
  }
}));
