'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SessionForm } from '../../../components/session-form';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';

interface Session {
  id: string;
  sessionNumber: string;
  agendaNumber: string | null;
  date: Date;
  startTime: string | null;
  endTime: string | null;
  type: string;
  presidentId: string | null;
  observations: string | null;
}

export default function EditarSessaoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchSession();
    }
  }, [params.id]);

  const fetchSession = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/sessions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setSessionData(data);
      } else {
        router.push('/ccr/sessoes');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      router.push('/ccr/sessoes');
    } finally {
      setLoading(false);
    }
  };

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  // Se ainda está carregando a sessão do usuário, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo (redirecionamento já está acontecendo)
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${sessionData?.sessionNumber || 'Carregando...'}`, href: `/ccr/sessoes/${params.id}` },
    { label: 'Editar' },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Editar Sessão" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>Editar Sessão</CardTitle>
              <CardDescription>
                Atualize as informações da sessão conforme necessário.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Linha 1: Número, Data e Tipo */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Linha 2: Horário Início, Horário Término e Presidente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-24 w-full" />
              </div>

              {/* Botões */}
              <div className="flex justify-end gap-4 pt-4">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!sessionData) {
    return null;
  }

  return (
    <CCRPageWrapper title="Editar Sessão" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>Editar Sessão</CardTitle>
            <CardDescription>
              Atualize as informações da sessão conforme necessário.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SessionForm initialData={sessionData} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
