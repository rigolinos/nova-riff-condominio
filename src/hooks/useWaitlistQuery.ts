/**
 * @file useWaitlistQuery.ts
 * @description React Query hooks para Fila de Espera (Waitlist).
 * Sprint 3 – Listagem da fila + inscrição via RPC join_event_or_waitlist.
 *
 * A RPC decide automaticamente: se há vaga → registered; se lotado → waiting_list.
 * A promoção da fila ocorre via trigger no banco (promote_from_waitlist).
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { eventKeys } from "./useEventsQuery";

// ---------------------------------------------------------------------------
// Keys de cache
// ---------------------------------------------------------------------------

export const waitlistKeys = {
  all: ["waitlist"] as const,
  byEvent: (eventId: string) => [...waitlistKeys.all, eventId] as const,
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export type ParticipantStatus = "registered" | "waiting_list" | "cancelled" | "attended" | "no_show";

export interface EventParticipant {
  id: string;
  event_id: string;
  user_id: string;
  status: ParticipantStatus;
  waitlist_position?: number;
  promoted_from_waitlist_at?: string;
  created_at: string;
  profiles?: {
    full_name: string;
    apt_number?: string;
    block_number?: string;
    avatar_url?: string;
  };
}

export interface JoinEventResult {
  success: boolean;
  status: "registered" | "waiting_list";
  position?: number;
  message: string;
}

// ---------------------------------------------------------------------------
// Dados mockados
// ---------------------------------------------------------------------------

const MOCK_PARTICIPANTS: EventParticipant[] = [
  {
    id: "part-1",
    event_id: "event-1",
    user_id: "user-a",
    status: "registered",
    created_at: new Date().toISOString(),
    profiles: { full_name: "Rafael Mota", apt_number: "301", block_number: "C" },
  },
  {
    id: "part-2",
    event_id: "event-1",
    user_id: "user-b",
    status: "registered",
    created_at: new Date().toISOString(),
    profiles: { full_name: "Luiza Carvalho", apt_number: "102", block_number: "A" },
  },
  {
    id: "part-3",
    event_id: "event-1",
    user_id: "user-c",
    status: "waiting_list",
    waitlist_position: 1,
    created_at: new Date().toISOString(),
    profiles: { full_name: "Diego Faria", apt_number: "205", block_number: "B" },
  },
];

// ---------------------------------------------------------------------------
// Hook: Participantes de um evento (confirmados + fila)
// ---------------------------------------------------------------------------

async function fetchParticipants(eventId: string): Promise<EventParticipant[]> {
  // BYPASS
  return MOCK_PARTICIPANTS.filter(p => p.event_id === eventId);

  /* -- Código real --
  const { data, error } = await supabase
    .from("event_participants")
    .select(`*, profiles:user_id (full_name, apt_number, block_number, avatar_url)`)
    .eq("event_id", eventId)
    .in("status", ["registered", "waiting_list"])
    .order("waitlist_position", { ascending: true, nullsFirst: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data ?? [];
  */
}

export function useWaitlistQuery(eventId?: string) {
  return useQuery({
    queryKey: waitlistKeys.byEvent(eventId ?? ""),
    queryFn: () => fetchParticipants(eventId ?? ""),
    enabled: !!eventId,
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
    select: (data) => ({
      confirmed: data.filter(p => p.status === "registered"),
      waitlist: data.filter(p => p.status === "waiting_list"),
    }),
  });
}

// ---------------------------------------------------------------------------
// Mutation: Inscrever (com fila automática via RPC)
// ---------------------------------------------------------------------------

export function useJoinOrWaitlistMutation(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<JoinEventResult> => {
      // BYPASS: simula lógica da RPC localmente
      const confirmed = MOCK_PARTICIPANTS.filter(
        p => p.event_id === (eventId ?? "") && p.status === "registered"
      );
      const maxParticipants = 10; // mock

      if (confirmed.length < maxParticipants) {
        return { success: true, status: "registered", message: "Inscrição confirmada!" };
      } else {
        const pos = MOCK_PARTICIPANTS.filter(
          p => p.event_id === (eventId ?? "") && p.status === "waiting_list"
        ).length + 1;
        return {
          success: true,
          status: "waiting_list",
          position: pos,
          message: `Evento lotado! Você é o ${pos}º da fila de espera.`,
        };
      }

      /* -- Código real via RPC --
      const { data, error } = await supabase.rpc("join_event_or_waitlist", {
        p_event_id: eventId,
        p_user_id: userId,
      });
      if (error) throw error;
      return data as JoinEventResult;
      */
    },
    onSuccess: (result) => {
      // Invalida tanto a fila quanto a lista de eventos
      queryClient.invalidateQueries({ queryKey: waitlistKeys.byEvent(eventId ?? "") });
      queryClient.invalidateQueries({ queryKey: eventKeys.all });

      if (result.status === "waiting_list") {
        toast({
          title: "Você entrou na fila! 📋",
          description: result.message,
        });
      } else {
        toast({ title: "Inscrição confirmada! ✅" });
      }
    },
    onError: () => {
      toast({ title: "Erro ao se inscrever", variant: "destructive" });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: Cancelar inscrição (trigger promove automaticamente o próximo)
// ---------------------------------------------------------------------------

export function useCancelParticipationMutation(eventId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string): Promise<void> => {
      // BYPASS
      return;

      /* -- Código real --
      const { error } = await supabase
        .from("event_participants")
        .update({ status: "cancelled" })
        .eq("event_id", eventId)
        .eq("user_id", userId);

      if (error) throw error;
      // O trigger promote_from_waitlist é acionado automaticamente no banco
      */
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: waitlistKeys.byEvent(eventId ?? "") });
      queryClient.invalidateQueries({ queryKey: eventKeys.all });
      toast({ title: "Inscrição cancelada. O próximo da fila foi notificado." });
    },
    onError: () => {
      toast({ title: "Erro ao cancelar inscrição", variant: "destructive" });
    },
  });
}
