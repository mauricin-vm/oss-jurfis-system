'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { MemberTable } from './components/member-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Member {
  id: string;
  name: string;
  role: string | null;
  cpf: string | null;
  registration: string | null;
  agency: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export default function MembrosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    fetchMembers();
  }, []);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/members');
      if (response.ok) {
        const data = await response.json();
        setMembers(data);
      }
    } catch (error) {
      console.error('Error fetching members:', error);
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
    <CCRPageWrapper title="Membros">
      <MemberTable
        data={members}
        loading={loading}
        onRefresh={fetchMembers}
        onNewMember={() => router.push('/ccr/membros/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
