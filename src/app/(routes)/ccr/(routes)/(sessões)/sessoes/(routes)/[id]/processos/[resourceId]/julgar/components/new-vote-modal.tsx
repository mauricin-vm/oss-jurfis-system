'use client'

import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Member {
  id: string;
  name: string;
  role: string;
}

interface VoteDecision {
  id: string;
  type: 'PRELIMINAR' | 'MERITO' | 'OFICIO';
  identifier: string;
  acceptText?: string | null;
  rejectText?: string | null;
  text?: string | null;
}

interface NewVoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  members: Member[];
  distributedToId?: string;
  preliminaryDecisions: VoteDecision[];
  meritDecisions: VoteDecision[];
  oficioDecisions: VoteDecision[];
}

export function NewVoteModal({
  isOpen,
  onClose,
  onConfirm,
  members,
  distributedToId,
  preliminaryDecisions,
  meritDecisions,
  oficioDecisions,
}: NewVoteModalProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [memberId, setMemberId] = useState(distributedToId || '');
  const [voteType, setVoteType] = useState<'RELATOR' | 'REVISOR' | 'PRESIDENTE' | 'VOTANTE'>('RELATOR');
  const [voteKnowledgeType, setVoteKnowledgeType] = useState<'NAO_CONHECIMENTO' | 'CONHECIMENTO'>('NAO_CONHECIMENTO');

  // Decisões selecionadas
  const [preliminarDecisionId, setPreliminarDecisionId] = useState<string>('none');
  const [meritoDecisionId, setMeritoDecisionId] = useState<string>('none');
  const [oficioDecisionId, setOficioDecisionId] = useState<string>('none');

  // Texto consolidado
  const [voteText, setVoteText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      setIsSubmitting(false);
      setMemberId(distributedToId || '');
      setVoteType('RELATOR');
      setVoteKnowledgeType('NAO_CONHECIMENTO');
      setPreliminarDecisionId('none');
      setMeritoDecisionId('none');
      setOficioDecisionId('none');
      setVoteText('');

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen, distributedToId]);

  // Atualizar texto quando decisões mudarem
  useEffect(() => {
    buildVoteText();
  }, [preliminarDecisionId, meritoDecisionId, oficioDecisionId, voteKnowledgeType]);

  const buildVoteText = () => {
    let text = '';

    if (voteKnowledgeType === 'NAO_CONHECIMENTO') {
      // Preliminar (opcional)
      if (preliminarDecisionId && preliminarDecisionId !== 'none') {
        const decision = preliminaryDecisions.find(d => d.id === preliminarDecisionId);
        if (decision?.rejectText) {
          text += decision.rejectText + '\n\n';
        }
      }
    } else {
      // Mérito (obrigatório)
      if (meritoDecisionId && meritoDecisionId !== 'none') {
        const decision = meritDecisions.find(d => d.id === meritoDecisionId);
        if (decision?.text) {
          text += decision.text + '\n\n';
        }
      }
    }

    // Ofício (opcional)
    if (oficioDecisionId && oficioDecisionId !== 'none') {
      const decision = oficioDecisions.find(d => d.id === oficioDecisionId);
      if (decision?.text) {
        text += decision.text;
      }
    }

    setVoteText(text.trim());
  };

  const handleClose = () => {
    if (isSubmitting) return;
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleConfirm = async () => {
    if (!memberId) {
      toast.error('Selecione o membro');
      return;
    }

    if (voteKnowledgeType === 'CONHECIMENTO' && (!meritoDecisionId || meritoDecisionId === 'none')) {
      toast.error('Decisão de mérito é obrigatória para voto de conhecimento');
      return;
    }

    if (!voteText.trim()) {
      toast.error('O texto do voto não pode estar vazio');
      return;
    }

    setIsSubmitting(true);

    try {
      await onConfirm({
        memberId,
        voteType,
        voteKnowledgeType,
        preliminarDecisionId: preliminarDecisionId !== 'none' ? preliminarDecisionId : null,
        meritoDecisionId: meritoDecisionId !== 'none' ? meritoDecisionId : null,
        oficioDecisionId: oficioDecisionId !== 'none' ? oficioDecisionId : null,
        voteText: voteText.trim(),
      });
      handleClose();
    } catch (error) {
      setIsSubmitting(false);
      // Erro será tratado pelo componente pai
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-16 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Novo Voto</h2>
              <p className="text-sm text-gray-600 mt-1">Registre o voto individual do membro</p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Membro */}
            <div>
              <label htmlFor="member" className="block text-sm font-medium text-gray-700 mb-1.5">
                Membro <span className="text-red-500">*</span>
              </label>
              <select
                id="member"
                value={memberId}
                onChange={(e) => setMemberId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
              >
                <option value="">Selecione o membro...</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name} - {member.role}
                  </option>
                ))}
              </select>
            </div>

            {/* Tipo de Voto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de Voto <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { value: 'RELATOR', label: 'Relator' },
                  { value: 'REVISOR', label: 'Revisor' },
                  { value: 'PRESIDENTE', label: 'Presidente' },
                  { value: 'VOTANTE', label: 'Votante' },
                ].map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => !isSubmitting && setVoteType(type.value as any)}
                    disabled={isSubmitting}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border-2 transition-all cursor-pointer ${
                      voteType === type.value
                        ? 'border-gray-900 bg-gray-900 text-white'
                        : 'border-gray-200 text-gray-700 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    {type.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tipo de Conhecimento */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tipo de Conhecimento <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => !isSubmitting && setVoteKnowledgeType('NAO_CONHECIMENTO')}
                  disabled={isSubmitting}
                  className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                    voteKnowledgeType === 'NAO_CONHECIMENTO'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <p className="font-semibold text-gray-900">Não Conhecimento</p>
                  <p className="text-xs text-gray-600 mt-1">Questões preliminares e de ofício</p>
                </button>
                <button
                  type="button"
                  onClick={() => !isSubmitting && setVoteKnowledgeType('CONHECIMENTO')}
                  disabled={isSubmitting}
                  className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                    voteKnowledgeType === 'CONHECIMENTO'
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } disabled:opacity-50`}
                >
                  <p className="font-semibold text-gray-900">Conhecimento</p>
                  <p className="text-xs text-gray-600 mt-1">Análise de mérito do recurso</p>
                </button>
              </div>
            </div>

            {/* Decisão Preliminar (apenas para Não Conhecimento) */}
            {voteKnowledgeType === 'NAO_CONHECIMENTO' && (
              <div>
                <label htmlFor="preliminar" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Decisão Preliminar <span className="text-gray-500 text-xs">(opcional)</span>
                </label>
                <select
                  id="preliminar"
                  value={preliminarDecisionId}
                  onChange={(e) => setPreliminarDecisionId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
                >
                  <option value="none">Nenhuma</option>
                  {preliminaryDecisions.map((decision) => (
                    <option key={decision.id} value={decision.id}>
                      {decision.identifier}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Decisão de Mérito (apenas para Conhecimento) */}
            {voteKnowledgeType === 'CONHECIMENTO' && (
              <div>
                <label htmlFor="merito" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Decisão de Mérito <span className="text-red-500">*</span>
                </label>
                <select
                  id="merito"
                  value={meritoDecisionId}
                  onChange={(e) => setMeritoDecisionId(e.target.value)}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
                >
                  <option value="none">Selecione uma decisão de mérito...</option>
                  {meritDecisions.map((decision) => (
                    <option key={decision.id} value={decision.id}>
                      {decision.identifier}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Decisão de Ofício */}
            <div>
              <label htmlFor="oficio" className="block text-sm font-medium text-gray-700 mb-1.5">
                Decisão de Ofício <span className="text-gray-500 text-xs">(opcional)</span>
              </label>
              <select
                id="oficio"
                value={oficioDecisionId}
                onChange={(e) => setOficioDecisionId(e.target.value)}
                disabled={isSubmitting}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors disabled:opacity-50 disabled:bg-gray-50 cursor-pointer"
              >
                <option value="none">Nenhuma</option>
                {oficioDecisions.map((decision) => (
                  <option key={decision.id} value={decision.id}>
                    {decision.identifier}
                  </option>
                ))}
              </select>
            </div>

            {/* Texto do Voto */}
            <div>
              <label htmlFor="voteText" className="block text-sm font-medium text-gray-700 mb-1.5">
                Texto do Voto <span className="text-red-500">*</span>
              </label>
              <textarea
                id="voteText"
                value={voteText}
                onChange={(e) => setVoteText(e.target.value)}
                disabled={isSubmitting}
                placeholder="O texto será gerado automaticamente com base nas decisões selecionadas. Você pode editá-lo conforme necessário."
                rows={8}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors resize-none disabled:opacity-50 disabled:bg-gray-50"
              />
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Salvando...' : 'Registrar Voto'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
