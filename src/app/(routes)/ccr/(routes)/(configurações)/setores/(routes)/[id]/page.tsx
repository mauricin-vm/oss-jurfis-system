'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { SectorForm } from '../../components/sector-form';
import { SectorFormSkeleton } from '../../components/sector-form-skeleton';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

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
}

export default function EditarSetorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sector, setSector] = useState<Sector | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchSector();
    }
  }, [params.id]);

  const fetchSector = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/sectors/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSector(data);
      }
    } catch (error) {
      console.error('Error fetching sector:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Setores', href: '/ccr/setores' },
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
      <CCRPageWrapper title="Editar Setor" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 mt-1.5" />
          </CardHeader>
          <CardContent>
            <SectorFormSkeleton />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!sector) {
    return (
      <CCRPageWrapper title="Editar Setor" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Setor não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Setor" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Setor</CardTitle>
          <CardDescription>
            Atualize as informações do setor
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorForm initialData={{
            ...sector,
            abbreviation: sector.abbreviation ?? undefined,
            dispatchCode: sector.dispatchCode ?? undefined,
            description: sector.description ?? undefined,
            phone: sector.phone ?? undefined,
            email: sector.email ?? undefined,
            address: sector.address ?? undefined,
          }} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
