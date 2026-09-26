/**
 * @file useCondominiumId.ts
 * Fonte única da verdade para o condominium_id do usuário logado.
 * Lê SEMPRE de profiles.condominium_id (nunca de user_metadata).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useCondominiumId() {
  const { user } = useAuth();

  const { data: condominiumId, isLoading, refetch } = useQuery({
    queryKey: ["profile", "condominium", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("condominium_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return (data?.condominium_id as string) ?? null;
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  return {
    condominiumId: condominiumId ?? null,
    isLoading,
    refetch,
    hasCondominium: !!condominiumId,
  };
}
