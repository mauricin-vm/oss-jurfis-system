import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
          <Skeleton className="h-4 w-32 mb-4" />
          <Skeleton className="h-9 w-24 mb-3" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Botão de filtros skeleton */}
      <div className="flex justify-end">
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Tabela skeleton */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          {/* Header */}
          <div className="bg-muted p-4 border-b">
            <div className="flex gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>

          {/* Linhas */}
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b">
              <div className="flex gap-4 items-center">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-7 w-16" />
                <Skeleton className="h-8 w-8 rounded" />
              </div>
            </div>
          ))}
        </div>
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
