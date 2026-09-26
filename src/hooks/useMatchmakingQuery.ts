/**
 * @file useMatchmakingQuery.ts
 * @description React Query hooks para Matchmaking ("Tô Disponível").
 * Sprint 1 – Migração do Zustand → React Query + schema Zod com expiração.
 *
 * Refinamento do especialista:
 * - Status efêmero: requests têm campo `expires_at` em UTC
 * - Cache: staleTime curto (30s) pois dados de matchmaking são muito dinâmicos
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { matchmakingSchema, type MatchmakingFormData } from "@/lib/schemas";

// ---------------------------------------------------------------------------
// Keys de cache
// ---------------------------------------------------------------------------

export const matchmakingKeys = {
  all: ["matchmaking"] as const,
  byCondominium: (condoId: string) =>
    [...matchmakingKeys.all, condoId] as const,
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface MatchmakingRequest {
  id: string;
  user_id: string;
  condominium_id: string;
  sport_name: string;
  time_preference: string;
  status: string;
  created_at: string;
  expires_at?: string;
  profiles?: {
    full_name: string;
    apt_number: string;
    block_number: string;
    phone?: string;
  };
}

// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Hook: Lista de requests por condomínio (filtra expirados no client)
// ---------------------------------------------------------------------------

async function fetchMatchmakingRequests(
  condominiumId: string
): Promise<MatchmakingRequest[]> {
  const { data, error } = await supabase
    .from("matchmaking_requests")
    .select(`*, profiles:user_id (full_name, apt_number, block_number, phone)`)
    .eq("condominium_id", condominiumId)
    .eq("status", "active")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Filtra requests expirados no cliente também (dupla garantia)
  const now = new Date();
  return (data ?? []).filter(
    (r: MatchmakingRequest) => !r.expires_at || new Date(r.expires_at) > now
  );
}

export function useMatchmakingQuery(condominiumId?: string) {
  return useQuery({
    queryKey: matchmakingKeys.byCondominium(condominiumId ?? ""),
    queryFn: () => fetchMatchmakingRequests(condominiumId ?? "mock-condo"),
    staleTime: 30 * 1000, // 30 segundos — dado muito dinâmico
    gcTime: 5 * 60 * 1000,
    refetchInterval: 60 * 1000, // recarrega a cada 1 min (até Realtime ser ativado na Sprint 2)
    enabled: true,
    retry: 1,
  });
}

// ---------------------------------------------------------------------------
// Mutation: Criar request de matchmaking (com validação Zod + UTC)
// ---------------------------------------------------------------------------

export function useCreateMatchmakingMutation(condominiumId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (formData: MatchmakingFormData) => {
      // Valida com Zod (lança ZodError se inválido)
      const parsed = matchmakingSchema.parse(formData);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não autenticado");

      const { error } = await supabase.from("matchmaking_requests").insert({
        sport_name: parsed.sportName,
        time_preference: parsed.timePreference,
        condominium_id: parsed.condominiumId,
        expires_at: parsed.expiresAt,  // TIMESTAMPTZ em UTC
        user_id: user.id,
        status: "active",
      });
      if (error) throw error;
      
      return { success: true, data: parsed };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: matchmakingKeys.byCondominium(condominiumId ?? ""),
      });
      toast({ title: "Aviso criado! Seus vizinhos serão notificados." });
    },
    onError: (err: Error) => {
      toast({
        title: "Erro ao criar aviso",
        description: err.message,
        variant: "destructive",
      });
    },
  });
}
