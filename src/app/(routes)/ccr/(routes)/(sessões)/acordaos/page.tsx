'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DecisionTable } from './components/decision-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Decision {
  id: string;
  decisionNumber: string;
  sequenceNumber: number;
  year: number;
  ementaTitle: string;
  ementaBody: string;
  votePath: string | null;
  status: string;
  decisionFilePath: string | null;
  resource: {
    id: string;
    resourceNumber: string;
    processNumber: string;
    processName: string | null;
  };
  publications: {
    id: string;
    publicationOrder: number;
    publicationNumber: string;
    publicationDate: Date;
  }[];
  createdByUser: {
    id: string;
    name: string | null;
  };
  _count: {
    publications: number;
  };
  createdAt: Date;
}

export default function AcordaosPage() {
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
      const response = await fetch('/api/ccr/decisions');
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
    <CCRPageWrapper title="Acórdãos">
      <DecisionTable
        data={decisions}
        loading={loading}
        onRefresh={fetchDecisions}
        onNewDecision={() => router.push('/ccr/acordaos/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
