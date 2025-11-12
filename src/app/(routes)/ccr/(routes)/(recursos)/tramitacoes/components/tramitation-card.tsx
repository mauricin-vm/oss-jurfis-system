'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Calendar, CheckCircle, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Tramitation {
  id: string;
  processNumber: string;
  purpose: string;
  status: string;
  requestDate: Date;
  deadline?: Date | null;
  returnDate?: Date | null;
  observations?: string | null;
  destination?: string | null;
  protocol?: {
    id: string;
    number: string;
    presenter: string;
  } | null;
  sector?: {
    id: string;
    name: string;
    abbreviation?: string | null;
  } | null;
  member?: {
    id: string;
    name: string;
    role?: string | null;
  } | null;
  resource?: {
    id: string;
    processNumber: string;
  } | null;
  createdByUser: {
    id: string;
    name: string;
  };
}

interface TramitationCardProps {
  tramitation: Tramitation;
  onMarkAsReceived?: (id: string) => void;
  onDelete?: (id: string, processNumber: string) => void;
  userRole?: string;
}

const purposeLabels: Record<string, string> = {
  SOLICITAR_PROCESSO: 'Solicitar Processo',
  CONTRARRAZAO: 'Contrarrazão',
  PARECER_PGM: 'Parecer PGM',
  JULGAMENTO: 'Julgamento',
  DILIGENCIA: 'Diligência',
  OUTRO: 'Outro',
};

export function TramitationCard({ tramitation, onMarkAsReceived, onDelete, userRole }: TramitationCardProps) {
  const [loading, setLoading] = useState(false);
  const canDelete = userRole === 'ADMIN';

  const handleMarkAsReceived = async () => {
    if (onMarkAsReceived) {
      setLoading(true);
      try {
        await onMarkAsReceived(tramitation.id);
      } finally {
        setLoading(false);
      }
    }
  };

  // Determinar destino
  const destination = tramitation.sector
    ? tramitation.sector.abbreviation || tramitation.sector.name
    : tramitation.member
    ? tramitation.member.name
    : tramitation.destination || 'Não especificado';

  // Verificar se está vencida
  const isOverdue =
    tramitation.status === 'PENDENTE' &&
    tramitation.deadline &&
    new Date(tramitation.deadline) < new Date();

  return (
    <Card className="p-4">
      <div className="space-y-3">
        {/* Header com número do processo e ação/status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {tramitation.resource ? (
              <Link
                href={`/ccr/recursos/${tramitation.resource.id}`}
                className="text-lg font-bold text-blue-600 hover:text-blue-800 hover:underline transition-colors"
              >
                {tramitation.processNumber}
              </Link>
            ) : (
              <span className="text-lg font-bold text-gray-900">
                {tramitation.processNumber}
              </span>
            )}
          </div>

          {/* Status ou Ação */}
          {tramitation.status === 'PENDENTE' ? (
            <div className="flex items-center gap-2">
              {isOverdue && (
                <Badge className="text-xs font-semibold border bg-red-100 text-red-800 border-red-300 hover:bg-red-100">
                  Vencida
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={handleMarkAsReceived}
                disabled={loading}
                className="cursor-pointer"
              >
                <CheckCircle className="h-4 w-4 mr-1.5" />
                Marcar Entregue
              </Button>
              {canDelete && onDelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onDelete(tramitation.id, tramitation.processNumber)}
                  className="cursor-pointer h-8 w-8 p-0"
                >
                  <Trash2 className="h-4 w-4 text-red-600" />
                </Button>
              )}
            </div>
          ) : (
            <Badge className="text-xs font-semibold border bg-green-100 text-green-800 border-green-300 hover:bg-green-100">
              Entregue
            </Badge>
          )}
        </div>

        {/* Fluxo: Origem → Destino */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Building2Icon className="h-4 w-4" />
            <span className="font-medium">
              {tramitation.sector?.abbreviation || 'JURFIS'}
            </span>
          </div>
          <ArrowRight className="h-4 w-4 text-gray-400" />
          <span className="font-medium text-gray-900">{destination}</span>
        </div>

        {/* Apresentante/Contribuinte */}
        {tramitation.protocol?.presenter && (
          <div className="flex items-center gap-1.5 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>
              <span className="font-medium">Apresentante:</span>{' '}
              {tramitation.protocol.presenter}
            </span>
          </div>
        )}

        {/* Finalidade/Observações */}
        {tramitation.observations && (
          <p className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
            {tramitation.observations}
          </p>
        )}

        {/* Informações adicionais (datas e responsável) */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>
              Enviado: {format(new Date(tramitation.requestDate), 'dd/MM/yyyy', { locale: ptBR })}
            </span>
          </div>
          {tramitation.deadline && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span className={cn(isOverdue && 'text-red-600 font-medium')}>
                Prazo: {format(new Date(tramitation.deadline), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
          {tramitation.status === 'ENTREGUE' && tramitation.returnDate && (
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5 text-green-600" />
              <span className="text-green-600 font-medium">
                Entregue em: {format(new Date(tramitation.returnDate), 'dd/MM/yyyy', { locale: ptBR })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1">
            <span>Por:</span>
            <span className="font-medium">{tramitation.createdByUser.name}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}

// Ícone de prédio
function Building2Icon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
      <path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
      <path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
      <path d="M10 6h4" />
      <path d="M10 10h4" />
      <path d="M10 14h4" />
      <path d="M10 18h4" />
    </svg>
  );
}
