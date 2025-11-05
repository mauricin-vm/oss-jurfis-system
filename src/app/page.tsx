'use client'

//importar bibliotecas e funções
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

//função principal
export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Junta de Recursos Fiscais (JURFIS/SEFAZ)</h1>
          <p className="text-sm text-gray-600">Conjunto de funcionalidades disponíveis para as realização das atividades</p>
        </div>

        {/* Menu de opções */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-7xl mx-auto">

          {/* Card Calendário JURFIS */}
          <Link href="/calendario">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-purple-200 py-4">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📅</span>
                </div>
                <CardTitle className="text-lg text-gray-900">Calendário JURFIS</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Controle de reuniões da Junta de Recursos Fiscais
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Visualização de 4 dias de agendamentos</p>
                  <p>• Seleção de data no mini calendário</p>
                  <p>• Solicitação de agendamento por email</p>
                  <p>• Gestão completa para administradores</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Chat de Atendimento */}
          <Link href="/chat">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200 py-4">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">💬</span>
                </div>
                <CardTitle className="text-lg text-gray-900">Chat de Atendimento</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Sistema de atendimento via WhatsApp com interface completa
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Integração com WhatsApp</p>
                  <p>• Conversas em tempo real</p>
                  <p>• Envio de arquivos e mensagens</p>
                  <p>• Interface estilo WhatsApp</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Gerenciamento de Recursos */}
          <Card className="h-full border-2 border-amber-200 py-4 opacity-60">
            <CardHeader className="text-center pb-3">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">📋</span>
              </div>
              <CardTitle className="text-lg text-gray-900">Gerenciamento de Recursos</CardTitle>
              <CardDescription className="text-xs text-gray-600">
                Sistema de recursos administrativos, incluindo protocolos, prazos, pautas, notificações, julgamentos e decisões
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-xs text-gray-500 space-y-0.5">
                <p>• Controle de protocolos e prazos</p>
                <p>• Gerenciamento de pautas de julgamento</p>
                <p>• Sistema de notificações automáticas</p>
                <p>• Registro de decisões e julgamentos</p>
              </div>
              <div className="mt-3 text-center">
                <span className="text-xs text-amber-600 font-medium">Em breve</span>
              </div>
            </CardContent>
          </Card>

          {/* Card Gestão de Horas Extras */}
          <Link href="/horas-extras">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-indigo-200 py-4">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">⏰</span>
                </div>
                <CardTitle className="text-lg text-gray-900">Gestão de Horas Extras</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Controle de banco de horas e anexo de folhas mensais dos servidores
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Upload de folhas mensais escaneadas</p>
                  <p>• Registro de saldo de banco de horas</p>
                  <p>• Histórico mensal de horas extras</p>
                  <p>• Controle de horas disponíveis</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Mesclar PDFs */}
          <Link href="/mesclar">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-green-200 py-4">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">📖</span>
                </div>
                <CardTitle className="text-lg text-gray-900">Mesclar PDFs</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Combine múltiplos arquivos PDF em um único documento
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Upload de múltiplos PDFs</p>
                  <p>• Reorganização da ordem dos documentos</p>
                  <p>• Limitação de tamanho por arquivo</p>
                  <p>• Mesclagem em arquivo único</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {/* Card Anonimização de PDFs */}
          <Link href="/anonimizar">
            <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow duration-200 border-2 hover:border-blue-200 py-4">
              <CardHeader className="text-center pb-3">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span className="text-2xl">🔒</span>
                </div>
                <CardTitle className="text-lg text-gray-900">Anonimização de PDFs</CardTitle>
                <CardDescription className="text-xs text-gray-600">
                  Extraia páginas específicas, mescle com acórdãos e anonimize informações sensíveis
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-gray-500 space-y-0.5">
                  <p>• Upload de PDF e seleção de páginas</p>
                  <p>• Busca e mesclagem automática de acórdãos</p>
                  <p>• Anonimização interativa com seleção de áreas</p>
                  <p>• Download do documento processado</p>
                </div>
              </CardContent>
            </Card>
          </Link>

        </div>
      </div>
    </div>
  );
};