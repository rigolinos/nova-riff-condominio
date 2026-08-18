/**
 * @file useRealtimeMatchmaking.ts
 * @description Hook Realtime para o "Tô Disponível".
 * Sprint 2 – Escuta novos avisos e remoção instantânea de requests expirados.
 *
 * Atenção ao refinamento do especialista:
 * - O canal é destruído no cleanup do useEffect (supabase.removeChannel)
 * - Quando o usuário sai da tela de Matchmaking e volta, um novo canal é criado
 *   de forma limpa, sem acumular conexões abertas
 */

import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchmakingKeys } from "./useMatchmakingQuery";

export function useRealtimeMatchmaking(condominiumId?: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!condominiumId) return;

    const channel = supabase
      .channel(`realtime:matchmaking:${condominiumId}`)
      .on(
        "postgres_changes",
        {
          event: "*", // INSERT de novo aviso, UPDATE de status (expired/matched), DELETE
          schema: "public",
          table: "matchmaking_requests",
          filter: `condominium_id=eq.${condominiumId}`,
        },
        (payload) => {
          console.log("[Realtime] Matchmaking atualizado:", payload.eventType);

          // Para DELETE ou UPDATE de status → invalida para remover da lista
          // Para INSERT → invalida para exibir o novo aviso imediatamente
          queryClient.invalidateQueries({
            queryKey: matchmakingKeys.byCondominium(condominiumId),
          });
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log(`[Realtime] Canal de matchmaking conectado: ${condominiumId}`);
        }
      });

    // ✅ Cleanup garantido — previne acúmulo de WebSockets
    return () => {
      console.log("[Realtime] Desconectando canal de matchmaking...");
      supabase.removeChannel(channel);
    };
  }, [condominiumId, queryClient]);
}
