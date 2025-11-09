'use client'

//importar bibliotecas e funções
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { IoCalendar, IoChatbubbles, IoTime, IoLockClosed } from 'react-icons/io5';
import { HiDocumentDuplicate } from 'react-icons/hi';
import { HiScale } from 'react-icons/hi2';

//função principal
export default function Home() {
  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <span className="font-semibold">Menu</span>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto max-w-7xl w-full">

        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight mb-2">Junta de Recursos Fiscais</h1>
          <p className="text-sm text-muted-foreground">
            Conjunto de funcionalidades disponíveis para a realização das atividades da JURFIS/SEFAZ
          </p>
        </div>

        {/* Menu de opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">

          {/* Card Calendário */}
          <Link href="/calendario" className="group">
            <Card className="h-full transition-all hover:shadow-md p-6 gap-3">
              <CardHeader className="p-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                    <IoCalendar className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">Calendário</CardTitle>
                </div>
                <CardDescription>
                  Listagem de reuniões da Sala Alberto Kalachi (Sala 05)
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Visualização de agendamentos</li>
                  <li>• Novas solicitações</li>
                  <li>• Controle de reuniões</li>
                  <li>• Feedback para usuários</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Card Chat de Atendimento */}
          <Card className="h-full relative opacity-60 p-6 gap-3">
            <div className="absolute top-3 right-3 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-md">
              Em breve
            </div>
            <CardHeader className="p-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <IoChatbubbles className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Chat de Atendimento</CardTitle>
              </div>
              <CardDescription>
                Sistema de atendimento via WhatsApp
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Integração com WhatsApp</li>
                <li>• Marcadores inteligentes</li>
                <li>• Atendimento automático</li>
                <li>• Interface amigável</li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Controle de Recursos */}
          <Card className="h-full relative opacity-60 p-6 gap-3">
            <div className="absolute top-3 right-3 bg-muted text-muted-foreground text-xs font-medium px-2 py-1 rounded-md">
              Em breve
            </div>
            <CardHeader className="p-0">
              <div className="flex items-center gap-4 mb-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted">
                  <HiScale className="h-6 w-6 text-foreground" />
                </div>
                <CardTitle className="text-xl">Controle de Recursos</CardTitle>
              </div>
              <CardDescription>
                Sistema operacional de recursos administrativos
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>• Controle de protocolos e prazos</li>
                <li>• Planejamento de pautas de julgamento</li>
                <li>• Notificações automáticas</li>
                <li>• Gerenciamento de julgamentos e decisões</li>
              </ul>
            </CardContent>
          </Card>

          {/* Card Gestão de Horas Extras */}
          <Link href="/horas-extras" className="group">
            <Card className="h-full transition-all hover:shadow-md p-6 gap-3">
              <CardHeader className="p-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                    <IoTime className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">Horas Extras</CardTitle>
                </div>
                <CardDescription>
                  Controle de banco de horas dos servidores
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Listagem dos servidores</li>
                  <li>• Saldo de banco de horas</li>
                  <li>• Histórico mensal</li>
                  <li>• Upload de folhas mensais</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Card Mesclar PDF */}
          <Link href="/mesclar" className="group">
            <Card className="h-full transition-all hover:shadow-md p-6 gap-3">
              <CardHeader className="p-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                    <HiDocumentDuplicate className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">Mesclar PDF</CardTitle>
                </div>
                <CardDescription>
                  Combine múltiplos arquivos PDF em um único documento
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload de múltiplos PDFs</li>
                  <li>• Reorganização da ordem dos arquivos</li>
                  <li>• Limitação de tamanho por arquivo</li>
                  <li>• Mesclagem em um único arquivo</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

          {/* Card Anonimizar PDF */}
          <Link href="/anonimizar" className="group">
            <Card className="h-full transition-all hover:shadow-md p-6 gap-3">
              <CardHeader className="p-0">
                <div className="flex items-center gap-4 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted transition-transform group-hover:scale-110">
                    <IoLockClosed className="h-6 w-6 text-foreground" />
                  </div>
                  <CardTitle className="text-xl">Anonimizar PDF</CardTitle>
                </div>
                <CardDescription>
                  Extraia páginas específicas, mescle com acórdãos e anonimize informações sensíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• Upload de PDF e seleção de páginas</li>
                  <li>• Busca e mesclagem automática de arquivos</li>
                  <li>• Anonimização interativa com seleção de áreas</li>
                  <li>• Download do arquivo processado</li>
                </ul>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
      </div>
    </>
  );
};