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
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Part {
  id: string;
  name: string;
  role: string;
  cpfCnpj: string | null;
  isActive: boolean;
  _count?: {
    contacts: number;
    protocolParts: number;
  };
}

interface PartTableProps {
  data: Part[];
  loading: boolean;
  onRefresh: () => void;
}

const roleLabels: Record<string, string> = {
  SUJEITO_PASSIVO: 'Sujeito Passivo',
  CONTRIBUINTE: 'Contribuinte',
  RESPONSAVEL: 'Responsável',
  PROCURADOR: 'Procurador',
  ADVOGADO: 'Advogado',
  OUTROS: 'Outros',
};

export function PartTable({ data, loading, onRefresh }: PartTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta parte?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ccr/parts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Parte removida com sucesso');
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Erro ao remover parte');
      }
    } catch (error) {
      console.error('Error deleting part:', error);
      toast.error('Erro ao remover parte');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Partes</CardTitle>
          <CardDescription>Carregando partes...</CardDescription>
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
          <CardTitle>Partes</CardTitle>
          <CardDescription>Pessoas e empresas envolvidas nos processos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhuma parte cadastrada ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Partes</CardTitle>
        <CardDescription>
          Total de {data.length} parte{data.length !== 1 ? 's' : ''} cadastrada{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>CPF/CNPJ</TableHead>
                <TableHead>Contatos</TableHead>
                <TableHead>Protocolos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((part) => (
                <TableRow key={part.id}>
                  <TableCell className="font-medium">{part.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {roleLabels[part.role] || part.role}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {part.cpfCnpj ? (
                      <span className="text-sm text-muted-foreground">{part.cpfCnpj}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {part._count?.contacts ? (
                      <span className="text-sm">{part._count.contacts}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    {part._count?.protocolParts ? (
                      <span className="text-sm">{part._count.protocolParts}</span>
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={part.isActive ? 'default' : 'secondary'}>
                      {part.isActive ? 'Ativo' : 'Inativo'}
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
                          onClick={() => router.push(`/ccr/partes/${part.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(part.id)}
                          disabled={deletingId === part.id}
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
