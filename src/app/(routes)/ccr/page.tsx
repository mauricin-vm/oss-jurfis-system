'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MdLock } from 'react-icons/md';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Calendar, Gavel, AlertCircle, TrendingUp, Users, BarChart3, FileCheck } from 'lucide-react';
import { StatCard } from './components/stat-card';
import { Badge } from '@/components/ui/badge';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface DashboardStats {
  year: number;
  protocols: {
    total: number;
    thisYear: number;
    byStatus: Array<{ status: string; _count: number }>;
    byMonth: Array<{ month: number; count: number }>;
  };
  resources: {
    total: number;
    thisYear: number;
    byStatus: Array<{ status: string; _count: number }>;
    byYear: Array<{ year: number; count: number }>;
    bySubject: Array<{ subject: string; count: number }>;
    totalValue: number;
  };
  sessions: {
    total: number;
    thisYear: number;
    upcoming: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  votes: {
    total: number;
    byType: Array<{ voteType: string; _count: number }>;
  };
  decisions: {
    total: number;
    byResult: Array<{ result: string; _count: number }>;
  };
  notifications: {
    total: number;
    pending: number;
    byStatus: Array<{ status: string; _count: number }>;
  };
  documents: {
    total: number;
    thisYear: number;
  };
  tramitations: {
    total: number;
    thisMonth: number;
  };
}

const monthNames = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export default function CCRDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();

  const isLoggedIn = !!session;
  const isCheckingSession = status === 'loading';
  const userOrganization = session?.user?.organizationName;
  const hasAccess = userOrganization === 'Junta de Recursos Fiscais';

  const fetchStats = async () => {
    if (!isLoggedIn || !hasAccess) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/ccr/dashboard/stats?year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isCheckingSession) {
      fetchStats();
    }
  }, [isCheckingSession, isLoggedIn, hasAccess]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
    }).format(value);
  };

  const pendingProtocols = stats?.protocols.byStatus.find(s => s.status === 'PENDENTE')?._count || 0;
  const resourcesInAnalysis = stats?.resources.byStatus.find(s => s.status === 'EM_ANALISE')?._count || 0;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Menu
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">CCR</span>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-auto">
        {isCheckingSession || loading ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando estatísticas...</p>
          </div>
        ) : !isLoggedIn || !hasAccess ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MdLock className="text-5xl text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-2">
                Apenas usuários da <strong>Junta de Recursos Fiscais</strong> têm acesso ao sistema CCR.
              </p>
            </div>
          </div>
        ) : !stats ? (
          <div className="flex flex-col gap-4 p-4 pt-0">
            <Card>
              <CardContent className="flex h-[400px] items-center justify-center">
                <p className="text-sm text-muted-foreground">Erro ao carregar estatísticas</p>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 pt-0">
            <div className="space-y-6">
              {/* Cards de Estatísticas Principais */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Protocolos Pendentes"
                  value={pendingProtocols}
                  description={`${stats.protocols?.thisYear || 0} recebidos este ano`}
                  icon={FileText}
                />
                <StatCard
                  title="Recursos em Análise"
                  value={resourcesInAnalysis}
                  description={`${stats.resources?.thisYear || 0} recursos este ano`}
                  icon={TrendingUp}
                />
                <StatCard
                  title="Próximas Sessões"
                  value={stats.sessions?.upcoming || 0}
                  description={`${stats.sessions?.thisYear || 0} sessões este ano`}
                  icon={Calendar}
                />
                <StatCard
                  title="Notificações Pendentes"
                  value={stats.notifications?.pending || 0}
                  description={`${stats.notifications?.total || 0} notificações total`}
                  icon={AlertCircle}
                />
              </div>

              {/* Estatísticas Secundárias */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                  title="Total de Votos"
                  value={stats.votes?.total || 0}
                  description="Votos registrados"
                  icon={Gavel}
                />
                <StatCard
                  title="Acórdãos Emitidos"
                  value={stats.decisions?.total || 0}
                  description="Decisões publicadas"
                  icon={FileCheck}
                />
                <StatCard
                  title="Documentos"
                  value={stats.documents?.thisYear || 0}
                  description={`${stats.documents?.total || 0} documentos total`}
                  icon={BarChart3}
                />
                <StatCard
                  title="Tramitações (Mês)"
                  value={stats.tramitations?.thisMonth || 0}
                  description={`${stats.tramitations?.total || 0} tramitações total`}
                  icon={Users}
                />
              </div>

              {/* Gráficos e Detalhamentos */}
              <div className="grid gap-6 lg:grid-cols-7">
                {/* Protocolos por Mês */}
                <Card className="col-span-full lg:col-span-4">
                  <CardHeader>
                    <CardTitle>Protocolos por Mês ({stats.year})</CardTitle>
                    <CardDescription>
                      Evolução mensal de entrada de protocolos
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      {monthNames.map((month, index) => {
                        const monthData = stats.protocols?.byMonth?.find(m => m.month === index + 1);
                        const count = monthData?.count || 0;
                        const byMonth = stats.protocols?.byMonth || [];
                        const maxCount = byMonth.length > 0 ? Math.max(...byMonth.map(m => m.count), 1) : 1;
                        const percentage = (count / maxCount) * 100;

                        return (
                          <div key={month} className="flex items-center gap-4">
                            <span className="w-12 text-sm text-muted-foreground">{month}</span>
                            <div className="flex-1 h-6 bg-secondary rounded-md overflow-hidden">
                              <div
                                className="h-full bg-primary transition-all"
                                style={{ width: `${percentage}%` }}
                              />
                            </div>
                            <span className="w-12 text-sm font-medium text-right">{count}</span>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Status dos Recursos */}
                <Card className="col-span-full lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Status dos Recursos</CardTitle>
                    <CardDescription>Distribuição por status</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {(stats.resources?.byStatus || []).map((item) => (
                        <div key={item.status} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{item.status.replace(/_/g, ' ')}</Badge>
                          </div>
                          <span className="text-sm font-medium">{item._count}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recursos por Assunto e Valor Total */}
              <div className="grid gap-6 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Top 5 Assuntos</CardTitle>
                    <CardDescription>Recursos por assunto</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {(stats.resources?.bySubject || []).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm">{item.subject}</span>
                          <Badge>{item.count}</Badge>
                        </div>
                      ))}
                      {(stats.resources?.bySubject || []).length === 0 && (
                        <p className="text-sm text-muted-foreground">Nenhum dado disponível</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Valor Total em Disputa</CardTitle>
                    <CardDescription>Soma dos valores dos recursos ({stats.year})</CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-4">
                      <div className="text-3xl font-bold">{formatCurrency(stats.resources?.totalValue || 0)}</div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Total de Recursos</span>
                          <span className="font-medium">{stats.resources?.thisYear || 0}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Valor Médio</span>
                          <span className="font-medium">
                            {(stats.resources?.thisYear || 0) > 0
                              ? formatCurrency((stats.resources?.totalValue || 0) / (stats.resources?.thisYear || 1))
                              : 'R$ 0'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Resultados de Julgamento */}
              <Card>
                <CardHeader>
                  <CardTitle>Resultados de Julgamento</CardTitle>
                  <CardDescription>Distribuição de resultados dos acórdãos</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {(stats.decisions?.byResult || []).map((item) => (
                      <div key={item.result} className="rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            {item.result.replace(/_/g, ' ')}
                          </span>
                          <Badge>{item._count}</Badge>
                        </div>
                        <div className="mt-2 text-2xl font-bold">
                          {((item._count / (stats.decisions?.total || 1)) * 100).toFixed(1)}%
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          do total de {stats.decisions?.total || 0} decisões
                        </p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
