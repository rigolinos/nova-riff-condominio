/**
 * @file useRealtimeEvents.ts
 * @description Hook Realtime para o Feed de Eventos.
 * Sprint 2 – Conexão WebSocket segura com cleanup garantido.
 *
 * Padrão técnico do especialista:
 * - Canal nomeado com condominium_id para escopo isolado
 * - supabase.removeChannel() chamado no return do useEffect (sem memory leak)
 * - Invalida o cache do React Query para refetch suave em background
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { eventKeys } from "./useEventsQuery";

export function useRealtimeEvents(condominiumId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Não inicializa canal se não houver condomínio (bypass de auth)
    if (!condominiumId) return;

    const channel = supabase
      .channel(`realtime:events:${condominiumId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT, UPDATE, DELETE
          schema: "public",
          table: "events",
          filter: `condominium_id=eq.${condominiumId}`,
        },
        (payload) => {
          console.log("[Realtime] Evento atualizado:", payload.eventType);
          // Invalida o cache → React Query re-busca em background automaticamente
          queryClient.invalidateQueries({ queryKey: eventKeys.list() });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Canal de eventos conectado: ${condominiumId}`);
        }
      });

    // ✅ Refinamento do especialista: cleanup garante supabase.removeChannel()
    // sem vazamento de conexões quando o usuário troca de tela
    return () => {
      console.log("[Realtime] Desconectando canal de eventos...");
      supabase.removeChannel(channel);
    };
  }, [condominiumId, queryClient]);
}
