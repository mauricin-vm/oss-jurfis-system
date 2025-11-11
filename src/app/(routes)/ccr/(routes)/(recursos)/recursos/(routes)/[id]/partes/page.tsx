'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { AuthoritiesForm } from './authorities-form';

interface Resource {
  id: string;
  resourceNumber: string;
  authorities: Array<{
    id: string;
    type: string;
    authorityRegisteredId: string;
    authorityRegistered: {
      id: string;
      name: string;
      isActive: boolean;
    };
  }>;
  parts: Array<{
    id: string;
    name: string;
    role: string;
    registrationType: string | null;
    registrationNumber: string | null;
  }>;
}

export default function EditarPartesPage() {
  const router = useRouter();
  const params = useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchResource();
    }
  }, [params.id]);

  const fetchResource = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/resources/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setResource(data);
      }
    } catch (error) {
      console.error('Error fetching resource:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Recursos', href: '/ccr/recursos' },
    { label: resource?.resourceNumber || 'Carregando...', href: `/ccr/recursos/${params.id}` },
    { label: 'Partes Interessadas' }
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Editar Partes Interessadas" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-96 mt-1.5" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-[400px]" />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!resource) {
    return (
      <CCRPageWrapper title="Editar Partes Interessadas" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Recurso não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Partes Interessadas" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Partes Interessadas</CardTitle>
          <CardDescription>
            Gerencie as partes interessadas vinculadas ao recurso.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthoritiesForm initialData={resource} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
