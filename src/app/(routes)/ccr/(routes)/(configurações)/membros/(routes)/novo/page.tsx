'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberForm } from '../../components/member-form';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

export default function NovoMembroPage() {
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
      title="Novo Membro"
      breadcrumbs={[
        { label: 'Menu', href: '/' },
        { label: 'CCR', href: '/ccr' },
        { label: 'Membros', href: '/ccr/membros' },
        { label: 'Novo' }
      ]}
    >
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar Membro</CardTitle>
          <CardDescription>
            Preencha as informações do novo membro.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
