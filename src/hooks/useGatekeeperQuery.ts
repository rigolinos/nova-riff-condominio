/**
 * @file useGatekeeperQuery.ts
 * @description React Query hooks para Portaria (Gatekeeper).
 * Sprint 3 – Listagem de passes ativos + validação atômica via RPC.
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Keys de cache
// ---------------------------------------------------------------------------

export const gatekeeperKeys = {
  all: ["gatekeeper"] as const,
  passes: (eventId: string) => [...gatekeeperKeys.all, "passes", eventId] as const,
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type PassStatus = "active" | "used" | "expired" | "cancelled";

export interface GuestPass {
  id: string;
  pass_token: string;
  event_id: string;
  created_by: string;
  guest_name: string;
  guest_document?: string;
  status: PassStatus;
  valid_from: string;
  valid_until: string;
  checked_in_at?: string;
  checked_in_by?: string;
  created_at: string;
}

export interface ValidationResult {
  success: boolean;
  status: "checked_in" | "already_used" | "expired" | "not_found" | "cancelled" | "not_yet_valid";
  message: string;
  guest_name?: string;
  event_title?: string;
  checked_in_at?: string;
  valid_until?: string;
}

// ---------------------------------------------------------------------------
// Hook: Lista de passes por evento
// ---------------------------------------------------------------------------

async function fetchGuestPasses(eventId: string): Promise<GuestPass[]> {
  const { data, error } = await supabase
    .from("guest_passes")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export function useGuestPassesQuery(eventId?: string) {
  return useQuery({
    queryKey: gatekeeperKeys.passes(eventId ?? ""),
    queryFn: () => fetchGuestPasses(eventId ?? ""),
    enabled: !!eventId,
    staleTime: 30 * 1000, // 30s — dado muito dinâmico para portaria
    gcTime: 5 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutation: Criar passe de convidado
// ---------------------------------------------------------------------------

export interface CreatePassInput {
  eventId: string;
  guestName: string;
  guestDocument?: string;
  validFrom: string;   // TIMESTAMPTZ UTC
  validUntil: string;  // TIMESTAMPTZ UTC (evento + 30 min grace)
}

export function useCreateGuestPassMutation(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreatePassInput): Promise<GuestPass> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { data, error } = await supabase
        .from("guest_passes")
        .insert({
          event_id: input.eventId,
          created_by: user.id,
          guest_name: input.guestName,
          guest_document: input.guestDocument || null,
          valid_from: input.validFrom,
          valid_until: input.validUntil,
          status: "active",
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: gatekeeperKeys.passes(eventId ?? ""),
      });
      toast({ title: "Passe criado! Compartilhe com o convidado." });
    },
    onError: () => {
      toast({ title: "Erro ao criar passe", variant: "destructive" });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: Validar passe via token (chamada pelo porteiro após scan)
// ---------------------------------------------------------------------------

export function useValidateGuestPassMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (passToken: string): Promise<ValidationResult> => {
      const { data, error } = await supabase.rpc("validate_guest_pass", {
        p_pass_token: passToken,
        p_gatekeeper_id: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      if (error) throw error;
      return data as ValidationResult;
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalida cache para refletir o status 'used'
        queryClient.invalidateQueries({ queryKey: gatekeeperKeys.all });
      }
    },
  });
}
