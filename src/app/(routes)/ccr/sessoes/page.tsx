'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionTable } from './components/session-table';
import { CCRPageWrapper } from '../components/ccr-page-wrapper';

interface Session {
  id: string;
  sessionNumber: number;
  sessionDate: Date;
  type: string;
  status: string;
  location: string | null;
  createdBy: {
    id: string;
    name: string;
  };
  _count: {
    sessionResources: number;
    votes: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function SessoesPage() {
  const router = useRouter();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/sessions');
      if (response.ok) {
        const data = await response.json();
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCRPageWrapper title="Sessões">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Sessões</h2>
          <Button onClick={() => router.push('/ccr/sessoes/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Sessão
          </Button>
        </div>

        <SessionTable data={sessions} loading={loading} onRefresh={fetchSessions} />
      </div>
    </CCRPageWrapper>
  );
}
