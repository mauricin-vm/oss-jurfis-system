'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AuthorityForm } from '../../components/authority-form';
import { AuthorityFormSkeleton } from '../../components/authority-form-skeleton';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

interface Authority {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  isActive: boolean;
}

export default function EditarAutoridadePage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [authority, setAuthority] = useState<Authority | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchAuthority();
    }
  }, [params.id]);

  const fetchAuthority = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/authorities-registered/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setAuthority(data);
      }
    } catch (error) {
      console.error('Error fetching authority:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Autoridades', href: '/ccr/autoridades' },
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
      <CCRPageWrapper title="Editar Autoridade" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 mt-1.5" />
          </CardHeader>
          <CardContent>
            <AuthorityFormSkeleton />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!authority) {
    return (
      <CCRPageWrapper title="Editar Autoridade" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Autoridade não encontrada</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Autoridade" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Autoridade</CardTitle>
          <CardDescription>
            Atualize as informações da autoridade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorityForm initialData={{
            ...authority,
            phone: authority.phone ?? undefined,
            email: authority.email ?? undefined,
          }} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
