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
    try {
      set({ loading: true, error: null });
      
      // Fetch amenities
      const { data: amenitiesData, error: amError } = await supabase
        .from('amenities')
        .select('*')
        .eq('condominium_id', condominiumId);

      if (amError) throw amError;

      // Fetch active check-ins to calculate occupancy
      const { data: checkinsData, error: chkError } = await supabase
        .from('amenity_checkins')
        .select('amenity_id')
        .eq('status', 'active');

      if (chkError) throw chkError;

      // Calculate occupancy map
      const occupancyMap: Record<string, number> = {};
      checkinsData?.forEach(chk => {
        occupancyMap[chk.amenity_id] = (occupancyMap[chk.amenity_id] || 0) + 1;
      });

      // Combine
      const enrichedAmenities = amenitiesData?.map(am => {
        const currentOcc = occupancyMap[am.id] || 0;
        let status = 'Livre';
        if (am.capacity && currentOcc >= am.capacity) status = 'Lotado';
        else if (currentOcc > 0) status = 'Ocupado';

        return {
          ...am,
          occupancy: currentOcc,
          status
        };
      }) || [];

      set({ amenities: enrichedAmenities, loading: false });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar espaços';
      set({ error: errorMessage, loading: false });
      toast({ title: "Erro", description: errorMessage, variant: "destructive" });
    }
  },

  checkIn: async (amenityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      // Check if already checked in somewhere else
      /* Optional business rule: limit 1 checkin per user */

      const { error } = await supabase
        .from('amenity_checkins')
        .insert({
          user_id: user.id,
          amenity_id: amenityId,
          status: 'active'
        });

      if (error) throw error;
      
      // Optimistic update
      set(state => ({
        amenities: state.amenities.map(a => 
          a.id === amenityId ? { ...a, occupancy: (a.occupancy || 0) + 1, status: 'Ocupado' } : a
        )
      }));

      return { success: true };
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao fazer check-in' };
    }
  },

  checkOut: async (amenityId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { error } = await supabase
        .from('amenity_checkins')
        .update({ status: 'completed', checkout_time: new Date().toISOString() })
        .eq('amenity_id', amenityId)
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (error) throw error;
      
      // Optimistic update
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
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : 'Erro ao fazer check-out' };
    }
  }
}));
