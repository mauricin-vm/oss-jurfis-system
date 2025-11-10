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
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Protocol {
  id: string;
  number: string;
  originationDate: Date;
  receptionDate: Date;
  subject: string;
  status: string;
  isActive: boolean;
  employee: {
    id: string;
    name: string;
  };
  sector?: {
    id: string;
    name: string;
    abbreviation: string | null;
  } | null;
  protocolParts: Array<{
    part: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    tramitations: number;
  };
  resource?: any;
}

interface ProtocolTableProps {
  data: Protocol[];
  loading: boolean;
  onRefresh: () => void;
}

const statusLabels: Record<string, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em Análise',
  ADMITIDO: 'Admitido',
  NAO_ADMITIDO: 'Não Admitido',
  CONVERTIDO_RECURSO: 'Convertido em Recurso',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  PENDENTE: 'secondary',
  EM_ANALISE: 'default',
  ADMITIDO: 'default',
  NAO_ADMITIDO: 'destructive',
  CONVERTIDO_RECURSO: 'outline',
};

export function ProtocolTable({ data, loading, onRefresh }: ProtocolTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este protocolo?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ccr/protocols/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Protocolo removido com sucesso');
        onRefresh();
      } else {
        const error = await response.text();
        toast.error(error || 'Erro ao remover protocolo');
      }
    } catch (error) {
      console.error('Error deleting protocol:', error);
      toast.error('Erro ao remover protocolo');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos</CardTitle>
          <CardDescription>Carregando protocolos...</CardDescription>
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
          <CardTitle>Protocolos</CardTitle>
          <CardDescription>Ponto de entrada do sistema CCR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhum protocolo cadastrado ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Protocolos</CardTitle>
        <CardDescription>
          Total de {data.length} protocolo{data.length !== 1 ? 's' : ''} cadastrado{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Número</TableHead>
                <TableHead>Data Recepção</TableHead>
                <TableHead>Assunto</TableHead>
                <TableHead>Partes</TableHead>
                <TableHead>Setor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((protocol) => (
                <TableRow key={protocol.id}>
                  <TableCell className="font-medium font-mono text-sm">
                    {protocol.number}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(protocol.receptionDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="max-w-[300px] truncate">
                      {protocol.subject}
                    </div>
                  </TableCell>
                  <TableCell>
                    {protocol.protocolParts.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm">
                          {protocol.protocolParts[0].part.name}
                        </span>
                        {protocol.protocolParts.length > 1 && (
                          <Badge variant="secondary" className="w-fit">
                            +{protocol.protocolParts.length - 1} mais
                          </Badge>
                        )}
                      </div>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {protocol.sector ? (
                      <Badge variant="outline">
                        {protocol.sector.abbreviation || protocol.sector.name}
                      </Badge>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[protocol.status] || 'default'}>
                      {statusLabels[protocol.status] || protocol.status}
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
                          onClick={() => router.push(`/ccr/protocolos/${protocol.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar/Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(protocol.id)}
                          disabled={deletingId === protocol.id || !!protocol.resource}
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
