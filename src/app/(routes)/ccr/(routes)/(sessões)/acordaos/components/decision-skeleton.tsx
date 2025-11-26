'use client';

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function DecisionTableSkeleton() {
  return (
    <div className="space-y-4">
      {/* Botões skeleton */}
      <div className="flex justify-end gap-2">
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-8 w-24" />
      </div>

      {/* Tabela skeleton */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm overflow-hidden">
        <div className="relative w-full overflow-x-auto">
          <Table className="min-w-[700px]">
            <TableHeader>
              <TableRow className="bg-muted hover:bg-muted border-b">
                <TableHead className="font-semibold">Número</TableHead>
                <TableHead className="font-semibold">Recurso</TableHead>
                <TableHead className="font-semibold">Processo</TableHead>
                <TableHead className="font-semibold">Ementa</TableHead>
                <TableHead className="font-semibold">Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="bg-white">
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-24" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-32" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-48" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-6 w-20 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded" />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Paginação skeleton */}
      <div className="flex items-center justify-end gap-4 px-2 py-4">
        <Skeleton className="h-8 w-16" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-32" />
          <div className="flex items-center gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
