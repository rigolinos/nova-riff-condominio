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
// Dados mockados (bypass de auth)
// ---------------------------------------------------------------------------

const MOCK_PASSES: GuestPass[] = [
  {
    id: "pass-1",
    pass_token: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    event_id: "event-1",
    created_by: "fake-user-id",
    guest_name: "Carlos Eduardo",
    guest_document: "123.456.789-00",
    status: "active",
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
  {
    id: "pass-2",
    pass_token: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    event_id: "event-1",
    created_by: "fake-user-id",
    guest_name: "Patrícia Alves",
    status: "used",
    valid_from: new Date().toISOString(),
    valid_until: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
    checked_in_at: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    created_at: new Date().toISOString(),
  },
];

// ---------------------------------------------------------------------------
// Hook: Lista de passes por evento
// ---------------------------------------------------------------------------

async function fetchGuestPasses(eventId: string): Promise<GuestPass[]> {
  // BYPASS: dados mockados
  return MOCK_PASSES.filter(p => p.event_id === eventId);

  /* -- Código real --
  const { data, error } = await supabase
    .from("guest_passes")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data ?? [];
  */
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
      // BYPASS: simula criação local
      const newPass: GuestPass = {
        id: `pass-${Date.now()}`,
        pass_token: crypto.randomUUID(),
        event_id: input.eventId,
        created_by: "fake-user-id",
        guest_name: input.guestName,
        guest_document: input.guestDocument,
        status: "active",
        valid_from: input.validFrom,
        valid_until: input.validUntil,
        created_at: new Date().toISOString(),
      };
      return newPass;

      /* -- Código real --
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
      */
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
      // BYPASS: simula validação local
      const pass = MOCK_PASSES.find(p => p.pass_token === passToken);

      if (!pass) {
        return { success: false, status: "not_found", message: "QR Code inválido ou não encontrado." };
      }
      if (pass.status === "used") {
        return { success: false, status: "already_used", message: "Este passe já foi utilizado.", guest_name: pass.guest_name };
      }
      if (pass.status === "expired") {
        return { success: false, status: "expired", message: "Este passe expirou.", guest_name: pass.guest_name };
      }

      // Marca como usado localmente no mock
      pass.status = "used";
      pass.checked_in_at = new Date().toISOString();

      return {
        success: true,
        status: "checked_in",
        message: "Entrada autorizada! ✅",
        guest_name: pass.guest_name,
        event_title: "Futebol dos Amigos",
        checked_in_at: pass.checked_in_at,
      };

      /* -- Código real via RPC Supabase --
      const { data, error } = await supabase.rpc("validate_guest_pass", {
        p_pass_token: passToken,
        p_gatekeeper_id: (await supabase.auth.getUser()).data.user?.id ?? null,
      });
      if (error) throw error;
      return data as ValidationResult;
      */
    },
    onSuccess: (result) => {
      if (result.success) {
        // Invalida cache para refletir o status 'used'
        queryClient.invalidateQueries({ queryKey: gatekeeperKeys.all });
      }
    },
  });
}
