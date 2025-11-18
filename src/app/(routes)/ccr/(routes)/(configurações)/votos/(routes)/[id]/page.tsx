'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DecisionForm } from '../../components/decision-form';
import { DecisionFormSkeleton } from '../../components/decision-form-skeleton';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

interface Decision {
  id: string;
  type: 'PRELIMINAR' | 'MERITO' | 'OFICIO';
  identifier: string;
  acceptText?: string | null;
  rejectText?: string | null;
  text?: string | null;
  isActive: boolean;
}

export default function EditarDecisaoPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [decision, setDecision] = useState<Decision | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchDecision();
    }
  }, [params.id]);

  const fetchDecision = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/vote-decisions/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setDecision(data);
      }
    } catch (error) {
      console.error('Error fetching decision:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Votos', href: '/ccr/votos' },
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
      <CCRPageWrapper title="Editar Voto" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <div className="space-y-1.5">
              <CardTitle>Editar Voto</CardTitle>
              <CardDescription>
                Atualize as informações do voto
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <DecisionFormSkeleton />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!decision) {
    return (
      <CCRPageWrapper title="Editar Voto" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Voto não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Voto" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>Editar Voto</CardTitle>
            <CardDescription>
              Atualize as informações do voto
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DecisionForm initialData={{
            ...decision,
            acceptText: decision.acceptText ?? undefined,
            rejectText: decision.rejectText ?? undefined,
            text: decision.text ?? undefined,
          }} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
