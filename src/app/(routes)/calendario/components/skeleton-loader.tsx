import { Skeleton } from "@/components/ui/skeleton";

export function SidebarSkeleton() {
  return (
    <div className="w-72 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 overflow-y-auto">
      <div className="space-y-4 h-full flex flex-col">
        {/* Mini Calendário Skeleton */}
        <div className="border-b p-4">
          <Skeleton className="h-6 w-32 mb-4" />
          <div className="grid grid-cols-7 gap-2 mb-3">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-6" />
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-8" />
            ))}
          </div>
        </div>

        {/* Ações Skeleton */}
        <div className="space-y-2 flex-1 px-4">
          <Skeleton className="h-5 w-16 mb-3" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
        </div>

        {/* Footer Skeleton */}
        <div className="border-t pt-4 mt-auto px-4 pb-4">
          <Skeleton className="h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

export function CalendarGridSkeleton() {
  return (
    <div className="bg-card border rounded-lg shadow-sm h-full flex flex-col overflow-hidden">
      {/* Header com dias da semana */}
      <div className="grid border-b bg-muted shrink-0" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
        <div className="p-3 text-center border-r">
          <Skeleton className="h-4 w-12 mx-auto" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className={`p-3 text-center ${i < 3 ? 'border-r' : ''}`}>
            <Skeleton className="h-5 w-24 mx-auto mb-1" />
            <Skeleton className="h-4 w-16 mx-auto" />
          </div>
        ))}
      </div>

      {/* Grid de horas */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {Array.from({ length: 11 }).map((_, hour) => (
          <div key={hour} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
            <div className="p-3 border-r bg-muted/30 text-center">
              <Skeleton className="h-4 w-10 mx-auto" />
            </div>
            {Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className={`min-h-[80px] relative bg-white ${i < 3 ? 'border-r' : ''}`}
              >
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
