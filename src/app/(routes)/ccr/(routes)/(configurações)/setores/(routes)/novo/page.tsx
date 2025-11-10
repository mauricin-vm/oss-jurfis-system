'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SectorForm } from '../../components/sector-form';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

export default function NovoSetorPage() {
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
      title="Novo Setor"
      breadcrumbs={[
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Setores', href: '/ccr/setores' },
        { label: 'Novo' }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Setor</CardTitle>
          <CardDescription>
            Preencha as informações do novo setor.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SectorForm />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
