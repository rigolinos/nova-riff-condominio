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
    set({ loading: true, error: null });
    setTimeout(() => {
      set({ 
        requests: [
          {
            id: 'req-1',
            user_id: 'fake-user-id',
            condominium_id: condominiumId,
            sport_name: 'Futebol Society',
            time_preference: 'Hoje à noite',
            status: 'active',
            created_at: new Date().toISOString(),
            profiles: { full_name: 'Marcos Silva', apt_number: '101', block_number: 'A' }
          }
        ], 
        loading: false 
      });
    }, 500);
  },

  createRequest: async (data: Partial<MatchmakingRequest>) => {
    return { success: true };
  }
}));
