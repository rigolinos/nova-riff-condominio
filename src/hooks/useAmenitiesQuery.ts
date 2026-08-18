/**
 * @file useAmenitiesQuery.ts
 * @description React Query hooks para dados de áreas comuns (amenities).
 * Sprint 1 – Migração do Zustand → React Query para dados de servidor.
 *
 * Cache: staleTime = 5 min (lotação muda com frequência moderada)
 * Realtime será adicionado na Sprint 2 via useRealtimeSubscription.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Keys de cache
// ---------------------------------------------------------------------------

export const amenityKeys = {
  all: ["amenities"] as const,
  byCondominium: (condoId: string) =>
    [...amenityKeys.all, condoId] as const,
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface Amenity {
  id: string;
  condominium_id: string;
  name: string;
  capacity?: number;
  type?: string;
  occupancy?: number;
  status?: string;
}

// ---------------------------------------------------------------------------
// Dados mockados (bypass de auth)
// ---------------------------------------------------------------------------

const MOCK_AMENITIES: Amenity[] = [
  { id: "1", condominium_id: "mock-condo", name: "Quadra de Tênis", capacity: 4, occupancy: 2, status: "Ocupado" },
  { id: "2", condominium_id: "mock-condo", name: "Piscina", capacity: 20, occupancy: 5, status: "Livre" },
  { id: "3", condominium_id: "mock-condo", name: "Academia", capacity: 10, occupancy: 10, status: "Lotado" },
  { id: "4", condominium_id: "mock-condo", name: "Salão de Festas", capacity: 50, occupancy: 0, status: "Livre" },
];

// ---------------------------------------------------------------------------
// Hook: Lista de amenities por condomínio
// ---------------------------------------------------------------------------

async function fetchAmenities(condominiumId: string): Promise<Amenity[]> {
  // BYPASS: retorna dados mockados enquanto a auth está desativada
  return MOCK_AMENITIES.map((a) => ({ ...a, condominium_id: condominiumId }));

  /* -- Código real (será reativado na Sprint 2) --
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
  */
}

export function useAmenitiesQuery(condominiumId?: string) {
  return useQuery({
    queryKey: amenityKeys.byCondominium(condominiumId ?? ""),
    queryFn: () => fetchAmenities(condominiumId ?? "mock-condo"),
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 15 * 60 * 1000,
    enabled: true, // sempre habilitado no modo bypass
    retry: 2,
  });
}

// ---------------------------------------------------------------------------
// Mutation: Check-in em área comum
// ---------------------------------------------------------------------------

export function useCheckInMutation(condominiumId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amenityId,
      userId,
    }: {
      amenityId: string;
      userId: string;
    }) => {
      // BYPASS: apenas atualiza cache local
      return { success: true };

      /* -- Código real --
      const { error } = await supabase.from("amenity_checkins").insert({
        user_id: userId,
        amenity_id: amenityId,
        status: "active",
      });
      if (error) throw error;
      */
    },
    onSuccess: (_data, { amenityId }) => {
      // Atualização otimista no cache
      queryClient.setQueryData<Amenity[]>(
        amenityKeys.byCondominium(condominiumId ?? ""),
        (old) =>
          old?.map((a) =>
            a.id === amenityId
              ? { ...a, occupancy: (a.occupancy || 0) + 1, status: "Ocupado" }
              : a
          )
      );
    },
    onError: () => {
      toast({ title: "Erro ao fazer check-in", variant: "destructive" });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: Check-out de área comum
// ---------------------------------------------------------------------------

export function useCheckOutMutation(condominiumId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      amenityId,
      userId,
    }: {
      amenityId: string;
      userId: string;
    }) => {
      // BYPASS
      return { success: true };

      /* -- Código real --
      const { error } = await supabase
        .from("amenity_checkins")
        .update({ status: "completed", checkout_time: new Date().toISOString() })
        .eq("amenity_id", amenityId)
        .eq("user_id", userId)
        .eq("status", "active");
      if (error) throw error;
      */
    },
    onSuccess: (_data, { amenityId }) => {
      queryClient.setQueryData<Amenity[]>(
        amenityKeys.byCondominium(condominiumId ?? ""),
        (old) =>
          old?.map((a) =>
            a.id === amenityId
              ? {
                  ...a,
                  occupancy: Math.max((a.occupancy || 1) - 1, 0),
                  status: (a.occupancy || 1) - 1 > 0 ? "Ocupado" : "Livre",
                }
              : a
          )
      );
    },
    onError: () => {
      toast({ title: "Erro ao fazer check-out", variant: "destructive" });
    },
  });
}
