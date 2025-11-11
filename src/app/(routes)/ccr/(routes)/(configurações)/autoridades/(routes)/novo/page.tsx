'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AuthorityForm } from '../../components/authority-form';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

export default function NovaAutoridadePage() {
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
      title="Nova Autoridade"
      breadcrumbs={[
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Autoridades', href: '/ccr/autoridades' },
        { label: 'Nova' }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Autoridade</CardTitle>
          <CardDescription>
            Preencha as informações da nova autoridade.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AuthorityForm />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
