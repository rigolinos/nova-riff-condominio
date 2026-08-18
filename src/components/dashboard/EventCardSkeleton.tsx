/**
 * @file EventCardSkeleton.tsx
 * @description Skeleton espelhado do EventCard.
 * Sprint 2 – Elimina Cumulative Layout Shift (CLS) no feed de eventos.
 *
 * As dimensões (h-56, rounded-[1.5rem], padding, etc.) espelham exatamente
 * o EventCard real para que não haja salto de layout quando os dados chegam.
 */

import { Skeleton } from "@/components/ui/skeleton";

export function EventCardSkeleton() {
  return (
    <div className="w-full bg-white/[0.03] rounded-[1.5rem] overflow-hidden border border-white/5">
      {/* Imagem de capa — espelha h-56 do EventCard */}
      <div className="h-56 relative p-5 flex flex-col justify-between">
        {/* Badge de participantes (topo esquerdo) */}
        <Skeleton className="h-7 w-20 rounded-full bg-white/[0.06]" />

        {/* Conteúdo inferior */}
        <div className="space-y-3">
          {/* Título */}
          <Skeleton className="h-7 w-3/4 rounded-lg bg-white/[0.06]" />
          {/* Pill de data/hora */}
          <Skeleton className="h-9 w-44 rounded-xl bg-white/[0.06]" />
          {/* Tags de localização */}
          <div className="flex gap-2">
            <Skeleton className="h-7 w-28 rounded-lg bg-white/[0.06]" />
            <Skeleton className="h-7 w-24 rounded-lg bg-white/[0.06]" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Lista de Skeletons para o feed completo.
 * Uso: <EventListSkeleton count={3} />
 */
export function EventListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <EventCardSkeleton key={i} />
      ))}
    </div>
  );
}
