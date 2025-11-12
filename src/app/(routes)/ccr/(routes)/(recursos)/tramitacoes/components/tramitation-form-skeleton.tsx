import { Skeleton } from "@/components/ui/skeleton";

export function TramitationFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Linha 1: Número do Processo e Finalidade */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-0">
          <Skeleton className="h-4 w-40 mb-1.5" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-0">
          <Skeleton className="h-4 w-24 mb-1.5" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Linha 2: Tipo de Destino, Destino e Prazo */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-0">
          <Skeleton className="h-4 w-32 mb-1.5" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-0">
          <Skeleton className="h-4 w-28 mb-1.5" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-0">
          <Skeleton className="h-4 w-28 mb-1.5" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Campo Observações */}
      <div className="space-y-0">
        <Skeleton className="h-4 w-28 mb-1.5" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-36" />
      </div>
    </div>
  );
}
