'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { SessionMembersForm } from './session-members-form';

export default function SessionMembersPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessionNumber, setSessionNumber] = useState<string | null>(null);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  if (status === 'loading') {
    return null;
  }

  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  const breadcrumbs = sessionNumber
    ? [
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Sessões', href: '/ccr/sessoes' },
        { label: `Sessão n. ${sessionNumber}`, href: `/ccr/sessoes/${params.id}` },
        { label: 'Membros' }
      ]
    : [
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Sessões', href: '/ccr/sessoes' },
        { label: 'Sessão' },
        { label: 'Membros' }
      ];

  return (
    <CCRPageWrapper title="Gerenciar Membros" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Conselheiros Participantes da Sessão</CardTitle>
          <CardDescription>
            Selecione os conselheiros que estarão presentes nesta sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SessionMembersForm
            sessionId={params.id as string}
            onSessionLoad={(number) => {
              setSessionNumber(number);
            }}
          />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
