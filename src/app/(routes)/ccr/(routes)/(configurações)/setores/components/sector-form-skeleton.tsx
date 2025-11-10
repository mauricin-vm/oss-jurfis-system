import { Skeleton } from "@/components/ui/skeleton";

export function SectorFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Campo Nome */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Campos Abreviação e Código de Despacho (grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Campo Descrição */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-18" />
        <Skeleton className="h-24 w-full" />
      </div>

      {/* Campos Telefone e Email (grid) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      {/* Campo Endereço */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-20 w-full" />
      </div>

      {/* Campo Setor Ativo (switch) */}
      <div className="rounded-md border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-60" />
          </div>
          <Skeleton className="h-5 w-9 rounded-full" />
        </div>
      </div>

      {/* Botões */}
      <div className="flex justify-end gap-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}
