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
import { MoreHorizontal, Pencil, Trash2, Star } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface Contact {
  id: string;
  type: string;
  value: string;
  isPrimary: boolean;
  isActive: boolean;
  part: {
    id: string;
    name: string;
    role: string;
  };
}

interface ContactTableProps {
  data: Contact[];
  loading: boolean;
  onRefresh: () => void;
}

const contactTypeLabels: Record<string, string> = {
  EMAIL: 'E-mail',
  TELEFONE: 'Telefone',
  CELULAR: 'Celular',
  WHATSAPP: 'WhatsApp',
  ENDERECO: 'Endereço',
};

export function ContactTable({ data, loading, onRefresh }: ContactTableProps) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este contato?')) {
      return;
    }

    try {
      setDeletingId(id);
      const response = await fetch(`/api/ccr/contacts/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(data.message || 'Contato removido com sucesso');
        onRefresh();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Erro ao remover contato');
      }
    } catch (error) {
      console.error('Error deleting contact:', error);
      toast.error('Erro ao remover contato');
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Contatos</CardTitle>
          <CardDescription>Carregando contatos...</CardDescription>
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
          <CardTitle>Contatos</CardTitle>
          <CardDescription>Informações de contato das partes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">Nenhum contato cadastrado ainda.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Contatos</CardTitle>
        <CardDescription>
          Total de {data.length} contato{data.length !== 1 ? 's' : ''} cadastrado{data.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Parte</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((contact) => (
                <TableRow key={contact.id}>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-medium">{contact.part.name}</span>
                      <span className="text-sm text-muted-foreground">
                        {contact.part.role}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {contactTypeLabels[contact.type] || contact.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{contact.value}</span>
                  </TableCell>
                  <TableCell>
                    {contact.isPrimary && (
                      <Badge variant="default" className="gap-1">
                        <Star className="h-3 w-3" />
                        Primário
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={contact.isActive ? 'default' : 'secondary'}>
                      {contact.isActive ? 'Ativo' : 'Inativo'}
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
                          onClick={() => router.push(`/ccr/contatos/${contact.id}`)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(contact.id)}
                          disabled={deletingId === contact.id}
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
