'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SubjectForm } from '../../components/subject-form';
import { SubjectFormSkeleton } from '../../components/subject-form-skeleton';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

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
}

export default function EditarAssuntoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [subject, setSubject] = useState<Subject | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchSubject();
    }
  }, [params.id]);

  const fetchSubject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/subjects/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSubject(data);
      }
    } catch (error) {
      console.error('Error fetching subject:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Assuntos', href: '/ccr/assuntos' },
    { label: 'Editar' }
  ];

  // Se ainda está carregando a sessão, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo (redirecionamento já está acontecendo)
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  if (loading) {
    return (
      <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 mt-1.5" />
          </CardHeader>
          <CardContent>
            <SubjectFormSkeleton />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!subject) {
    return (
      <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Assunto não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Assunto</CardTitle>
          <CardDescription>
            Atualize as informações do assunto.
            {subject.parent && ` (sub-item de "${subject.parent.name}")`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SubjectForm initialData={{
            ...subject,
            description: subject.description ?? undefined,
            parentId: subject.parentId ?? undefined,
          }} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
