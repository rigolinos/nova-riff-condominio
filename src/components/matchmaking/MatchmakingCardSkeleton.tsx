/**
 * @file MatchmakingCardSkeleton.tsx
 * @description Skeleton espelhado do card de Matchmaking.
 * Sprint 2 – Elimina CLS na lista "Tô Disponível".
 *
 * Dimensões espelham exatamente o card real (p-5, gap-4, avatar w-12 h-12, etc.)
 */

import { Skeleton } from "@/components/ui/skeleton";

export function MatchmakingCardSkeleton() {
  return (
    <div className="bg-white/[0.03] rounded-3xl p-5 flex gap-4 items-center border border-white/5">
      {/* Avatar circular — espelha w-12 h-12 do card real */}
      <Skeleton className="w-12 h-12 rounded-full flex-shrink-0 bg-white/[0.06]" />

      {/* Conteúdo central */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* Nome do usuário */}
        <Skeleton className="h-5 w-2/3 rounded-md bg-white/[0.06]" />
        {/* Esporte + horário */}
        <div className="flex gap-2">
          <Skeleton className="h-4 w-20 rounded-md bg-white/[0.06]" />
          <Skeleton className="h-4 w-28 rounded-md bg-white/[0.06]" />
        </div>
      </div>

      {/* Área direita: timestamp + botão */}
      <div className="flex-shrink-0 space-y-2 items-end flex flex-col">
        <Skeleton className="h-3 w-14 rounded bg-white/[0.06]" />
        <Skeleton className="h-7 w-24 rounded-full bg-white/[0.06]" />
      </div>
    </div>
  );
}

/**
 * Lista de Skeletons para a seção de matchmaking.
 */
export function MatchmakingListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <MatchmakingCardSkeleton key={i} />
      ))}
    </div>
  );
}
