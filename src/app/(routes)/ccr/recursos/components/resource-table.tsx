'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Trash2, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Resource {
  id: string;
  resourceNumber: number;
  fiscalYear: number;
  status: string;
  totalValue: number | null;
  isActive: boolean;
  protocol: {
    id: string;
    number: string;
    subject: string;
    protocolParts: Array<{
      part: {
        id: string;
        name: string;
      };
    }>;
  };
  subjects: Array<{
    subject: {
      id: string;
      name: string;
    };
  }>;
  currentTramitation?: {
    toSector: {
      id: string;
      name: string;
      abbreviation: string | null;
    };
  } | null;
  _count?: {
    tramitations: number;
    documents: number;
    sessionResources: number;
  };
}

interface ResourceTableProps {
  data: Resource[];
  loading: boolean;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  AGUARDANDO_ANALISE: 'Aguardando Análise',
  EM_ANALISE: 'Em Análise',
  AGUARDANDO_SESSAO: 'Aguardando Sessão',
  EM_SESSAO: 'Em Sessão',
  JULGADO_PROCEDENTE: 'Julgado Procedente',
  JULGADO_IMPROCEDENTE: 'Julgado Improcedente',
  JULGADO_PARCIALMENTE: 'Julgado Parcialmente',
  ARQUIVADO: 'Arquivado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AGUARDANDO_ANALISE: 'secondary',
  EM_ANALISE: 'default',
  AGUARDANDO_SESSAO: 'outline',
  EM_SESSAO: 'default',
  JULGADO_PROCEDENTE: 'default',
  JULGADO_IMPROCEDENTE: 'destructive',
  JULGADO_PARCIALMENTE: 'outline',
  ARQUIVADO: 'secondary',
};

export function ResourceTable({ data, loading, onRefresh }: ResourceTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este recurso?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ccr/resources/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Recurso removido com sucesso');
        onRefresh();
      } else {
        const error = await response.text();
        toast.error(error || 'Erro ao remover recurso');
      }
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast.error('Erro ao remover recurso');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recursos</CardTitle>
          <CardDescription>Carregando recursos...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recursos</CardTitle>
          <CardDescription>Recursos convertidos a partir de protocolos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhum recurso cadastrado ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recursos</CardTitle>
        <CardDescription>
          Total de {data.length} recurso{data.length !== 1 ? 's' : ''} cadastrado{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Recurso</TableHead>
                <TableHead>Ano Fiscal</TableHead>
                <TableHead>Protocolo</TableHead>
                <TableHead>Recorrente</TableHead>
                <TableHead>Valor Total</TableHead>
                <TableHead>Localização</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((resource) => (
                <TableRow key={resource.id}>
                  <TableCell className="font-medium font-mono">
                    {resource.resourceNumber.toString().padStart(4, '0')}/{resource.fiscalYear}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{resource.fiscalYear}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-mono">{resource.protocol.number}</span>
                      <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                        {resource.protocol.subject}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {resource.protocol.protocolParts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {resource.protocol.protocolParts[0].part.name}
                        </span>
                        {resource.protocol.protocolParts.length > 1 && (
                          <Badge variant="secondary" className="w-fit text-xs">
                            +{resource.protocol.protocolParts.length - 1}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-medium">
                      {formatCurrency(resource.totalValue)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {resource.currentTramitation ? (
                      <Badge variant="outline">
                        {resource.currentTramitation.toSector.abbreviation ||
                          resource.currentTramitation.toSector.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[resource.status] || 'default'}>
                      {statusLabels[resource.status] || resource.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Abrir menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => router.push(`/ccr/recursos/${resource.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => router.push(`/ccr/protocolos/${resource.protocol.id}`)}
                        >
                          <FileText className="mr-2 h-4 w-4" />
                          Ver Protocolo
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(resource.id)}
                          disabled={deletingId === resource.id}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
