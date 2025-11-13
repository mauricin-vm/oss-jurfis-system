'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MemberForm } from '../../components/member-form';
import { MemberFormSkeleton } from '../../components/member-form-skeleton';
import { CCRPageWrapper } from '../../../../../components/ccr-page-wrapper';

interface Member {
  id: string;
  name: string;
  role: string | null;
  cpf: string | null;
  registration: string | null;
  agency: string | null;
  phone: string | null;
  email: string | null;
  gender: string | null;
  isActive: boolean;
}

export default function EditarMembroPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [member, setMember] = useState<Member | null>(null);
  const [loading, setLoading] = useState(true);

  // Verificar acesso
  useEffect(() => {
    if (session?.user?.role === 'EXTERNAL') {
      router.push('/ccr');
    }
  }, [session, router]);

  useEffect(() => {
    if (params.id) {
      fetchMember();
    }
  }, [params.id]);

  const fetchMember = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/members/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setMember(data);
      }
    } catch (error) {
      console.error('Error fetching member:', error);
    } finally {
      setLoading(false);
    }
  };

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Membros', href: '/ccr/membros' },
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
      <CCRPageWrapper title="Editar Membro" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <CardTitle>Editar Membro</CardTitle>
            <CardDescription>
              Atualize as informações do membro
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MemberFormSkeleton />
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  if (!member) {
    return (
      <CCRPageWrapper title="Editar Membro" breadcrumbs={breadcrumbs}>
        <Card>
          <CardContent className="flex h-[400px] items-center justify-center">
            <p className="text-muted-foreground">Membro não encontrado</p>
          </CardContent>
        </Card>
      </CCRPageWrapper>
    );
  }

  return (
    <CCRPageWrapper title="Editar Membro" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Editar Membro</CardTitle>
          <CardDescription>
            Atualize as informações do membro
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MemberForm initialData={{
            ...member,
            role: member.role ?? undefined,
            cpf: member.cpf ?? undefined,
            registration: member.registration ?? undefined,
            agency: member.agency ?? undefined,
            phone: member.phone ?? undefined,
            email: member.email ?? undefined,
            gender: member.gender ?? undefined,
          }} />
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
