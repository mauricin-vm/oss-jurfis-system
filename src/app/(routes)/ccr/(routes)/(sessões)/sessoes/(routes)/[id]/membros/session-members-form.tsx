'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Member {
  id: string;
  name: string;
  role: string | null;
  isActive: boolean;
}

interface SessionMember {
  id: string;
  memberId: string;
  member: {
    id: string;
    name: string;
  };
}

interface SessionMembersFormProps {
  sessionId: string;
  onSessionLoad?: (sessionNumber: string) => void;
}

export function SessionMembersForm({ sessionId, onSessionLoad }: SessionMembersFormProps) {
  const router = useRouter();
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadingLastSession, setLoadingLastSession] = useState(false);

  useEffect(() => {
    fetchData();
  }, [sessionId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Buscar sessão para obter o presidente
      const sessionResponse = await fetch(`/api/ccr/sessions/${sessionId}`);
      if (!sessionResponse.ok) throw new Error('Erro ao buscar sessão');
      const sessionData = await sessionResponse.json();

      // Notificar o parent sobre o número da sessão
      if (onSessionLoad && sessionData.sessionNumber) {
        onSessionLoad(sessionData.sessionNumber);
      }

      // Buscar todos os membros
      const membersResponse = await fetch('/api/ccr/members?isActive=true');
      if (!membersResponse.ok) throw new Error('Erro ao buscar membros');
      const allMembers: Member[] = await membersResponse.json();

      // Filtrar apenas membros ativos e excluir o presidente da sessão
      const activeMembers = allMembers.filter(
        m => m.isActive && m.id !== sessionData.presidentId
      );
      setMembers(activeMembers);

      const currentMemberIds = sessionData.members?.map((sm: SessionMember) => sm.memberId) || [];
      setSelectedMemberIds(currentMemberIds);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMember = (memberId: string) => {
    setSelectedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId);
      } else {
        return [...prev, memberId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedMemberIds.length === members.length) {
      setSelectedMemberIds([]);
    } else {
      setSelectedMemberIds(members.map(m => m.id));
    }
  };

  const handleLoadLastSessionMembers = useCallback(async () => {
    try {
      setLoadingLastSession(true);

      // Buscar a sessão atual para pegar a data
      const currentSessionResponse = await fetch(`/api/ccr/sessions/${sessionId}`);
      if (!currentSessionResponse.ok) throw new Error('Erro ao buscar sessão atual');
      const currentSession = await currentSessionResponse.json();

      // Buscar todas as sessões anteriores à sessão atual
      const sessionsResponse = await fetch('/api/ccr/sessions');
      if (!sessionsResponse.ok) throw new Error('Erro ao buscar sessões');
      const allSessions = await sessionsResponse.json();

      // Filtrar sessões anteriores e ordenar por data decrescente
      const previousSessions = allSessions
        .filter((s: any) => new Date(s.date) < new Date(currentSession.date))
        .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (previousSessions.length === 0) {
        toast.info('Não há sessões anteriores');
        return;
      }

      // Pegar a última sessão
      const lastSession = previousSessions[0];

      // Buscar os membros da última sessão
      const lastSessionResponse = await fetch(`/api/ccr/sessions/${lastSession.id}`);
      if (!lastSessionResponse.ok) throw new Error('Erro ao buscar última sessão');
      const lastSessionData = await lastSessionResponse.json();

      const lastSessionMemberIds = lastSessionData.members?.map((sm: SessionMember) => sm.memberId) || [];

      // Filtrar apenas os membros que ainda estão disponíveis (ativos e não presidente)
      const validMemberIds = lastSessionMemberIds.filter((id: string) =>
        members.some(m => m.id === id)
      );

      setSelectedMemberIds(validMemberIds);
      toast.success(`Membros da sessão ${lastSession.sessionNumber} carregados com sucesso!`);
    } catch (error) {
      console.error('Error loading last session members:', error);
      toast.error('Erro ao carregar membros da última sessão');
    } finally {
      setLoadingLastSession(false);
    }
  }, [sessionId, members]);

  // Escutar evento customizado para carregar membros da última sessão
  useEffect(() => {
    window.addEventListener('loadLastSessionMembers', handleLoadLastSessionMembers);

    return () => {
      window.removeEventListener('loadLastSessionMembers', handleLoadLastSessionMembers);
    };
  }, [handleLoadLastSessionMembers]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await fetch(`/api/ccr/sessions/${sessionId}/members`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          memberIds: selectedMemberIds,
        }),
      });

      if (!response.ok) {
        const error = await response.text();

        // Erro de validação (400) - esperado, não logar no console
        if (response.status === 400) {
          toast.error(error || 'Erro ao salvar participantes');
          return;
        }

        // Outros erros - logar no console
        throw new Error(error || 'Erro ao salvar participantes');
      }

      toast.success('Participantes salvos com sucesso!');
      router.push(`/ccr/sessoes/${sessionId}`);
    } catch (error: any) {
      console.error('Error saving members:', error);
      toast.error(error.message || 'Erro ao salvar participantes');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {/* Contador e Botões */}
        <div className="flex items-center justify-between pb-4 border-b">
          <Skeleton className="h-5 w-48" />
          <div className="flex gap-2">
            <Skeleton className="h-9 w-32" />
          </div>
        </div>

        {/* Grid de Membros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex items-start space-x-3 rounded-lg border p-4"
            >
              <Skeleton className="h-5 w-5 mt-1" />
              <div className="flex-1">
                <Skeleton className="h-4 w-40 mb-1" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center justify-end gap-4 pt-4 border-t">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-44" />
        </div>
      </div>
    );
  }

  // Ordenar membros alfabeticamente
  const sortedMembers = [...members].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Botões de Seleção */}
      <div className="flex items-center justify-between pb-4 border-b">
        <div>
          <p className="text-sm text-muted-foreground">
            {selectedMemberIds.length} de {members.length} conselheiros selecionados
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleSelectAll}
          >
            {selectedMemberIds.length === members.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
          </Button>
        </div>
      </div>

      {/* Lista de Membros */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {sortedMembers.map((member) => (
          <div
            key={member.id}
            className="flex items-start space-x-3 rounded-lg border p-4 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => handleToggleMember(member.id)}
          >
            <Checkbox
              id={member.id}
              checked={selectedMemberIds.includes(member.id)}
              onCheckedChange={() => handleToggleMember(member.id)}
              className="mt-1"
            />
            <div className="flex-1">
              <Label
                htmlFor={member.id}
                className="text-sm font-medium leading-none cursor-pointer"
              >
                {member.name}
              </Label>
              {member.role && (
                <p className="text-sm text-muted-foreground mt-1">
                  {member.role}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {members.length === 0 && (
        <div className="text-center py-8">
          <p className="text-sm text-muted-foreground">
            Nenhum conselheiro ativo encontrado
          </p>
        </div>
      )}

      {/* Botões de Ação */}
      <div className="flex items-center justify-end gap-4 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/ccr/sessoes/${sessionId}`)}
          disabled={saving}
        >
          Cancelar
        </Button>
        <Button type="submit" disabled={saving} className="cursor-pointer">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            'Salvar Participantes'
          )}
        </Button>
      </div>
    </form>
  );
}
