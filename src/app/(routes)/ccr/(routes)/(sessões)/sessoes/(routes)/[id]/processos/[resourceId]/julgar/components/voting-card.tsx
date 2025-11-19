'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Users, CheckCircle2, Clock, Eye, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface VotingCardProps {
  voting: {
    id: string;
    votingType: string;
    label: string;
    status: string;
    sessionResource: {
      resource: {
        processNumber: string;
        processName: string | null;
        resourceNumber: string;
      };
    };
    votes: Array<{
      id: string;
      member: {
        id: string;
        name: string;
        role: string;
      };
      voteType: string;
      voteKnowledgeType: string;
      participationStatus: string;
      votePosition: string | null;
      preliminarDecision?: {
        id: string;
        identifier: string;
      } | null;
      meritoDecision?: {
        id: string;
        identifier: string;
      } | null;
      oficioDecision?: {
        id: string;
        identifier: string;
      } | null;
    }>;
    preliminarDecision?: {
      id: string;
      identifier: string;
    } | null;
  };
  sessionId: string;
  resourceId: string;
  index: number;
  totalMembers: number;
}

export function VotingCard({ voting, sessionId, resourceId, index, totalMembers }: VotingCardProps) {
  const router = useRouter();

  // Separar votos por tipo
  const relatorVotes = voting.votes.filter(v => v.voteType === 'RELATOR');
  const revisorVotes = voting.votes.filter(v => v.voteType === 'REVISOR');

  // Calcular estatísticas
  const votosPresentes = voting.votes.filter(v => v.participationStatus === 'PRESENTE').length;
  const votosPendentes = totalMembers - voting.votes.length;
  const abstencoes = voting.votes.filter(v => v.votePosition === 'ABSTENCAO').length;
  const impedimentos = voting.votes.filter(v => v.participationStatus === 'IMPEDIDO').length;
  const ausencias = voting.votes.filter(v => v.participationStatus === 'AUSENTE').length;

  return (
    <Card className="p-6 gap-0 hover:shadow-md transition-shadow">
      {/* Header com número em círculo e tipo de votação */}
      <div className="flex items-start justify-between mb-1">
        <div className="flex items-center gap-3 flex-1">
          {/* Número em círculo */}
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center font-medium text-sm">
            {index}
          </div>
          {/* Tipo de votação */}
          <div className="flex-1">
            <h3 className="font-semibold">
              {voting.label}
            </h3>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="cursor-pointer h-9"
            onClick={() => router.push(`/ccr/sessoes/${sessionId}/processos/${resourceId}/julgar/votacoes/${voting.id}`)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Detalhes
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="cursor-pointer h-9 w-9 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Votos */}
      {voting.votes.length > 0 && (
        <div className="flex items-start gap-3">
          {/* Espaçamento para alinhar com o círculo */}
          <div className="w-8 flex-shrink-0"></div>

          <div className="flex-1 space-y-0.5">
            {voting.votes.map((vote) => {
              // Determinar finalidade e decisão
              let voteInfo = '';

              if (vote.voteKnowledgeType === 'NAO_CONHECIMENTO') {
                const hasPreliminar = vote.preliminarDecision;
                const hasOficio = vote.oficioDecision;

                if (hasPreliminar && hasOficio) {
                  // Acatar com preliminar e ofício
                  voteInfo = `Acatar - ${vote.preliminarDecision.identifier} - ${vote.oficioDecision.identifier}`;
                } else if (hasPreliminar && !hasOficio) {
                  // Afastar
                  voteInfo = `Afastar - ${vote.preliminarDecision.identifier}`;
                } else if (!hasPreliminar && hasOficio) {
                  // Apenas ofício
                  voteInfo = `Acatar - ${vote.oficioDecision.identifier}`;
                } else {
                  // Afastar sem preliminar específica
                  voteInfo = 'Afastar';
                }
              } else {
                // Mérito
                voteInfo = vote.meritoDecision?.identifier || 'voto de mérito';
              }

              const voteTypeLabel = vote.voteType === 'RELATOR' ? 'Relator' : 'Revisor';

              return (
                <div key={vote.id} className="text-sm">
                  <span className="font-medium">{voteTypeLabel}: </span>
                  <span className="text-muted-foreground">{vote.member.name} ({voteInfo})</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6 pt-6 border-t">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs">
            <span className="font-medium">{votosPresentes}</span>{' '}
            <span className="text-muted-foreground">Registrados</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs">
            <span className="font-medium">{votosPendentes}</span>{' '}
            <span className="text-muted-foreground">Pendentes</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Users className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
          <p className="text-xs">
            <span className="font-medium">{abstencoes + impedimentos + ausencias}</span>{' '}
            <span className="text-muted-foreground">Abs./Aus./Imp.</span>
          </p>
        </div>
      </div>
    </Card>
  );
}
