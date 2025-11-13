'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { CCRPageWrapper } from '../../../../../../components/ccr-page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface Session {
  id: string;
  sessionNumber: string;
  administrativeMatters: string | null;
}

export default function AssuntosAdministrativosPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [sessionData, setSessionData] = useState<Session | null>(null);
  const [administrativeMatters, setAdministrativeMatters] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setAdministrativeMatters(data.administrativeMatters || '');
      } else {
        router.push('/ccr/sessoes');
      }
    } catch (error) {
      console.error('Error fetching session:', error);
      toast.error('Erro ao carregar sessão');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSaving(true);

      const response = await fetch(`/api/ccr/sessions/${params.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          administrativeMatters: administrativeMatters.trim() || null,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(error || 'Erro ao salvar assuntos administrativos');
      }

      toast.success('Assuntos administrativos salvos com sucesso!');
      router.push(`/ccr/sessoes/${params.id}`);
    } catch (error: any) {
      console.error('Error saving administrative matters:', error);
      toast.error(error.message || 'Erro ao salvar assuntos administrativos');
    } finally {
      setSaving(false);
    }
  };

  // Se ainda está carregando a sessão do usuário, não renderizar nada
  if (status === 'loading') {
    return null;
  }

  // Se é EXTERNAL, não renderizar o conteúdo
  if (session?.user?.role === 'EXTERNAL') {
    return null;
  }

  const breadcrumbs = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: 'Sessões', href: '/ccr/sessoes' },
    { label: `Sessão n. ${sessionData?.sessionNumber || 'Carregando...'}`, href: `/ccr/sessoes/${params.id}` },
    { label: 'Assuntos Administrativos' },
  ];

  if (loading) {
    return (
      <CCRPageWrapper title="Assuntos Administrativos" breadcrumbs={breadcrumbs}>
        <Card>
          <CardHeader>
            <CardTitle>Assuntos Administrativos da Sessão</CardTitle>
            <CardDescription>
              Registre os assuntos administrativos discutidos durante a sessão
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <Skeleton className="h-72 w-full rounded-lg" />

              <div className="flex items-center justify-end gap-4 pt-4 border-t">
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
    <CCRPageWrapper title="Assuntos Administrativos" breadcrumbs={breadcrumbs}>
      <Card>
        <CardHeader>
          <CardTitle>Assuntos Administrativos da Sessão</CardTitle>
          <CardDescription>
            Registre os assuntos administrativos discutidos durante a sessão
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Textarea
                placeholder="Descreva os assuntos administrativos discutidos na sessão..."
                value={administrativeMatters}
                onChange={(e) => setAdministrativeMatters(e.target.value)}
                rows={12}
                className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors focus-visible:ring-0 focus-visible:ring-offset-0 resize-none"
              />
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center justify-end gap-4 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/ccr/sessoes/${params.id}`)}
                disabled={saving}
                className="cursor-pointer"
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="cursor-pointer">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Salvar Assuntos'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </CCRPageWrapper>
  );
}
