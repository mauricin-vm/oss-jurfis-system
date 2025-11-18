'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, AlertCircle, Scale } from 'lucide-react';

interface Vote {
  id: string;
  member: {
    id: string;
    name: string;
    role: string;
  };
  voteType: string;
  preliminarDecision?: {
    id: string;
    identifier: string;
  };
  meritoDecision?: {
    id: string;
    identifier: string;
  };
  oficioDecision?: {
    id: string;
    identifier: string;
  };
  voteText: string;
}

interface Voting {
  id: string;
  votingType: string;
  label: string;
  preliminarDecision?: {
    id: string;
    identifier: string;
  };
  votes: Vote[];
}

interface CompleteVotingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: {
    winningMemberId: string;
    qualityVoteUsed: boolean;
    qualityVoteMemberId: string | null;
    finalText: string;
    totalVotes: number;
    votesInFavor: number;
    votesAgainst: number;
    abstentions: number;
  }) => void;
  voting: Voting | null;
  members: { id: string; name: string; role: string }[];
}

export function CompleteVotingModal({
  isOpen,
  onClose,
  onConfirm,
  voting,
  members,
}: CompleteVotingModalProps) {
  const [winningMemberId, setWinningMemberId] = useState('');
  const [qualityVoteUsed, setQualityVoteUsed] = useState(false);
  const [qualityVoteMemberId, setQualityVoteMemberId] = useState('');
  const [finalText, setFinalText] = useState('');
  const [totalVotes, setTotalVotes] = useState(0);
  const [votesInFavor, setVotesInFavor] = useState(0);
  const [votesAgainst, setVotesAgainst] = useState(0);
  const [abstentions, setAbstentions] = useState(0);

  useEffect(() => {
    if (voting) {
      // Resetar valores ao abrir
      setWinningMemberId('');
      setQualityVoteUsed(false);
      setQualityVoteMemberId('');
      setFinalText('');
      setTotalVotes(voting.votes.length);
      setVotesInFavor(0);
      setVotesAgainst(0);
      setAbstentions(0);
    }
  }, [voting]);

  const handleConfirm = () => {
    if (!winningMemberId) {
      return;
    }

    onConfirm({
      winningMemberId,
      qualityVoteUsed,
      qualityVoteMemberId: qualityVoteUsed ? qualityVoteMemberId : null,
      finalText,
      totalVotes,
      votesInFavor,
      votesAgainst,
      abstentions,
    });

    handleClose();
  };

  const handleClose = () => {
    setWinningMemberId('');
    setQualityVoteUsed(false);
    setQualityVoteMemberId('');
    setFinalText('');
    setTotalVotes(0);
    setVotesInFavor(0);
    setVotesAgainst(0);
    setAbstentions(0);
    onClose();
  };

  if (!voting) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-w-3xl max-h-[90vh] overflow-y-auto"
        aria-describedby="complete-voting-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Concluir Votação
          </DialogTitle>
          <DialogDescription id="complete-voting-description">
            Defina o resultado da votação e os votos computados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações da Votação */}
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">{voting.label}</h3>
            <div className="flex items-center gap-2 text-xs text-blue-700">
              <Badge variant="secondary">{voting.votingType}</Badge>
              <span>• {voting.votes.length} voto(s) registrado(s)</span>
            </div>
          </div>

          {/* Votos Registrados */}
          <div>
            <Label className="text-sm font-semibold mb-2 block">Votos Registrados</Label>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {voting.votes.map((vote) => (
                <div key={vote.id} className="p-3 bg-gray-50 border rounded-lg">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium">{vote.member.name}</span>
                    <Badge variant="outline" className="text-xs">
                      {vote.voteType}
                    </Badge>
                  </div>
                  <div className="text-xs text-gray-600">
                    {vote.preliminarDecision && (
                      <p>• Preliminar: {vote.preliminarDecision.identifier}</p>
                    )}
                    {vote.meritoDecision && <p>• Mérito: {vote.meritoDecision.identifier}</p>}
                    {vote.oficioDecision && <p>• Ofício: {vote.oficioDecision.identifier}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Membro Vencedor */}
          <div>
            <Label htmlFor="winning-member" className="text-sm font-semibold mb-2 block">
              Decisão Vencedora *
            </Label>
            <RadioGroup value={winningMemberId} onValueChange={setWinningMemberId}>
              <div className="space-y-2">
                {voting.votes.map((vote) => (
                  <div
                    key={vote.id}
                    className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-gray-50"
                  >
                    <RadioGroupItem value={vote.member.id} id={`member-${vote.member.id}`} />
                    <Label
                      htmlFor={`member-${vote.member.id}`}
                      className="flex-1 cursor-pointer font-normal"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{vote.member.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {vote.voteType}
                        </Badge>
                      </div>
                      <div className="text-xs text-gray-600 mt-1">
                        {vote.meritoDecision?.identifier ||
                          vote.preliminarDecision?.identifier ||
                          'Sem decisão específica'}
                      </div>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          </div>

          {/* Contagem de Votos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="total-votes" className="text-sm font-semibold mb-2 block">
                Total de Votos
              </Label>
              <input
                type="number"
                id="total-votes"
                value={totalVotes}
                onChange={(e) => setTotalVotes(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="votes-favor" className="text-sm font-semibold mb-2 block">
                Votos a Favor
              </Label>
              <input
                type="number"
                id="votes-favor"
                value={votesInFavor}
                onChange={(e) => setVotesInFavor(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="votes-against" className="text-sm font-semibold mb-2 block">
                Votos Contra
              </Label>
              <input
                type="number"
                id="votes-against"
                value={votesAgainst}
                onChange={(e) => setVotesAgainst(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
            <div>
              <Label htmlFor="abstentions" className="text-sm font-semibold mb-2 block">
                Abstenções
              </Label>
              <input
                type="number"
                id="abstentions"
                value={abstentions}
                onChange={(e) => setAbstentions(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border rounded-md"
                min="0"
              />
            </div>
          </div>

          {/* Voto de Qualidade */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="checkbox"
                id="quality-vote"
                checked={qualityVoteUsed}
                onChange={(e) => setQualityVoteUsed(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="quality-vote" className="cursor-pointer">
                Voto de qualidade utilizado
              </Label>
            </div>

            {qualityVoteUsed && (
              <div className="mt-3">
                <Label htmlFor="quality-vote-member" className="text-sm mb-2 block">
                  Membro que exerceu o voto de qualidade
                </Label>
                <RadioGroup value={qualityVoteMemberId} onValueChange={setQualityVoteMemberId}>
                  <div className="space-y-2">
                    {members.map((member) => (
                      <div key={member.id} className="flex items-center space-x-2">
                        <RadioGroupItem value={member.id} id={`quality-${member.id}`} />
                        <Label htmlFor={`quality-${member.id}`} className="cursor-pointer">
                          {member.name} - {member.role}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            )}
          </div>

          {/* Texto Final */}
          <div>
            <Label htmlFor="final-text" className="text-sm font-semibold mb-2 block">
              Texto Final da Decisão (Opcional)
            </Label>
            <Textarea
              id="final-text"
              value={finalText}
              onChange={(e) => setFinalText(e.target.value)}
              placeholder="Digite o texto consolidado da decisão final..."
              rows={6}
            />
          </div>

          {/* Avisos */}
          {!winningMemberId && (
            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-800">
                Selecione a decisão vencedora para concluir a votação.
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!winningMemberId}
            className="cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4 mr-2" />
            Concluir Votação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
