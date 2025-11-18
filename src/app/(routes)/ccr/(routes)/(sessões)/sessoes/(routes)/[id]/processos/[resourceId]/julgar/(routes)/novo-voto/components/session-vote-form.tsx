'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string;
}

interface VoteDecision {
  id: string;
  identifier: string;
  type: string;
  rejectText?: string | null;
  text?: string | null;
}

interface SessionVoteFormProps {
  sessionId: string;
  resourceId: string;
  members: Member[];
  distributedToId?: string;
  relatorId?: string;
  reviewersIds?: string[];
  preliminaryDecisions: VoteDecision[];
  meritDecisions: VoteDecision[];
  oficioDecisions: VoteDecision[];
}

type SessionVoteFormValues = {
  memberId: string;
  voteKnowledgeType: 'NAO_CONHECIMENTO' | 'CONHECIMENTO';
  preliminarDecisionId: string;
  meritoDecisionId: string;
  oficioDecisionId: string;
  voteText: string;
};

export function SessionVoteForm({
  sessionId,
  resourceId,
  members,
  distributedToId,
  relatorId,
  reviewersIds = [],
  preliminaryDecisions,
  meritDecisions,
  oficioDecisions,
}: SessionVoteFormProps) {
  const router = useRouter();
  const params = useParams();
  const [loading, setLoading] = useState(false);

  const form = useForm<SessionVoteFormValues>({
    defaultValues: {
      memberId: distributedToId || '',
      voteKnowledgeType: 'NAO_CONHECIMENTO',
      preliminarDecisionId: 'none',
      meritoDecisionId: 'none',
      oficioDecisionId: 'none',
      voteText: '',
    },
  });

  const voteKnowledgeType = form.watch('voteKnowledgeType');
  const preliminarDecisionId = form.watch('preliminarDecisionId');
  const meritoDecisionId = form.watch('meritoDecisionId');
  const oficioDecisionId = form.watch('oficioDecisionId');

  // Determinar tipo de voto automaticamente baseado no membro selecionado
  const getVoteType = (selectedMemberId: string): 'RELATOR' | 'REVISOR' => {
    if (selectedMemberId === relatorId) {
      return 'RELATOR';
    }
    return 'REVISOR';
  };

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

    form.setValue('voteText', text.trim());
  };

  const onSubmit = async (data: SessionVoteFormValues) => {
    try {
      if (!data.memberId) {
        toast.error('Selecione o membro');
        return;
      }

      if (data.voteKnowledgeType === 'CONHECIMENTO' && (!data.meritoDecisionId || data.meritoDecisionId === 'none')) {
        toast.error('Decisão de mérito é obrigatória para voto de conhecimento');
        return;
      }

      if (!data.voteText.trim()) {
        toast.error('O texto do voto não pode estar vazio');
        return;
      }

      const voteType = getVoteType(data.memberId);

      setLoading(true);
      const response = await fetch(
        `/api/ccr/sessions/${sessionId}/processos/${resourceId}/session-votes`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            memberId: data.memberId,
            voteType,
            voteKnowledgeType: data.voteKnowledgeType,
            preliminarDecisionId: data.preliminarDecisionId !== 'none' ? data.preliminarDecisionId : null,
            meritoDecisionId: data.meritoDecisionId !== 'none' ? data.meritoDecisionId : null,
            oficioDecisionId: data.oficioDecisionId !== 'none' ? data.oficioDecisionId : null,
            voteText: data.voteText.trim(),
          }),
        }
      );

      if (response.ok) {
        toast.success('Voto registrado com sucesso');
        router.push(`/ccr/sessoes/${params.id}/processos/${params.resourceId}/julgar`);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Erro ao registrar voto');
      }
    } catch (error) {
      console.error('Error creating session vote:', error);
      toast.error('Erro ao registrar voto');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push(`/ccr/sessoes/${params.id}/processos/${params.resourceId}/julgar`);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Membro */}
        <FormField
          control={form.control}
          name="memberId"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="block text-sm font-medium mb-1.5">
                Membro <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                    <SelectValue placeholder="Selecione o membro..." />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.name} - {member.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Tipo de Conhecimento */}
        <FormField
          control={form.control}
          name="voteKnowledgeType"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="block text-sm font-medium mb-1.5">
                Tipo de Conhecimento <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => !loading && field.onChange('NAO_CONHECIMENTO')}
                    disabled={loading}
                    className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                      field.value === 'NAO_CONHECIMENTO'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <p className="font-semibold text-gray-900">Não Conhecimento</p>
                    <p className="text-xs text-gray-600 mt-1">Questões preliminares e de ofício</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => !loading && field.onChange('CONHECIMENTO')}
                    disabled={loading}
                    className={`p-3.5 rounded-lg border-2 transition-all cursor-pointer ${
                      field.value === 'CONHECIMENTO'
                        ? 'border-gray-900 bg-gray-50'
                        : 'border-gray-200 hover:border-gray-300'
                    } disabled:opacity-50`}
                  >
                    <p className="font-semibold text-gray-900">Conhecimento</p>
                    <p className="text-xs text-gray-600 mt-1">Análise de mérito do recurso</p>
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Decisão Preliminar (apenas para Não Conhecimento) */}
        {voteKnowledgeType === 'NAO_CONHECIMENTO' && (
          <FormField
            control={form.control}
            name="preliminarDecisionId"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="block text-sm font-medium mb-1.5">
                  Decisão Preliminar <span className="text-gray-500 text-xs">(opcional)</span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                      <SelectValue placeholder="Nenhuma" />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="none">Nenhuma</SelectItem>
                      {preliminaryDecisions.map((decision) => (
                        <SelectItem key={decision.id} value={decision.id}>
                          {decision.identifier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Decisão de Mérito (apenas para Conhecimento) */}
        {voteKnowledgeType === 'CONHECIMENTO' && (
          <FormField
            control={form.control}
            name="meritoDecisionId"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <FormLabel className="block text-sm font-medium mb-1.5">
                  Decisão de Mérito <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={loading}
                  >
                    <SelectTrigger className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                      <SelectValue placeholder="Selecione uma decisão de mérito..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="none">Selecione uma decisão de mérito...</SelectItem>
                      {meritDecisions.map((decision) => (
                        <SelectItem key={decision.id} value={decision.id}>
                          {decision.identifier}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        {/* Decisão de Ofício */}
        <FormField
          control={form.control}
          name="oficioDecisionId"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="block text-sm font-medium mb-1.5">
                Decisão de Ofício <span className="text-gray-500 text-xs">(opcional)</span>
              </FormLabel>
              <FormControl>
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={loading}
                >
                  <SelectTrigger className="h-10 px-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-0 focus:ring-offset-0 focus:border-gray-400 transition-colors">
                    <SelectValue placeholder="Nenhuma" />
                  </SelectTrigger>
                  <SelectContent className="rounded-lg">
                    <SelectItem value="none">Nenhuma</SelectItem>
                    {oficioDecisions.map((decision) => (
                      <SelectItem key={decision.id} value={decision.id}>
                        {decision.identifier}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Texto do Voto */}
        <FormField
          control={form.control}
          name="voteText"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <FormLabel className="block text-sm font-medium mb-1.5">
                Texto do Voto <span className="text-red-500">*</span>
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  disabled={loading}
                  placeholder="O texto será gerado automaticamente com base nas decisões selecionadas. Você pode editá-lo conforme necessário."
                  rows={10}
                  className="resize-none px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={loading}
            className="cursor-pointer"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="cursor-pointer"
          >
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Registrar Voto
          </Button>
        </div>
      </form>
    </Form>
  );
}
