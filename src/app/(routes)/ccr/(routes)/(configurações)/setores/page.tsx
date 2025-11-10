'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { SectorTable } from './components/sector-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Sector {
  id: string;
  name: string;
  abbreviation: string | null;
  dispatchCode: string | null;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function SetoresPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/sectors');
      if (response.ok) {
        const data = await response.json();
        setSectors(data);
      }
    } catch (error) {
      console.error('Error fetching sectors:', error);
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
    <CCRPageWrapper title="Setores">
      <SectorTable
        data={sectors}
        loading={loading}
        onRefresh={fetchSectors}
        onNewSector={() => router.push('/ccr/setores/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
