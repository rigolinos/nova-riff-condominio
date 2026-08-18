import { create } from 'zustand';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface Amenity {
  id: string;
  condominium_id: string;
  name: string;
  capacity?: number;
  type?: string;
  occupancy?: number;
  status?: string;
}

interface AmenityStore {
  amenities: Amenity[];
  loading: boolean;
  error: string | null;
  
  fetchAmenities: (condominiumId: string) => Promise<void>;
  checkIn: (amenityId: string) => Promise<{ success: boolean; error?: string }>;
  checkOut: (amenityId: string) => Promise<{ success: boolean; error?: string }>;
}

export const useAmenityStore = create<AmenityStore>((set, get) => ({
  amenities: [],
  loading: false,
  error: null,

  fetchAmenities: async (condominiumId: string) => {
    set({ loading: true, error: null });
    // FAKE DATA BYPASS
    setTimeout(() => {
      set({ 
        amenities: [
          { id: '1', condominium_id: condominiumId, name: 'Quadra de Tênis', capacity: 4, occupancy: 2, status: 'Ocupado' },
          { id: '2', condominium_id: condominiumId, name: 'Piscina', capacity: 20, occupancy: 5, status: 'Livre' },
          { id: '3', condominium_id: condominiumId, name: 'Academia', capacity: 10, occupancy: 10, status: 'Lotado' },
          { id: '4', condominium_id: condominiumId, name: 'Salão de Festas', capacity: 50, occupancy: 0, status: 'Livre' }
        ], 
        loading: false 
      });
    }, 500);
  },

  checkIn: async (amenityId: string) => {
    set(state => ({
      amenities: state.amenities.map(a => 
        a.id === amenityId ? { ...a, occupancy: (a.occupancy || 0) + 1, status: 'Ocupado' } : a
      )
    }));
    return { success: true };
  },

  checkOut: async (amenityId: string) => {
    set(state => ({
      amenities: state.amenities.map(a => 
        a.id === amenityId ? { 
          ...a, 
          occupancy: Math.max((a.occupancy || 1) - 1, 0),
          status: (a.occupancy || 1) - 1 > 0 ? 'Ocupado' : 'Livre' 
        } : a
      )
    }));
    return { success: true };
  }
}));
