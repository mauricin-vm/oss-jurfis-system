'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { SubjectsForm } from './subjects-form';

interface Resource {
  id: string;
  resourceNumber: string;
  subjects: Array<{
    id: string;
    isPrimary: boolean;
    subject: {
      id: string;
      name: string;
      parentId: string | null;
    };
  }>;
}

export default function EditarAssuntosPage() {
  const router = useRouter();
  const params = useParams();
  const [resource, setResource] = useState<Resource | null>(null);
  const [loading, setLoading] = useState(true);
  const [subjectsLoaded, setSubjectsLoaded] = useState(false);

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
    { label: 'Assunto' }
  ];

  // Renderizar SubjectsForm hidden para carregar os dados
  const shouldShowSkeleton = loading || !subjectsLoaded;

  return (
    <>
      {shouldShowSkeleton && (
        <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
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
      )}

      {!loading && resource && (
        <div className={shouldShowSkeleton ? 'hidden' : 'block'}>
          <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
            <Card>
              <CardHeader>
                <CardTitle>Editar Assunto</CardTitle>
                <CardDescription>
                  Selecione o assunto principal e os subitens relacionados ao recurso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <SubjectsForm initialData={resource} onSubjectsLoaded={() => setSubjectsLoaded(true)} />
              </CardContent>
            </Card>
          </CCRPageWrapper>
        </div>
      )}

      {!loading && !resource && (
        <CCRPageWrapper title="Editar Assunto" breadcrumbs={breadcrumbs}>
          <Card>
            <CardContent className="flex h-[400px] items-center justify-center">
              <p className="text-muted-foreground">Recurso não encontrado</p>
            </CardContent>
          </Card>
        </CCRPageWrapper>
      )}
    </>
  );
}
