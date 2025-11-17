'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Clock,
  Users,
  FileText,
  Edit,
  Plus,
  X,
  Gavel,
  CheckCircle2,
  PlayCircle,
  Newspaper,
  Blinds,
  ClipboardList,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { TooltipWrapper } from '@/components/ui/tooltip-wrapper';

interface MemberVote {
  id: string;
  voteType: string;
  participationStatus: string;
  votePosition: string | null;
  isQualityVote: boolean;
  justification: string | null;
  observations: string | null;
  member: {
    id: string;
    name: string;
    role: string;
  };
  voteDecision: {
    id: string;
    type: string;
    code: string;
    name: string;
  } | null;
  followsMember: {
    id: string;
    name: string;
  } | null;
}

interface VotingResult {
  id: string;
  type: string;
  totalVotes: number;
  votesInFavor: number;
  votesAgainst: number;
  abstentions: number;
  qualityVoteUsed: boolean;
  justification: string | null;
  decision: {
    id: string;
    type: string;
    code: string;
    name: string;
  };
  winningMember: {
    id: string;
    name: string;
  };
  memberVotes: MemberVote[];
}

interface Judgment {
  id: string;
  observations: string | null;
  winningVotingResult: VotingResult;
}

interface SessionResource {
  id: string;
  status: string;
  order: number;
  observations: string | null;
  createdAt: Date;
  resource: {
    id: string;
    processNumber: string;
    processName: string | null;
    protocol: {
      presenter: string;
    };
  };
  specificPresident: {
    id: string;
    name: string;
    role: string;
  } | null;
  judgment: Judgment | null;
  sessionVotingResults: VotingResult[];
}

interface SessionMember {
  id: string;
  member: {
    id: string;
    name: string;
  };
}

interface SessionDistribution {
  id: string;
  resourceId: string;
  type: string;
  distributionOrder: number;
  member: {
    id: string;
    name: string;
    role: string;
  };
}

interface Session {
  id: string;
  sessionNumber: string;
  sequenceNumber: number;
  year: number;
  ordinalNumber: number;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  type: string;
  status: string;
  observations: string | null;
  administrativeMatters: string | null;
  president: {
    id: string;
    name: string;
  } | null;
  resources: SessionResource[];
  members: SessionMember[];
  distributions: SessionDistribution[];
  minutes: {
    id: string;
    minutesNumber: string;
  } | null;
  publications: {
    id: string;
    publicationNumber: string;
    publicationDate: Date;
    type: string;
  }[];
  createdByUser: {
    id: string;
    name: string;
  };
}

const statusColors: Record<string, string> = {
  PUBLICACAO: 'bg-purple-100 text-purple-800 hover:bg-purple-100',
  PENDENTE: 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100',
  CONCLUIDA: 'bg-green-100 text-green-800 hover:bg-green-100',
  CANCELADA: 'bg-red-100 text-red-800 hover:bg-red-100',
};

const statusLabels: Record<string, string> = {
  PUBLICACAO: 'Aguardando Publicação',
  PENDENTE: 'Pauta Publicada',
  CONCLUIDA: 'Finalizada',
  CANCELADA: 'Cancelada',
};

const typeLabels: Record<string, string> = {
  ORDINARIA: 'Ordinária',
  EXTRAORDINARIA: 'Extraordinária',
  OUTRO: 'Outro',
};

const statusIcons: Record<string, React.ReactNode> = {
  PUBLICACAO: <Newspaper className="h-3.5 w-3.5" />,
  PENDENTE: <Clock className="h-3.5 w-3.5" />,
  CONCLUIDA: <CheckCircle2 className="h-3.5 w-3.5" />,
  CANCELADA: <X className="h-3.5 w-3.5" />,
};

const resourceStatusLabels: Record<string, string> = {
  EM_PAUTA: 'Em Pauta',
  SUSPENSO: 'Suspenso',
  DILIGENCIA: 'Diligência',
  PEDIDO_VISTA: 'Pedido Vista',
  JULGADO: 'Julgado',
};

const resourceStatusColors: Record<string, string> = {
  EM_PAUTA: 'bg-blue-50 border-blue-400',
  SUSPENSO: 'bg-amber-50 border-amber-400',
  DILIGENCIA: 'bg-violet-50 border-violet-400',
  PEDIDO_VISTA: 'bg-orange-50 border-orange-400',
  JULGADO: 'bg-emerald-50 border-emerald-400',
};

const resourceStatusBadgeColors: Record<string, string> = {
  EM_PAUTA: 'bg-blue-100 text-blue-700 hover:bg-blue-100',
  SUSPENSO: 'bg-amber-100 text-amber-700 hover:bg-amber-100',
  DILIGENCIA: 'bg-violet-100 text-violet-700 hover:bg-violet-100',
  PEDIDO_VISTA: 'bg-orange-100 text-orange-700 hover:bg-orange-100',
  JULGADO: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100',
};

const distributionTypeLabels: Record<string, string> = {
  RELATOR: 'Relator',
  REVISOR: 'Revisor',
};

const voteTypeLabels: Record<string, string> = {
  RELATOR: 'Relator',
  REVISOR: 'Revisor',
  PRESIDENTE: 'Presidente',
  VOTANTE: 'Votante',
};

const votePositionLabels: Record<string, string> = {
  ACOMPANHA_RELATOR: 'Acomp. relator',
  ACOMPANHA_REVISOR: 'Acomp. revisor',
  VOTO_PROPRIO: 'Voto próprio',
  ABSTENCAO: 'Abstenção',
};

// Cores para decisões (usadas nos badges de resultado)
const getDecisionColor = (decisionName: string): string => {
  const name = decisionName.toUpperCase();
  if (name.includes('DEFERIDO') || name.includes('PROCEDENTE')) {
    return 'bg-green-100 text-green-800 hover:bg-green-100';
  }
  if (name.includes('INDEFERIDO') || name.includes('IMPROCEDENTE')) {
    return 'bg-red-100 text-red-800 hover:bg-red-100';
  }
  if (name.includes('PARCIAL')) {
    return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
  }
  return 'bg-gray-100 text-gray-800 hover:bg-gray-100';
};

export default function VisualizarSessaoPage() {
  const params = useParams();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishLoading, setPublishLoading] = useState(false);
  const [completeLoading, setCompleteLoading] = useState(false);
  const [publishData, setPublishData] = useState({
    publicationNumber: '',
    publicationDate: '',
    observations: ''
  });

  useEffect(() => {
    if (params.id) {
      fetchSession();
    }
  }, [params.id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      console.log('Fetching session with ID:', params.id);
      const response = await fetch(`/api/ccr/sessions/${params.id}`);
      console.log('Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('Session data:', data);
        setSession(data);
      } else {
        const errorText = await response.text();
        console.error('Error response:', errorText);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateDuration = (startTime: string | null, endTime: string | null) => {
    if (!startTime || !endTime) return '-';

    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    const durationInMinutes = endInMinutes - startInMinutes;

    const hours = Math.floor(durationInMinutes / 60);
    const minutes = durationInMinutes % 60;

    if (hours === 0) {
      return `${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
    }

    if (minutes === 0) {
      return `${hours} ${hours === 1 ? 'hora' : 'horas'}`;
    }

    return `${hours} ${hours === 1 ? 'hora' : 'horas'} e ${minutes} ${minutes === 1 ? 'minuto' : 'minutos'}`;
  };

  const handlePublishAgenda = async () => {
    if (!publishData.publicationNumber || !publishData.publicationDate) {
      alert('Número e data da publicação são obrigatórios');
      return;
    }

    try {
      setPublishLoading(true);
      const response = await fetch(`/api/ccr/sessions/${params.id}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(publishData)
      });

      if (response.ok) {
        setShowPublishModal(false);
        setPublishData({ publicationNumber: '', publicationDate: '', observations: '' });
        fetchSession(); // Recarregar dados da sessão
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao publicar pauta');
      }
    } catch (error) {
      console.error('Error publishing agenda:', error);
      alert('Erro ao publicar pauta');
    } finally {
      setPublishLoading(false);
    }
  };

  const handleCompleteSession = async () => {
    if (!confirm('Tem certeza que deseja concluir esta sessão? Todos os processos devem estar julgados.')) {
      return;
    }

    try {
      setCompleteLoading(true);
      const response = await fetch(`/api/ccr/sessions/${params.id}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (response.ok) {
        fetchSession(); // Recarregar dados da sessão
      } else {
        const error = await response.json();
        alert(error.error || 'Erro ao concluir sessão');
      }
    } catch (error) {
      console.error('Error completing session:', error);
      alert('Erro ao concluir sessão');
    } finally {
      setCompleteLoading(false);
    }
  };

  const canPublishAgenda = session?.status === 'PUBLICACAO';
  const canAddRemoveProcesses = session?.status === 'PUBLICACAO' || session?.status === 'PENDENTE';
  const canJudgeProcesses = session?.status === 'PENDENTE';
  const allProcessesJudged = session?.resources.every(r => r.status === 'JULGADO') && (session?.resources.length ?? 0) > 0;
  const canCompleteSession = session?.status === 'PENDENTE' && allProcessesJudged;
  const hasPublications = (session?.publications?.filter(p => p.type === 'SESSAO').length ?? 0) > 0;

  const formatDateTime = (date: Date | string, time: string | null) => {
    if (!time) return '-';
    const dateObj = new Date(date);
    return `${format(dateObj, 'dd/MM/yyyy', { locale: ptBR })}, ${time}`;
  };

  const formatFullDateTime = (
    date: Date | string,
    startTime: string | null,
    endTime: string | null
  ) => {
    // Ajustar data para evitar problema de timezone
    const dateObj = new Date(date);
    const adjustedDate = new Date(
      dateObj.getTime() + dateObj.getTimezoneOffset() * 60000
    );

    // Dia da semana e data completa
    const weekdayAndDate = format(
      adjustedDate,
      "EEEE, d 'de' MMMM 'de' yyyy",
      { locale: ptBR }
    );

    // Horário
    if (!startTime && !endTime) {
      return weekdayAndDate;
    }

    if (startTime && endTime) {
      return `${weekdayAndDate}, ${startTime}-${endTime}`;
    }

    if (startTime) {
      return `${weekdayAndDate}, ${startTime}`;
    }

    return weekdayAndDate;
  };

  // Calcular estatísticas de progresso
  const progressStats = {
    pendentes: session?.resources.filter((r) => r.status === 'EM_PAUTA').length || 0,
    suspensos: session?.resources.filter((r) => r.status === 'SUSPENSO').length || 0,
    diligencias: session?.resources.filter((r) => r.status === 'DILIGENCIA').length || 0,
    vistas: session?.resources.filter((r) => r.status === 'PEDIDO_VISTA').length || 0,
    julgados: session?.resources.filter((r) => r.status === 'JULGADO').length || 0,
  };

  const totalProcesses = session?.resources.length || 0;

  const loadingBreadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: 'Carregando...' },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Visualizar Sessão" breadcrumbs={loadingBreadcrumbs}>
        <div className="space-y-6">
          {/* Grid com Card de Informações e Card de Conselheiros */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Card de Informações da Sessão */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg border p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-64 mt-1.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                    <Skeleton className="h-9 w-9" />
                  </div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {Array.from({ length: 9 }).map((_, i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-1.5" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Card de Conselheiros Participantes */}
            <div>
              <div className="bg-white rounded-lg border p-6 h-full">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-32 mt-1.5" />
                  </div>
                  <Skeleton className="h-9 w-9" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
          </div>

          {/* Card de Processos para Julgamento */}
          <div className="bg-white rounded-lg border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-96 mt-1.5" />
              </div>
              <Skeleton className="h-10 w-40" />
            </div>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          </div>
        </div>
      </CCRPageWrapper>
    );
  }

  if (!session) {
    return (
      <CCRPageWrapper title="Visualizar Sessão" breadcrumbs={loadingBreadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Sessão não encontrada</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${session.sessionNumber}` },
  ];

  return (
    <CCRPageWrapper title={`Sessão ${session.sessionNumber}`} breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Card de Informações da Sessão e Conselheiros */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Card de Informações da Sessão */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Informações da Sessão</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">Detalhes e horários da sessão</p>
                </div>
                <div className="flex items-center gap-2">
                  <TooltipWrapper content="Gerenciar publicações">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/ccr/sessoes/${session.id}/publicacoes`)}
                      className="cursor-pointer"
                    >
                      <Newspaper className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Gerenciar distribuições">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/ccr/sessoes/${session.id}/distribuicoes`)}
                      className="cursor-pointer"
                    >
                      <Blinds className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Gerenciar assuntos administrativos">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/ccr/sessoes/${session.id}/assuntos-administrativos`)}
                      className="cursor-pointer"
                    >
                      <ClipboardList className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>
                  <TooltipWrapper content="Editar sessão">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/ccr/sessoes/${session.id}/editar`)}
                      className="cursor-pointer"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TooltipWrapper>

                  {/* Botão Publicar Pauta - aparece quando status = PUBLICACAO */}
                  {canPublishAgenda && (
                    <Button
                      size="sm"
                      onClick={() => setShowPublishModal(true)}
                      className="cursor-pointer bg-purple-600 hover:bg-purple-700"
                    >
                      <Newspaper className="h-4 w-4 mr-2" />
                      Publicar Pauta
                    </Button>
                  )}

                  {/* Botão Concluir Sessão - aparece quando todos processos julgados */}
                  {canCompleteSession && (
                    <Button
                      size="sm"
                      onClick={handleCompleteSession}
                      disabled={completeLoading}
                      className="cursor-pointer bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      {completeLoading ? 'Concluindo...' : 'Concluir Sessão'}
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Número da Pauta</label>
                  <p className="text-sm">{session.sessionNumber}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Tipo de Sessão</label>
                  <p className="text-sm">{typeLabels[session.type] || session.type}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Status</label>
                  <Badge
                    variant="secondary"
                    className={cn(
                      'inline-flex items-center gap-1.5',
                      statusColors[session.status] || 'bg-gray-100 text-gray-800 hover:bg-gray-100'
                    )}
                  >
                    {statusIcons[session.status]}
                    {statusLabels[session.status]}
                  </Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Número da Ata</label>
                  <p className="text-sm">{session.minutes?.minutesNumber || '-'}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Publicação</label>
                  <p className="text-sm">
                    {session.publications && session.publications.length > 0 ? (
                      (() => {
                        const pub = session.publications[0];
                        const pubDate = new Date(pub.publicationDate);
                        const adjustedDate = new Date(pubDate.getTime() + pubDate.getTimezoneOffset() * 60000);
                        return `${format(adjustedDate, 'dd/MM/yyyy', { locale: ptBR })}, ${pub.publicationNumber}`;
                      })()
                    ) : '-'}
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Presidente</label>
                  <p className="text-sm">{session.president?.name || '-'}</p>
                </div>
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium mb-1.5">Data/Horário</label>
                  <p className="text-sm">
                    {formatFullDateTime(session.date, session.startTime, session.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Card de Conselheiros Participantes */}
          <div>
            <div className="bg-white rounded-lg border p-6 h-full">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="font-semibold">Conselheiros Participantes</h3>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    {session.members.length} {session.members.length === 1 ? 'participante' : 'participantes'}
                  </p>
                </div>
                <TooltipWrapper content="Editar membros participantes">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.push(`/ccr/sessoes/${session.id}/membros`)}
                    className="cursor-pointer"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                </TooltipWrapper>
              </div>

              <div>
                <p className="text-sm">
                  {session.members
                    .sort((a, b) => a.member.name.localeCompare(b.member.name))
                    .map((member, index, array) => {
                      if (index === array.length - 1 && array.length > 1) {
                        return ` e ${member.member.name}`;
                      }
                      if (index === array.length - 1) {
                        return member.member.name;
                      }
                      return `${member.member.name}, `;
                    })
                    .join('')}
                </p>
              </div>

              {session.observations && (
                <div className="mt-6 pt-6 border-t">
                  <label className="block text-sm font-medium mb-1.5">Observações</label>
                  <p className="text-sm text-muted-foreground">{session.observations}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Card de Assuntos Administrativos */}
        {session.administrativeMatters && (
          <div className="bg-white rounded-lg border p-6">
            <div className="mb-4">
              <h3 className="font-semibold">Assuntos Administrativos</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Assuntos administrativos discutidos durante a sessão
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm whitespace-pre-wrap">{session.administrativeMatters}</p>
            </div>
          </div>
        )}

        {/* Card de Progresso do Julgamento */}
        {session.resources.length > 0 && (
          <div className="bg-white rounded-lg border p-6">
          <div className="mb-6">
            <h3 className="font-semibold">Progresso do Julgamento</h3>
            <p className="text-sm text-muted-foreground mt-1.5">
              {progressStats.julgados} de {totalProcesses} processos julgados (
              {totalProcesses > 0 ? Math.round((progressStats.julgados / totalProcesses) * 100) : 0}%)
            </p>
          </div>

          <div className="grid grid-cols-5 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-700">{progressStats.pendentes}</div>
              <p className="text-sm text-muted-foreground mt-1.5">Pendentes</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-amber-700">{progressStats.suspensos}</div>
              <p className="text-sm text-muted-foreground mt-1.5">Suspensos</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-violet-700">{progressStats.diligencias}</div>
              <p className="text-sm text-muted-foreground mt-1.5">Diligências</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-orange-700">{progressStats.vistas}</div>
              <p className="text-sm text-muted-foreground mt-1.5">Vistas</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-emerald-700">{progressStats.julgados}</div>
              <p className="text-sm text-muted-foreground mt-1.5">Julgados</p>
            </div>
          </div>
        </div>
        )}

        {/* Card de Processos para Julgamento */}
        <div className="bg-white rounded-lg border p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold">Processos para Julgamento</h3>
              <p className="text-sm text-muted-foreground mt-1.5">
                Lista de processos incluídos nesta sessão ordenados por ordem de julgamento
              </p>
            </div>
            {canAddRemoveProcesses && (
              <Button
                onClick={() => router.push(`/ccr/sessoes/${session.id}/adicionar-processo`)}
                className="cursor-pointer"
              >
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Processo
              </Button>
            )}
          </div>

          {session.resources.length === 0 ? (
            <div className="flex h-[200px] items-center justify-center rounded-lg border border-dashed">
              <div className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  Nenhum processo adicionado à pauta
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {session.resources
                .sort((a, b) => a.order - b.order)
                .map((resource) => {
                  // Buscar relator e revisor nas distribuições da sessão
                  const relator = session.distributions?.find(
                    d => d.resourceId === resource.resource.id && d.type === 'RELATOR'
                  );
                  const revisor = session.distributions?.find(
                    d => d.resourceId === resource.resource.id && d.type === 'REVISOR'
                  );

                  // Determinar cor do card baseada no resultado
                  const cardBorderColor = resource.judgment
                    ? getDecisionColor(resource.judgment.winningVotingResult.decision.name).split(' ')[0].replace('bg-', 'border-l-')
                    : 'border-l-gray-300';

                  return (
                    <div
                      key={resource.id}
                      className={cn(
                        'bg-white rounded-lg border-l-4 border p-6',
                        cardBorderColor
                      )}
                    >
                      {/* Cabeçalho do Card */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start gap-4 flex-1">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 text-green-800 font-semibold text-lg flex-shrink-0">
                            {resource.order}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <Link
                                href={`/ccr/recursos/${resource.resource.id}`}
                                target="_blank"
                                className="text-lg font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                {resource.resource.processNumber}
                              </Link>
                              {resource.resource.processName && (
                                <p className="text-sm text-muted-foreground mt-1">
                                  {resource.resource.processName}
                                </p>
                              )}
                            </div>

                            <div className="space-y-1 text-sm">
                              {relator && (
                                <div>
                                  <span className="font-medium">Relator: </span>
                                  <Link
                                    href={`/ccr/membros/${relator.member.id}`}
                                    target="_blank"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {relator.member.name}
                                  </Link>
                                </div>
                              )}
                              {revisor && (
                                <div>
                                  <span className="font-medium">Revisor: </span>
                                  <Link
                                    href={`/ccr/membros/${revisor.member.id}`}
                                    target="_blank"
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    {revisor.member.name}
                                  </Link>
                                </div>
                              )}
                              {resource.specificPresident && (
                                <div>
                                  <span className="font-medium">Distribuição: </span>
                                  <span>{resource.specificPresident.name}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-start gap-2 flex-shrink-0">
                          {/* Badge de resultado (se houver julgamento) */}
                          {resource.judgment && (
                            <Badge
                              variant="secondary"
                              className={cn(
                                'inline-flex items-center gap-1.5',
                                getDecisionColor(resource.judgment.winningVotingResult.decision.name)
                              )}
                            >
                              {resource.judgment.winningVotingResult.decision.name.toUpperCase()}
                            </Badge>
                          )}

                          {/* Botão Julgar - aparece quando sessão está PENDENTE e processo ainda não julgado */}
                          {canJudgeProcesses && resource.status !== 'JULGADO' && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="cursor-pointer"
                              onClick={() => router.push(`/ccr/sessoes/${session.id}/processos/${resource.id}/julgar`)}
                            >
                              <Gavel className="h-4 w-4 mr-2" />
                              Julgar
                            </Button>
                          )}

                          {/* Botão Remover - aparece quando pode adicionar/remover processos */}
                          {canAddRemoveProcesses && resource.status !== 'JULGADO' && (
                            <TooltipWrapper content="Remover processo da pauta">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={async () => {
                                  if (confirm('Tem certeza que deseja remover este processo da pauta?')) {
                                    try {
                                      const response = await fetch(`/api/ccr/session-resources/${resource.id}`, {
                                        method: 'DELETE',
                                      });
                                      if (response.ok) {
                                        fetchSession();
                                      } else {
                                        alert('Erro ao remover processo da pauta');
                                      }
                                    } catch (error) {
                                      console.error('Error removing resource:', error);
                                      alert('Erro ao remover processo da pauta');
                                    }
                                  }
                                }}
                                className="cursor-pointer"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TooltipWrapper>
                          )}
                        </div>
                      </div>

                      {/* Seção de Ata (só aparece se houver julgamento) */}
                      {resource.judgment && resource.judgment.observations && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-2">Ata:</h4>
                          <p className="text-sm">{resource.judgment.observations}</p>
                        </div>
                      )}

                      {/* Seção de Votos Registrados (só aparece se houver julgamento) */}
                      {resource.judgment && resource.judgment.winningVotingResult.memberVotes.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-4">Votos registrados:</h4>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Coluna: Relatores/Revisores */}
                            <div>
                              <h5 className="font-medium text-sm mb-3">Relatores/Revisores</h5>
                              <div className="space-y-2">
                                {resource.judgment.winningVotingResult.memberVotes
                                  .filter(vote => vote.voteType === 'RELATOR' || vote.voteType === 'REVISOR')
                                  .map(vote => (
                                    <div key={vote.id} className="flex items-center justify-between text-sm">
                                      <div>
                                        <span className="font-medium">{voteTypeLabels[vote.voteType]}</span>
                                        <span className="ml-1">{vote.member.name}</span>
                                      </div>
                                      {vote.voteDecision ? (
                                        <Badge
                                          variant="secondary"
                                          className={cn(
                                            'text-xs',
                                            getDecisionColor(vote.voteDecision.name)
                                          )}
                                        >
                                          {vote.voteDecision.name.toUpperCase()}
                                        </Badge>
                                      ) : vote.votePosition ? (
                                        <span className="text-blue-600 text-xs">
                                          {votePositionLabels[vote.votePosition]}
                                        </span>
                                      ) : null}
                                    </div>
                                  ))}
                              </div>
                            </div>

                            {/* Coluna: Conselheiros */}
                            <div>
                              <h5 className="font-medium text-sm mb-3">Conselheiros</h5>
                              <div className="text-sm">
                                {(() => {
                                  // Agrupar conselheiros por decisão
                                  const votantes = resource.judgment!.winningVotingResult.memberVotes
                                    .filter(vote => vote.voteType === 'VOTANTE' || vote.voteType === 'PRESIDENTE');

                                  // Agrupar por decisão
                                  const votesByDecision: Record<string, MemberVote[]> = {};
                                  votantes.forEach(vote => {
                                    const decisionName = vote.voteDecision?.name || 'Outros';
                                    if (!votesByDecision[decisionName]) {
                                      votesByDecision[decisionName] = [];
                                    }
                                    votesByDecision[decisionName].push(vote);
                                  });

                                  return Object.entries(votesByDecision).map(([decision, votes]) => (
                                    <div key={decision} className="mb-2">
                                      <span className={cn(
                                        'font-semibold',
                                        getDecisionColor(decision).includes('green') ? 'text-green-700' :
                                        getDecisionColor(decision).includes('red') ? 'text-red-700' :
                                        getDecisionColor(decision).includes('yellow') ? 'text-yellow-700' :
                                        'text-gray-700'
                                      )}>
                                        {decision.toUpperCase()}:
                                      </span>{' '}
                                      <span>
                                        {votes.map((v, idx) => (
                                          <span key={v.id}>
                                            {v.member.name}
                                            {idx < votes.length - 1 && ', '}
                                          </span>
                                        ))}
                                      </span>
                                    </div>
                                  ));
                                })()}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Rodapé com data de registro (só aparece se houver julgamento) */}
                      {resource.judgment && (
                        <div className="mt-6 pt-6 border-t text-sm text-muted-foreground">
                          Registrada em {format(new Date(resource.createdAt), "dd/MM/yyyy, HH:mm:ss", { locale: ptBR })}
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          )}
        </div>

        {/* Modal de Publicação da Pauta */}
        {showPublishModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Publicar Pauta</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Número da Publicação <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={publishData.publicationNumber}
                    onChange={(e) => setPublishData({ ...publishData, publicationNumber: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Ex: 001/2024"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Data da Publicação <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={publishData.publicationDate}
                    onChange={(e) => setPublishData({ ...publishData, publicationDate: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Observações
                  </label>
                  <textarea
                    value={publishData.observations}
                    onChange={(e) => setPublishData({ ...publishData, observations: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                    rows={3}
                    placeholder="Observações sobre a publicação (opcional)"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPublishModal(false);
                    setPublishData({ publicationNumber: '', publicationDate: '', observations: '' });
                  }}
                  disabled={publishLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handlePublishAgenda}
                  disabled={publishLoading}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  {publishLoading ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </CCRPageWrapper>
  );
}
