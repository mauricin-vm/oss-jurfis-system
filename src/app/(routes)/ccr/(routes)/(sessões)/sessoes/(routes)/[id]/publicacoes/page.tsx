'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

interface SessionSnapshot {
  id: string;
  resourceId: string;
  processNumber: string;
  processName: string | null;
  order: number;
  status: string;
  distributedToId: string;
  distributedToName: string;
  firstDistributionId: string | null;
  firstDistributionName: string | null;
  reviewersIds: string[];
  reviewersNames: string[];
}

interface Publication {
  id: string;
  type: string;
  publicationNumber: string;
  publicationDate: Date;
  sessionSnapshots?: SessionSnapshot[];
  resource?: {
    id: string;
    resourceNumber: string;
    processNumber: string;
  } | null;
}

interface Session {
  id: string;
  sessionNumber: string;
}

export default function SessionPublicationsPage() {
  const params = useParams();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [publications, setPublications] = useState<Publication[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCards, setExpandedCards] = useState<string[]>([]);

  const toggleCard = (publicationId: string) => {
    setExpandedCards(prev =>
      prev.includes(publicationId)
        ? prev.filter(id => id !== publicationId)
        : [...prev, publicationId]
    );
  };

  useEffect(() => {
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar sessão
      const sessionResponse = await fetch(`/api/ccr/sessions/${params.id}`);
      if (sessionResponse.ok) {
        const data = await sessionResponse.json();
        setSessionData(data);
      }

      // Buscar publicações da sessão
      const publicationsResponse = await fetch(`/api/ccr/sessions/${params.id}/publications`);
      if (publicationsResponse.ok) {
        const data = await publicationsResponse.json();
        setPublications(data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${sessionData?.sessionNumber || 'Carregando...'}`, href: `/ccr/sessoes/${params.id}` },
    { label: 'Publicações' },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Publicações da Sessão" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Publicações</CardTitle>
            <CardDescription>
              Visualize todas as publicações relacionadas a pauta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="border border-gray-200 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Skeleton className="h-6 w-48" />
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-40" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Publicações da Sessão" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Publicações</CardTitle>
          <CardDescription>
            Visualize todas as publicações relacionadas a pauta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {publications.length === 0 ? (
            <div className="flex items-center justify-center h-40 border-2 border-dashed rounded-lg">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhuma publicação encontrada
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  As publicações da pauta aparecerão aqui
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {publications.map((publication) => {
                const publicationDate = new Date(publication.publicationDate);
                const adjustedDate = new Date(publicationDate.getTime() + publicationDate.getTimezoneOffset() * 60000);
                const isExpanded = expandedCards.includes(publication.id);
                const processCount = publication.sessionSnapshots?.length || 0;

                return (
                  <div
                    key={publication.id}
                    className="border border-gray-200 rounded-lg"
                  >
                    {/* Header do Card - Clicável */}
                    <div
                      className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => toggleCard(publication.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-base font-semibold">
                            Publicação n. {publication.publicationNumber}
                          </h3>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-700 hover:bg-blue-100">
                            {processCount} {processCount === 1 ? 'processo' : 'processos'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-4 w-4" />
                            <span>
                              {format(adjustedDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex-shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Conteúdo Expansível */}
                    {isExpanded && publication.sessionSnapshots && publication.sessionSnapshots.length > 0 && (
                      <div className="px-4 pb-4 border-t">
                        <div className="mt-4 space-y-3">
                          <h4 className="text-sm font-medium">Processos na Pauta</h4>
                          <div className="space-y-3">
                            {publication.sessionSnapshots.map((snapshot) => (
                              <div
                                key={snapshot.id}
                                className="bg-white rounded-lg border p-4"
                              >
                                <div className="flex items-start gap-3 flex-1 min-w-0">
                                  <div
                                    className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-medium text-sm flex-shrink-0"
                                  >
                                    {snapshot.order}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="mb-3">
                                      <Link
                                        href={`/ccr/recursos/${snapshot.resourceId}`}
                                        target="_blank"
                                        className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                                      >
                                        {snapshot.processNumber}
                                      </Link>
                                      {snapshot.processName && (
                                        <p className="text-sm text-muted-foreground mt-0.5">
                                          {snapshot.processName}
                                        </p>
                                      )}
                                    </div>

                                    <div className="space-y-0.5 text-sm">
                                      {snapshot.firstDistributionName && (
                                        <div>
                                          <span className="font-medium">Relator: </span>
                                          <span className="text-muted-foreground">
                                            {snapshot.firstDistributionName}
                                          </span>
                                        </div>
                                      )}
                                      {snapshot.reviewersNames.length > 0 && (
                                        <div>
                                          <span className="font-medium">
                                            {snapshot.reviewersNames.length === 1 ? 'Revisor: ' : 'Revisores: '}
                                          </span>
                                          <span className="text-muted-foreground">
                                            {snapshot.reviewersNames.join(', ')}
                                          </span>
                                        </div>
                                      )}
                                      <div>
                                        <span className="font-medium">Distribuição: </span>
                                        <span className="text-muted-foreground">
                                          {snapshot.distributedToName}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
