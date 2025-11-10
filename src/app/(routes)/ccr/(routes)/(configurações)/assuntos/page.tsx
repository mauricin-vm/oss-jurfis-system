'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SubjectTable } from './components/subject-table';
import { CCRPageWrapper } from '../../../components/ccr-page-wrapper';

interface Subject {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  isActive: boolean;
  parent?: {
    id: string;
    name: string;
  } | null;
  _count?: {
    children: number;
    resourceLinks: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export default function AssuntosPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ccr/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data);
      }
    } catch (error) {
      console.error('Error fetching subjects:', error);
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
    <CCRPageWrapper title="Assuntos">
      <SubjectTable
        data={subjects}
        loading={loading}
        onRefresh={fetchSubjects}
        onNewSubject={() => router.push('/ccr/assuntos/novo')}
        userRole={session?.user?.role}
      />
    </CCRPageWrapper>
  );
}
