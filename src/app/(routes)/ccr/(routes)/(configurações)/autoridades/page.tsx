'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AuthorityTable } from './components/authority-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Authority {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function AutoridadesPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authorities, setAuthorities] = useState<Authority[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    fetchAuthorities();
  }, []);

  const fetchAuthorities = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/authorities-registered');
      if (response.ok) {
        const data = await response.json();
        setAuthorities(data);
      }
    } catch (error) {
      console.error('Error fetching authorities:', error);
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
    <CCRPageWrapper title="Autoridades">
      <AuthorityTable
        data={authorities}
        loading={loading}
        onRefresh={fetchAuthorities}
        onNewAuthority={() => router.push('/ccr/autoridades/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
