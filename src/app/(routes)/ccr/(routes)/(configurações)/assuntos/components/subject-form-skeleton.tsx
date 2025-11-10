import { Skeleton } from "@/components/ui/skeleton";

export function SubjectFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Campo Nome */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Campo Descrição */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-20" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Campo Assunto Pai */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-44" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-96" />
      </div>

      {/* Campo Assunto Ativo (switch) */}
      <div className="rounded-md border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-64" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
