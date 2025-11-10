'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProtocolTable } from './components/protocol-table';
import { CCRPageWrapper } from '../components/ccr-page-wrapper';

interface Protocol {
  id: string;
  number: string;
  originationDate: Date;
  receptionDate: Date;
  subject: string;
  status: string;
  isActive: boolean;
  employee: {
    id: string;
    name: string;
  };
  sector?: {
    id: string;
    name: string;
    abbreviation: string | null;
  } | null;
  protocolParts: Array<{
    part: {
      id: string;
      name: string;
    };
  }>;
  _count?: {
    tramitations: number;
  };
  resource?: any;
  createdAt: Date;
  updatedAt: Date;
}

export default function ProtocolosPage() {
  const router = useRouter();
  const [protocols, setProtocols] = useState<Protocol[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProtocols();
  }, []);

  const fetchProtocols = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/protocols');
      if (response.ok) {
        const data = await response.json();
        setProtocols(data);
      }
    } catch (error) {
      console.error('Error fetching protocols:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CCRPageWrapper title="Protocolos">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold tracking-tight">Protocolos</h2>
          <Button onClick={() => router.push('/ccr/protocolos/novo')}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Protocolo
          </Button>
        </div>

        <ProtocolTable data={protocols} loading={loading} onRefresh={fetchProtocols} />
      </div>
    </CCRPageWrapper>
  );
}
