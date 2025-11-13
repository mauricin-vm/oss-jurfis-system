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
              <CardTitle>Editar Assunto</CardTitle>
              <CardDescription>
                Selecione o assunto principal e os subitens relacionados ao recurso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Assunto Principal */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-3 w-80" />
                </div>

                {/* Subitens */}
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center space-x-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                  <Skeleton className="h-3 w-96" />
                </div>

                {/* Botões */}
                <div className="flex justify-end gap-4">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-40" />
                </div>
              </div>
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
