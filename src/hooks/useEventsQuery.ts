/**
 * @file useEventsQuery.ts
 * @description React Query hooks para dados de eventos.
 * Sprint 1 – Migração do Zustand → React Query para dados de servidor.
 * 
 * Cache: staleTime = 2 min (eventos mudam com frequência moderada)
 * Invalidação: após joinEvent / leaveEvent
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

// ---------------------------------------------------------------------------
// Keys de cache (centralizados para facilitar invalidação)
// ---------------------------------------------------------------------------

export const eventKeys = {
  all: ["events"] as const,
  list: () => [...eventKeys.all, "list"] as const,
  detail: (id: string) => [...eventKeys.all, "detail", id] as const,
};

// ---------------------------------------------------------------------------
// Tipos
// ---------------------------------------------------------------------------

export interface Event {
  id: string;
  title: string;
  description?: string;
  location: string;
  date: string;
  time: string;
  max_participants?: number;
  created_by: string;
  sport_id?: string;
  status: "active" | "cancelled" | "completed" | "paused";
  image_url?: string;
  created_at: string;
  updated_at: string;
  participant_count?: number;
  is_participant?: boolean;
  creator_name?: string;
  skill_level?: string;
  user_participation_status?: string;
  user_evaluation_status?: string;
  amenity_id?: string;
  condominium_id?: string;
}

// ---------------------------------------------------------------------------
// Hook: Lista de eventos (com dados mockados para modo bypass)
// ---------------------------------------------------------------------------

const MOCK_EVENTS: Event[] = [
  {
    id: "event-1",
    title: "Futebol dos Amigos",
    location: "Quadra Society",
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    max_participants: 14,
    created_by: "fake-user-id",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    participant_count: 10,
    is_participant: true,
    creator_name: "João da Silva",
    skill_level: "Amigável",
    user_participation_status: "registered",
  },
  {
    id: "event-2",
    title: "Tênis Matinal",
    location: "Quadra de Tênis",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "08:00",
    max_participants: 4,
    created_by: "another-user-id",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    participant_count: 2,
    is_participant: false,
    creator_name: "Maria Souza",
    skill_level: "Intermediário",
  },
];

async function fetchEvents(userId?: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select(`*, event_participants!left (user_id, status, evaluation_status)`)
    .order("date", { ascending: true });

  if (error) throw error;

  return (data ?? []).map((event) => {
    const userParticipation = event.event_participants?.find(
      (p: any) => p.user_id === userId
    );
    return {
      ...event,
      creator_name: "Usuário",
      status: event.status as Event["status"],
      is_participant: !!userParticipation,
      user_participation_status: userParticipation?.status,
      user_evaluation_status: userParticipation?.evaluation_status,
    };
  });
}

export function useEventsQuery(userId?: string) {
  return useQuery({
    queryKey: eventKeys.list(),
    queryFn: () => fetchEvents(userId),
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 10 * 60 * 1000, // mantém em memória por 10 min
    retry: 2,
  });
}

// ---------------------------------------------------------------------------
// Hook: Evento individual
// ---------------------------------------------------------------------------

export function useEventDetailQuery(eventId: string | undefined) {
  return useQuery({
    queryKey: eventKeys.detail(eventId ?? ""),
    queryFn: async (): Promise<Event | null> => {
      if (!eventId) return null;

      const { data, error } = await supabase
        .from("events")
        .select(`*, event_participants!left (user_id, status, evaluation_status)`)
        .eq("id", eventId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!eventId,
    staleTime: 1 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutation: Participar de evento
// ---------------------------------------------------------------------------

export function useJoinEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
    }: {
      eventId: string;
      userId: string;
    }) => {
      const { error } = await supabase.from("event_participants").insert([
        {
          event_id: eventId,
          user_id: userId,
          status: "registered",
        },
      ]);
      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      // Invalida a lista geral e os detalhes do evento específico
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast({ title: "Participação confirmada!" });
    },
    onError: () => {
      toast({
        title: "Erro ao se inscrever",
        variant: "destructive",
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Mutation: Sair do evento
// ---------------------------------------------------------------------------

export function useLeaveEventMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      eventId,
      userId,
    }: {
      eventId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from("event_participants")
        .update({ status: "cancelled" })
        .eq("event_id", eventId)
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { eventId }) => {
      queryClient.invalidateQueries({ queryKey: eventKeys.list() });
      queryClient.invalidateQueries({ queryKey: eventKeys.detail(eventId) });
      toast({ title: "Você saiu do evento." });
    },
    onError: () => {
      toast({ title: "Erro ao cancelar inscrição", variant: "destructive" });
    },
  });
}
