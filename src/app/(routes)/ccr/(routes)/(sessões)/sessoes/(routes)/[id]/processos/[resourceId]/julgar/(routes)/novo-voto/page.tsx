'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CCRPageWrapper } from '@/app/(routes)/ccr/components/ccr-page-wrapper';
import { Skeleton } from '@/components/ui/skeleton';
import { SessionVoteForm } from './components/session-vote-form';

interface JudgmentData {
  sessionResource: {
    id: string;
    resource: {
      processNumber: string;
      resourceNumber: string;
    };
  };
  session: {
    id: string;
    sessionNumber: string;
    members: Array<{
      member: {
        id: string;
        name: string;
        role: string;
      };
    }>;
  };
  distribution: {
    distributedToId: string;
    firstDistribution: {
      id: string;
      name: string;
      role: string;
    } | null;
  } | null;
  reviewers: Array<{
    id: string;
    name: string;
    role: string;
  }>;
  preliminaryDecisions: Array<{
    id: string;
    identifier: string;
    type: string;
    rejectText?: string | null;
  }>;
  meritDecisions: Array<{
    id: string;
    identifier: string;
    type: string;
    text?: string | null;
  }>;
  oficioDecisions: Array<{
    id: string;
    identifier: string;
    type: string;
    text?: string | null;
  }>;
}

export default function NovoVotoPage() {
  const router = useRouter();
  const params = useParams();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<JudgmentData | null>(null);

  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id && params.resourceId) {
      fetchData();
    }
  }, [params.id, params.resourceId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/ccr/sessions/${params.id}/processos/${params.resourceId}/julgar`
      );

      if (response.ok) {
        const result = await response.json();
        setData(result);
      } else {
        console.error('Failed to fetch data');
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <CCRPageWrapper
        title="Novo Voto"
        breadcrumbs={[
          { label: 'Menu', href: '/' },
          { label: 'CCR', href: '/ccr' },
          { label: 'Sessões', href: '/ccr/sessoes' },
          { label: 'Sessão' },
          { label: 'Julgar' },
          { label: 'Novo Voto' },
        ]}
      >
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (session?.user?.role === 'EXTERNAL' || !data) {
    return null;
  }

  return (
    <CCRPageWrapper
      title="Novo Voto"
      breadcrumbs={[
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Sessões', href: '/ccr/sessoes' },
        { label: `Sessão n. ${data.session.sessionNumber}`, href: `/ccr/sessoes/${params.id}` },
        { label: `Julgar n. ${data.sessionResource.resource.resourceNumber}`, href: `/ccr/sessoes/${params.id}/processos/${params.resourceId}/julgar` },
        { label: 'Novo Voto' },
      ]}
    >
      <Card>
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>Registrar Voto</CardTitle>
            <CardDescription>
              Registre o voto individual do membro para o processo {data.sessionResource.resource.processNumber} - {data.sessionResource.resource.resourceNumber}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <SessionVoteForm
            sessionId={params.id as string}
            resourceId={params.resourceId as string}
            members={data.session.members.map(m => m.member)}
            distributedToId={data.distribution?.distributedToId}
            relatorId={data.distribution?.firstDistribution?.id}
            reviewersIds={data.reviewers.map(r => r.id)}
            preliminaryDecisions={data.preliminaryDecisions}
            meritDecisions={data.meritDecisions}
            oficioDecisions={data.oficioDecisions}
          />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
