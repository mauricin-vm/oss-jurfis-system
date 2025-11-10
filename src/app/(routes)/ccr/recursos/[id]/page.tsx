'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ResourceForm } from '../components/resource-form';
import { Loader2, FileText, ArrowRightLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Resource {
  id: string;
  resourceNumber: number;
  fiscalYear: number;
  taxType: string | null;
  taxValue: number | null;
  penalty: number | null;
  interest: number | null;
  totalValue: number | null;
  status: string;
  description: string | null;
  isActive: boolean;
  protocol: {
    id: string;
    number: string;
    subject: string;
    originationDate: Date;
    receptionDate: Date;
    protocolParts: Array<{
      part: {
        id: string;
        name: string;
        role: string;
        cpfCnpj: string | null;
      };
    }>;
  };
  subjects: Array<{
    subjectId: string;
    subject: {
      id: string;
      name: string;
    };
  }>;
  tramitations: Array<{
    id: string;
    fromSector: {
      id: string;
      name: string;
    } | null;
    toSector: {
      id: string;
      name: string;
    };
    remarks: string | null;
    createdAt: Date;
    createdBy: {
      id: string;
      name: string;
    };
  }>;
  documents: Array<{
    id: string;
    title: string;
    type: string;
    fileName: string;
    uploadedAt: Date;
    uploadedBy: {
      id: string;
      name: string;
    };
  }>;
  _count: {
    tramitations: number;
    documents: number;
  };
}

export default function VisualizarRecursoPage() {
  const params = useParams();
  const router = useRouter();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchResource();
    }
  }, [params.id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/resources/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
    } finally {
      setLoading(false);
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
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Visualizar Recurso</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="flex-1 space-y-4 p-8 pt-6">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Visualizar Recurso</h2>
        </div>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Recurso não encontrado</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Recurso {resource.resourceNumber.toString().padStart(4, '0')}/{resource.fiscalYear}
          </h2>
          <p className="text-muted-foreground">
            Protocolo: {resource.protocol.number}
          </p>
        </div>
      </div>

      <Tabs defaultValue="detalhes" className="space-y-4">
        <TabsList>
          <TabsTrigger value="detalhes">Detalhes</TabsTrigger>
          <TabsTrigger value="protocolo">Protocolo Original</TabsTrigger>
          <TabsTrigger value="tramitacoes">
            Tramitações ({resource._count.tramitations})
          </TabsTrigger>
          <TabsTrigger value="documentos">
            Documentos ({resource._count.documents})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="detalhes">
          <Card>
            <CardHeader>
              <CardTitle>Editar Recurso</CardTitle>
              <CardDescription>
                Atualize as informações do recurso
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResourceForm initialData={resource} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="protocolo">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Protocolo {resource.protocol.number}</CardTitle>
                  <CardDescription>
                    Informações do protocolo que originou este recurso
                  </CardDescription>
                </div>
                <Badge>
                  <FileText className="mr-1 h-3 w-3" />
                  Protocolo Original
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Origem</p>
                  <p className="text-lg">
                    {format(new Date(resource.protocol.originationDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Data de Recepção</p>
                  <p className="text-lg">
                    {format(new Date(resource.protocol.receptionDate), 'dd/MM/yyyy', { locale: ptBR })}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground">Assunto</p>
                <p className="text-lg">{resource.protocol.subject}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Partes Envolvidas</p>
                <div className="space-y-2">
                  {resource.protocol.protocolParts.map((pp) => (
                    <div key={pp.part.id} className="flex items-center justify-between rounded-lg border p-3">
                      <div>
                        <p className="font-medium">{pp.part.name}</p>
                        {pp.part.cpfCnpj && (
                          <p className="text-sm text-muted-foreground">{pp.part.cpfCnpj}</p>
                        )}
                      </div>
                      <Badge variant="outline">{pp.part.role}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tramitacoes">
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <ArrowRightLeft className="h-5 w-5" />
                <CardTitle>Histórico de Tramitações</CardTitle>
              </div>
              <CardDescription>
                Movimentação do recurso entre setores
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resource.tramitations.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhuma tramitação registrada</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>De</TableHead>
                        <TableHead>Para</TableHead>
                        <TableHead>Observações</TableHead>
                        <TableHead>Responsável</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resource.tramitations.map((tram) => (
                        <TableRow key={tram.id}>
                          <TableCell>
                            {format(new Date(tram.createdAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {tram.fromSector ? tram.fromSector.name : '-'}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{tram.toSector.name}</Badge>
                          </TableCell>
                          <TableCell>
                            {tram.remarks || '-'}
                          </TableCell>
                          <TableCell>{tram.createdBy.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>Documentos Anexados</CardTitle>
              <CardDescription>
                Documentos vinculados a este recurso
              </CardDescription>
            </CardHeader>
            <CardContent>
              {resource.documents.length === 0 ? (
                <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
                  <p className="text-sm text-muted-foreground">Nenhum documento anexado</p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Data de Upload</TableHead>
                        <TableHead>Enviado por</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {resource.documents.map((doc) => (
                        <TableRow key={doc.id}>
                          <TableCell className="font-medium">{doc.title}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{doc.type}</Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">{doc.fileName}</TableCell>
                          <TableCell>
                            {format(new Date(doc.uploadedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </TableCell>
                          <TableCell>{doc.uploadedBy.name}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
