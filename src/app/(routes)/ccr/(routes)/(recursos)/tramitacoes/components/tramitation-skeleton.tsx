import { Skeleton } from "@/components/ui/skeleton";

export function TramitationSkeleton() {
  return (
    <div className="space-y-4">
      {/* Botões de busca, filtros e nova tramitação skeleton */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-8 w-40" />
      </div>

      {/* Cards de Estatísticas skeleton */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border bg-card shadow-sm">
            <div className="flex flex-row items-center justify-between space-y-0 pb-1 pt-4 px-6">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-4" />
            </div>
            <div className="space-y-0.5 pb-4 px-6">
              <Skeleton className="h-8 w-12" />
              <Skeleton className="h-3 w-32 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Lista de Tramitações skeleton */}
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="rounded-lg border bg-card shadow-sm p-4">
            <div className="space-y-3">
              {/* Header */}
              <div className="flex items-center justify-between">
                <Skeleton className="h-6 w-40" />
                <div className="flex items-center gap-2">
                  <Skeleton className="h-8 w-32" />
                </div>
              </div>

              {/* Fluxo */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-32" />
              </div>

              {/* Apresentante */}
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4" />
                <Skeleton className="h-4 w-48" />
              </div>

              {/* Observações */}
              <Skeleton className="h-16 w-full rounded" />

              {/* Datas e responsável */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Paginação skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-4 px-2 py-4">
        <div className="flex items-center gap-6">
          <Skeleton className="h-8 w-16" />
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <div className="flex items-center gap-1">
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
              <Skeleton className="h-8 w-8" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
