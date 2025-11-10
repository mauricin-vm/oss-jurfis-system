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
import { MoreHorizontal, Eye, Trash2, Gavel } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Session {
  id: string;
  sessionNumber: number;
  sessionDate: Date;
  type: string;
  status: string;
  location: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  _count: {
    sessionResources: number;
    votes: number;
  };
}

interface SessionTableProps {
  data: Session[];
  loading: boolean;
  onRefresh: () => void;
}

const typeLabels: Record<string, string> = {
  ORDINARIA: 'Ordinária',
  EXTRAORDINARIA: 'Extraordinária',
  SOLENE: 'Solene',
};

const statusLabels: Record<string, string> = {
  AGENDADA: 'Agendada',
  EM_ANDAMENTO: 'Em Andamento',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  AGENDADA: 'secondary',
  EM_ANDAMENTO: 'default',
  FINALIZADA: 'outline',
  CANCELADA: 'destructive',
};

export function SessionTable({ data, loading, onRefresh }: SessionTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta sessão?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ccr/sessions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Sessão removida com sucesso');
        onRefresh();
      } else {
        const error = await response.text();
        toast.error(error || 'Erro ao remover sessão');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Erro ao remover sessão');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sessões</CardTitle>
          <CardDescription>Carregando sessões...</CardDescription>
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
          <CardTitle>Sessões</CardTitle>
          <CardDescription>Sessões de julgamento do CCR</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma sessão cadastrada ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sessões</CardTitle>
        <CardDescription>
          Total de {data.length} sessão{data.length !== 1 ? 'ões' : ''} cadastrada{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nº Sessão</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Local</TableHead>
                <TableHead>Recursos</TableHead>
                <TableHead>Votos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="font-medium font-mono">
                    {session.sessionNumber.toString().padStart(3, '0')}/{new Date(session.sessionDate).getFullYear()}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(session.sessionDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {typeLabels[session.type] || session.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {session.location || '-'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {session._count.sessionResources}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session._count.sessionResources === 1 ? 'recurso' : 'recursos'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <span className="text-sm font-medium">
                        {session._count.votes}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {session._count.votes === 1 ? 'voto' : 'votos'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariants[session.status] || 'default'}>
                      {statusLabels[session.status] || session.status}
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
                          onClick={() => router.push(`/ccr/sessoes/${session.id}`)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Visualizar
                        </DropdownMenuItem>
                        {session.status === 'AGENDADA' && (
                          <DropdownMenuItem
                            onClick={() => router.push(`/ccr/sessoes/${session.id}/votacao`)}
                          >
                            <Gavel className="mr-2 h-4 w-4" />
                            Iniciar Votação
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          onClick={() => handleDelete(session.id)}
                          disabled={deletingId === session.id}
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
