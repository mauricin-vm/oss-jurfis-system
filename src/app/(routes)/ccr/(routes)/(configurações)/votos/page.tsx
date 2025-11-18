'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DecisionTable } from './components/decision-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Decision {
  id: string;
  type: 'PRELIMINAR' | 'MERITO' | 'OFICIO';
  identifier: string;
  acceptText?: string | null;
  rejectText?: string | null;
  text?: string | null;
  isActive: boolean;
  isInUse?: boolean;
  _count?: {
    sessionVotingResults: number;
    memberVoteDecisions: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function DecisoesVotoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [decisions, setDecisions] = useState<Decision[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    fetchDecisions();
  }, []);

  const fetchDecisions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/vote-decisions');
      if (response.ok) {
        const data = await response.json();
        setDecisions(data);
      }
    } catch (error) {
      console.error('Error fetching decisions:', error);
    } finally {
      setLoading(false);
    }
  };

  // Se ainda está carregando a sessão, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo (redirecionamento já está acontecendo)
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  return (
    <CCRPageWrapper title="Votos">
      <DecisionTable
        data={decisions}
        loading={loading}
        onRefresh={fetchDecisions}
        onNewDecision={() => router.push('/ccr/votos/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
