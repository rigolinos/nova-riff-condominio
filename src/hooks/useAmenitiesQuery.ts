import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export const amenityKeys = {
  all: ["amenities"] as const,
  byCondominium: (condoId: string) => [...amenityKeys.all, condoId] as const,
};

export interface Amenity {
  id: string;
  condominium_id: string;
  name: string;
  capacity?: number;
  type?: string;
  occupancy?: number;
  status?: string;
}

async function fetchAmenities(condominiumId: string): Promise<Amenity[]> {
  const { data: amenitiesData, error: amError } = await supabase
    .from("amenities")
    .select("*")
    .eq("condominium_id", condominiumId);

  if (amError) throw amError;

  const { data: checkinsData, error: chkError } = await supabase
    .from("amenity_checkins")
    .select("amenity_id")
    .eq("status", "active");

  if (chkError) throw chkError;

  const occupancyMap: Record<string, number> = {};
  checkinsData?.forEach((chk) => {
    occupancyMap[chk.amenity_id] = (occupancyMap[chk.amenity_id] || 0) + 1;
  });

  return (amenitiesData ?? []).map((am) => {
    const currentOcc = occupancyMap[am.id] || 0;
    let status = "Livre";
    if (am.capacity && currentOcc >= am.capacity) status = "Lotado";
    else if (currentOcc > 0) status = "Ocupado";
    return { ...am, occupancy: currentOcc, status };
  });
}

export function useAmenitiesQuery(condominiumId?: string) {
  return useQuery({
    queryKey: amenityKeys.byCondominium(condominiumId ?? ""),
    queryFn: () => fetchAmenities(condominiumId ?? ""),
    staleTime: 5 * 60 * 1000,
    gcTime: 15 * 60 * 1000,
    enabled: !!condominiumId,
    retry: 2,
  });
}

export function useCheckInMutation(condominiumId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amenityId, userId }: { amenityId: string; userId: string; }) => {
      const { error } = await supabase.from("amenity_checkins").insert({
        user_id: userId,
        amenity_id: amenityId,
        status: "active",
      });
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_data, { amenityId }) => {
      queryClient.setQueryData<Amenity[]>(
        amenityKeys.byCondominium(condominiumId ?? ""),
        (old) => old?.map((a) => a.id === amenityId ? { ...a, occupancy: (a.occupancy || 0) + 1, status: "Ocupado" } : a)
      );
    },
    onError: () => {
      toast({ title: "Erro ao fazer check-in", variant: "destructive" });
    },
  });
}

export function useCheckOutMutation(condominiumId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ amenityId, userId }: { amenityId: string; userId: string; }) => {
      const { error } = await supabase
        .from("amenity_checkins")
        .update({ status: "completed", checkout_time: new Date().toISOString() })
        .eq("amenity_id", amenityId)
        .eq("user_id", userId)
        .eq("status", "active");
      if (error) throw error;
      return { success: true };
    },
    onSuccess: (_data, { amenityId }) => {
      queryClient.setQueryData<Amenity[]>(
        amenityKeys.byCondominium(condominiumId ?? ""),
        (old) => old?.map((a) => a.id === amenityId ? { ...a, occupancy: Math.max((a.occupancy || 1) - 1, 0), status: (a.occupancy || 1) - 1 > 0 ? "Ocupado" : "Livre" } : a)
      );
    },
    onError: () => {
      toast({ title: "Erro ao fazer check-out", variant: "destructive" });
    },
  });
}
