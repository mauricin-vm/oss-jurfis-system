'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DecisionForm } from '../../components/decision-form';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

export default function NovaDecisaoPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  // Se ainda está carregando a sessão, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo (redirecionamento já está acontecendo)
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  return (
    <CCRPageWrapper
      title="Novo Voto"
      breadcrumbs={[
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Votos', href: '/ccr/votos' },
        { label: 'Novo' }
      ]}
    >
      <Card>
        <CardHeader>
          <div className="space-y-1.5">
            <CardTitle>Cadastrar Voto</CardTitle>
            <CardDescription>
              Preencha as informações do novo voto que poderá ser utilizado nas votações.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <DecisionForm />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
