'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { CCRPageWrapper } from '@/app/(routes)/ccr/components/ccr-page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Ban,
  Clock,
  FileSearch,
  Gavel,
  ChevronDown,
  ChevronUp,
  Plus,
  CheckCircle2,
  AlertCircle,
  X,
  UserCheck,
  Vote,
} from 'lucide-react';
import { CompleteVotingModal } from './components/complete-voting-modal';

interface Member {
  id: string;
  name: string;
  role: string;
}

interface SessionMember {
  id: string;
  member: Member;
}

interface Distribution {
  id: string;
  firstDistribution: Member | null;
  reviewersIds: string[];
  distributedToId: string;
}

interface Decision {
  id: string;
  type: 'PRELIMINAR' | 'MERITO';
  code: string;
  name: string;
  description: string | null;
}

interface Subject {
  id: string;
  subject: {
    id: string;
    name: string;
  };
}

interface Authority {
  id: string;
  type: string;
  authorityRegistered: {
    id: string;
    name: string;
  };
}

interface SessionVote {
  id: string;
  member: Member;
  voteType: string;
  voteKnowledgeType: string;
  voteText: string;
  preliminarDecision?: { id: string; identifier: string; type: string } | null;
  meritoDecision?: { id: string; identifier: string; type: string } | null;
  oficioDecision?: { id: string; identifier: string; type: string } | null;
  createdAt: Date;
}

interface JudgmentData {
  sessionResource: {
    id: string;
    status: string;
    minutesText: string | null;
    diligenceDaysDeadline: number | null;
    viewRequestedBy: Member | null;
    resource: {
      id: string;
      processNumber: string;
      processName: string | null;
      resourceNumber: string;
      subjects: Subject[];
      authorities: Authority[];
    };
  };
  session: {
    id: string;
    sessionNumber: string;
    date: Date;
    members: SessionMember[];
  };
  distribution: Distribution | null;
  preliminaryDecisions: Decision[];
  meritDecisions: Decision[];
  oficioDecisions: Decision[];
}

const authorityTypeLabels: Record<string, string> = {
  AUTOR_PROCEDIMENTO_FISCAL: 'Autor do Procedimento Fiscal',
  JULGADOR_SINGULAR: 'Julgador Singular',
  COORDENADOR: 'Coordenador',
  OUTROS: 'Outros',
};

const statusLabels: Record<string, { label: string; color: string }> = {
  EM_PAUTA: { label: 'Em Pauta', color: 'bg-blue-100 text-blue-800' },
  SUSPENSO: { label: 'Suspenso', color: 'bg-gray-100 text-gray-800' },
  PEDIDO_VISTA: { label: 'Pedido de Vista', color: 'bg-yellow-100 text-yellow-800' },
  DILIGENCIA: { label: 'Diligência', color: 'bg-orange-100 text-orange-800' },
  JULGADO: { label: 'Julgado', color: 'bg-green-100 text-green-800' },
};

export default function JulgarProcessoPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<JudgmentData | null>(null);
  const [showCompleteVotingModal, setShowCompleteVotingModal] = useState(false);
  const [selectedVoting, setSelectedVoting] = useState<any>(null);
  const [sessionVotes, setSessionVotes] = useState<SessionVote[]>([]);
  const [sessionVotings, setSessionVotings] = useState<any[]>([]);
  const [groupedVotings, setGroupedVotings] = useState<any[]>([]);

  // Campos para atualizar status
  const [viewRequestedMemberId, setViewRequestedMemberId] = useState('');
  const [diligenceDays, setDiligenceDays] = useState('');
  const [minutesText, setMinutesText] = useState('');

  useEffect(() => {
    if (params.id && params.resourceId) {
      fetchData();
    }
  }, [params.id, params.resourceId]);

  useEffect(() => {
    if (data) {
      setMinutesText(data.sessionResource.minutesText || '');
      setViewRequestedMemberId(data.sessionResource.viewRequestedBy?.id || '');
      setDiligenceDays(data.sessionResource.diligenceDaysDeadline?.toString() || '');
    }
  }, [data]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/julgar`
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
        await fetchSessionVotes();
      } else {
        toast.error('Erro ao carregar dados do processo');
      }
    } catch (error) {
      console.error('Error fetching judgment data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const fetchSessionVotes = async () => {
    try {
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/session-votes`
      );

      if (response.ok) {
        const votes = await response.json();
        setSessionVotes(votes);

        // Buscar votações criadas
        await fetchSessionVotings();

        // Buscar preview de agrupamento
        await fetchGroupedVotings();
      }
    } catch (error) {
      console.error('Error fetching session votes:', error);
    }
  };

  const fetchSessionVotings = async () => {
    try {
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/votings`
      );

      if (response.ok) {
        const votings = await response.json();
        setSessionVotings(votings);
      }
    } catch (error) {
      console.error('Error fetching session votings:', error);
    }
  };

  const fetchGroupedVotings = async () => {
    try {
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/group-votes`
      );

      if (response.ok) {
        const result = await response.json();
        setGroupedVotings(result.groupedVotings || []);
      }
    } catch (error) {
      console.error('Error fetching grouped votings:', error);
    }
  };

  const handleGroupVotes = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/group-votes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }
      );

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Votações criadas com sucesso');
        await fetchSessionVotes();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao criar votações');
      }
    } catch (error) {
      console.error('Error grouping votes:', error);
      toast.error('Erro ao agrupar votos');
    } finally {
      setSaving(false);
    }
  };

  const handleCompleteVoting = async (completionData: {
    winningMemberId: string;
    qualityVoteUsed: boolean;
    qualityVoteMemberId: string | null;
    finalText: string;
    totalVotes: number;
    votesInFavor: number;
    votesAgainst: number;
    abstentions: number;
  }) => {
    if (!selectedVoting) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/votings/${selectedVoting.id}/complete`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(completionData),
        }
      );

      if (response.ok) {
        toast.success('Votação concluída com sucesso');
        await fetchSessionVotings();
        setShowCompleteVotingModal(false);
        setSelectedVoting(null);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao concluir votação');
      }
    } catch (error) {
      console.error('Error completing voting:', error);
      toast.error('Erro ao concluir votação');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/status`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: newStatus,
            viewRequestedMemberId: newStatus === 'PEDIDO_VISTA' ? viewRequestedMemberId : null,
            diligenceDaysDeadline: newStatus === 'DILIGENCIA' ? parseInt(diligenceDays) : null,
            minutesText: minutesText || null,
          }),
        }
      );

      if (response.ok) {
        toast.success('Status atualizado com sucesso');
        fetchData();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao atualizar status');
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Erro ao atualizar status');
    } finally {
      setSaving(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${data?.session.sessionNumber || 'Carregando...'}`, href: `/ccr/sessoes/${params.id}` },
    { label: `Julgar n. ${data?.sessionResource.resource.resourceNumber || 'Carregando...'}` },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Julgar" breadcrumbs={breadcrumbs}>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-96" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-24 w-full" />
            </CardContent>
          </Card>
        </div>
      </CCRPageWrapper>
    );
  }

  if (!data) {
    return (
      <CCRPageWrapper title="Julgar" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Dados não encontrados
            </p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  const currentStatus = statusLabels[data.sessionResource.status] || { label: data.sessionResource.status, color: 'bg-gray-100 text-gray-800' };

  return (
    <CCRPageWrapper title="Julgar Processo" breadcrumbs={breadcrumbs}>
      <div className="space-y-6">
        {/* Card de Informações do Processo */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>Detalhes do Processo</CardTitle>
                <CardDescription>
                  Informações do processo em julgamento.
                </CardDescription>
              </div>
              <Badge className={currentStatus.color}>{currentStatus.label}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-0">
                  <label className="block text-sm font-medium mb-1.5">Número do Processo</label>
                  <p className="text-sm">
                    <Link
                      href={`/ccr/recursos/${data.sessionResource.resource.id}`}
                      target="_blank"
                      className="font-semibold text-blue-600 hover:text-blue-800 hover:underline"
                    >{data.sessionResource.resource.processNumber}</Link>
                  </p>
                </div>
                <div className="space-y-0">
                  <label className="block text-sm font-medium mb-1.5">Número do Recurso</label>
                  <p className="text-sm">{data.sessionResource.resource.resourceNumber}</p>
                </div>
              </div>

              {data.sessionResource.resource.processName && (
                <div className="space-y-0">
                  <label className="block text-sm font-medium mb-1.5">Razão Social</label>
                  <p className="text-sm">{data.sessionResource.resource.processName}</p>
                </div>
              )}

              {/* Distribuição */}
              {data.distribution && (
                <div className="space-y-0">
                  <label className="block text-sm font-medium mb-1.5">Distribuição</label>
                  <div className="space-y-2">
                    {data.distribution.firstDistribution && (
                      <div className="flex items-center gap-3 text-sm bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <Gavel className="h-4 w-4 text-gray-500" />
                        <div className="flex-1">
                          <p className="font-medium">
                            {data.distribution.firstDistribution.name}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Relator • {data.distribution.firstDistribution.role || 'Conselheiro'}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Votações */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1.5">
                <CardTitle>Votações</CardTitle>
                <CardDescription>
                  Registre votos individuais e organize votações para este processo.
                </CardDescription>
              </div>
              <Button asChild className="cursor-pointer">
                <Link href={`/ccr/sessoes/${params.id}/processos/${params.resourceId}/julgar/novo-voto`}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Voto
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Votos Registrados */}
            {sessionVotes.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <UserCheck className="h-4 w-4" />
                  Votos Registrados ({sessionVotes.length})
                </h3>
                <div className="space-y-2">
                  {sessionVotes.map((vote) => (
                    <div key={vote.id} className="p-4 bg-gray-50 border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-sm">{vote.member.name}</span>
                            <Badge variant="outline" className="text-xs">
                              {vote.voteType}
                            </Badge>
                            <Badge className={vote.voteKnowledgeType === 'NAO_CONHECIMENTO' ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}>
                              {vote.voteKnowledgeType === 'NAO_CONHECIMENTO' ? 'Não Conhecimento' : 'Conhecimento'}
                            </Badge>
                          </div>
                          <div className="text-xs text-gray-600 space-y-0.5">
                            {vote.preliminarDecision && (
                              <p>• Preliminar: {vote.preliminarDecision.identifier}</p>
                            )}
                            {vote.meritoDecision && (
                              <p>• Mérito: {vote.meritoDecision.identifier}</p>
                            )}
                            {vote.oficioDecision && (
                              <p>• Ofício: {vote.oficioDecision.identifier}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-white rounded border border-gray-200">
                        <p className="text-xs text-gray-700 whitespace-pre-wrap">{vote.voteText}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Botão para agrupar votos em votações */}
                {sessionVotings.length === 0 && sessionVotes.some(v => !v.sessionVotingId) && (
                  <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-blue-900 mb-1">
                          Criar Votações
                        </h4>
                        <p className="text-xs text-blue-700">
                          Os votos serão agrupados automaticamente em votações por tipo de decisão.
                        </p>
                      </div>
                      <Button
                        onClick={handleGroupVotes}
                        disabled={saving}
                        size="sm"
                        className="cursor-pointer ml-4"
                      >
                        Agrupar Votos
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Votações Criadas */}
            {sessionVotings.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Vote className="h-4 w-4" />
                  Votações ({sessionVotings.length})
                </h3>
                <div className="space-y-3">
                  {sessionVotings.map((voting) => (
                    <div key={voting.id} className="border rounded-lg overflow-hidden">
                      {/* Header da Votação */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-4 border-b">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="text-sm font-semibold text-blue-900 mb-1">
                              {voting.label}
                            </h4>
                            <div className="flex items-center gap-2 text-xs text-blue-700">
                              <Badge variant={voting.status === 'CONCLUIDA' ? 'default' : 'secondary'}>
                                {voting.status === 'CONCLUIDA' ? 'Concluída' : 'Pendente'}
                              </Badge>
                              <span>• {voting.votes.length} voto(s)</span>
                              {voting.status === 'CONCLUIDA' && voting.totalVotes > 0 && (
                                <>
                                  <span>• Total: {voting.totalVotes}</span>
                                  <span>• Favor: {voting.votesInFavor}</span>
                                  <span>• Contra: {voting.votesAgainst}</span>
                                  {voting.abstentions > 0 && <span>• Abstenções: {voting.abstentions}</span>}
                                </>
                              )}
                            </div>
                          </div>
                          {voting.status === 'PENDENTE' && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="cursor-pointer"
                              onClick={() => {
                                setSelectedVoting(voting);
                                setShowCompleteVotingModal(true);
                              }}
                            >
                              Concluir Votação
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Votos da Votação */}
                      <div className="p-4 bg-gray-50">
                        <div className="space-y-2">
                          {voting.votes.map((vote: any) => (
                            <div key={vote.id} className="p-3 bg-white border rounded-lg">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="text-sm font-medium">{vote.member.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                      {vote.voteType}
                                    </Badge>
                                  </div>
                                  <div className="text-xs text-gray-600 space-y-0.5">
                                    {vote.preliminarDecision && (
                                      <p>• Preliminar: {vote.preliminarDecision.identifier}</p>
                                    )}
                                    {vote.meritoDecision && (
                                      <p>• Mérito: {vote.meritoDecision.identifier}</p>
                                    )}
                                    {vote.oficioDecision && (
                                      <p>• Ofício: {vote.oficioDecision.identifier}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Resultado (se concluída) */}
                      {voting.status === 'CONCLUIDA' && voting.winningMember && (
                        <div className="p-4 bg-green-50 border-t border-green-200">
                          <div className="flex items-start gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-green-900">
                                Decisão Vencedora: {voting.winningMember.name}
                              </p>
                              {voting.qualityVoteUsed && voting.qualityVoteMember && (
                                <p className="text-xs text-green-700 mt-1">
                                  Voto de qualidade por {voting.qualityVoteMember.name}
                                </p>
                              )}
                              {voting.finalText && (
                                <div className="mt-2 p-2 bg-white rounded border border-green-200">
                                  <p className="text-xs text-gray-700 whitespace-pre-wrap">
                                    {voting.finalText}
                                  </p>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Mensagem quando não há votos */}
            {sessionVotes.length === 0 && sessionVotings.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <AlertCircle className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-sm">Nenhum voto registrado ainda.</p>
                <p className="text-xs mt-1">Clique em "Novo Voto" para começar.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card de Status e Ações */}
        <Card>
          <CardHeader>
            <CardTitle>Status e Ações do Processo</CardTitle>
            <CardDescription>
              Atualize o status do processo ou registre informações adicionais.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Texto da Ata</label>
              <Textarea
                value={minutesText}
                onChange={(e) => setMinutesText(e.target.value)}
                placeholder="Digite o texto da ata para este processo..."
                rows={4}
                className="resize-none"
              />
            </div>

            {data.sessionResource.status === 'PEDIDO_VISTA' && (
              <div>
                <label className="block text-sm font-medium mb-2">Membro que Solicitou Vista</label>
                <select
                  value={viewRequestedMemberId}
                  onChange={(e) => setViewRequestedMemberId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-gray-400"
                >
                  <option value="">Selecione...</option>
                  {data.session.members.map((m) => (
                    <option key={m.member.id} value={m.member.id}>
                      {m.member.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {data.sessionResource.status === 'DILIGENCIA' && (
              <div>
                <label className="block text-sm font-medium mb-2">Prazo (em dias)</label>
                <Input
                  type="number"
                  value={diligenceDays}
                  onChange={(e) => setDiligenceDays(e.target.value)}
                  placeholder="Ex: 30"
                />
              </div>
            )}

            <div className="flex flex-wrap gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('SUSPENSO')}
                disabled={saving}
              >
                <Ban className="h-4 w-4 mr-2" />
                Marcar como Suspenso
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('PEDIDO_VISTA')}
                disabled={saving}
              >
                <FileSearch className="h-4 w-4 mr-2" />
                Registrar Pedido de Vista
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('DILIGENCIA')}
                disabled={saving}
              >
                <Clock className="h-4 w-4 mr-2" />
                Registrar Diligência
              </Button>
              <Button
                variant="outline"
                onClick={() => handleUpdateStatus('EM_PAUTA')}
                disabled={saving}
              >
                Retornar para Em Pauta
              </Button>
              <Button
                onClick={() => handleUpdateStatus('JULGADO')}
                disabled={saving}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Finalizar Julgamento
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Botões de Navegação */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/ccr/sessoes/${params.id}`)}
            disabled={saving}
          >
            Voltar para Sessão
          </Button>
        </div>
      </div>

      {/* Modals */}
      {data && (
        <>
          <CompleteVotingModal
            isOpen={showCompleteVotingModal}
            onClose={() => {
              setShowCompleteVotingModal(false);
              setSelectedVoting(null);
            }}
            onConfirm={handleCompleteVoting}
            voting={selectedVoting}
            members={data.session.members.map(m => m.member)}
          />
        </>
      )}
    </CCRPageWrapper>
  );
}
