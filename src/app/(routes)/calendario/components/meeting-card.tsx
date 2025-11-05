'use client'

import { Meeting } from '../types';

interface MeetingCardProps {
  meeting: Meeting;
  isAdmin: boolean;
  colorIndex: number;
  onEdit?: (meeting: Meeting) => void;
  onDelete?: (id: string) => void;
}

// Função para calcular a duração em horas
function calculateDuration(startTime: string, endTime: string): number {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return (endMinutes - startMinutes) / 60; // Retorna duração em horas
}

export function MeetingCard({ meeting, isAdmin, colorIndex, onEdit, onDelete }: MeetingCardProps) {
  const duration = calculateDuration(meeting.startTime, meeting.endTime);
  const heightInPx = duration * 80; // 80px por hora (min-h-[80px] de cada célula)

  // Considerar cards com menos de 1 hora como "pequenos"
  const isSmallCard = duration < 1;

  // Cores alternadas por índice dentro da coluna (0=cor1, 1=cor2, 2=cor1, 3=cor2...)
  const isColorA = colorIndex % 2 === 0;

  // Cores padrão com melhor contraste
  const colorClasses = isAdmin
    ? isColorA
      ? 'bg-blue-100 border-blue-400 hover:shadow-md hover:border-blue-500 hover:z-20'
      : 'bg-amber-100 border-amber-400 hover:shadow-md hover:border-amber-500 hover:z-20'
    : isColorA
      ? 'bg-cyan-100 border-cyan-400 hover:shadow-md hover:border-cyan-500 hover:z-20'
      : 'bg-pink-100 border-pink-400 hover:shadow-md hover:border-pink-500 hover:z-20';

  return (
    <div
      className={`
        absolute left-2 right-2 top-2 z-10
        border rounded-lg transition-all duration-200 overflow-hidden
        flex flex-col items-center justify-center
        ${colorClasses}
        ${isSmallCard ? 'p-2' : 'p-3'}
      `}
      style={{ height: `${heightInPx - 4}px` }}
    >
      <div className="text-center w-full">
        <h4 className={`font-semibold text-gray-900 ${isSmallCard ? 'text-xs truncate' : 'text-sm'}`}>
          {isAdmin ? meeting.title : 'Reunião'}
        </h4>
        <p className={`text-gray-600 ${isSmallCard ? 'text-[10px] mt-0.5' : 'text-xs mt-1'}`}>
          {meeting.startTime} - {meeting.endTime}
        </p>

        {/* Só mostrar detalhes adicionais se for admin E não for card pequeno */}
        {isAdmin && !isSmallCard && (
          <div className="mt-2 space-y-1 text-xs text-gray-600 text-left max-h-[120px] overflow-y-auto">
            {meeting.contacts && (
              <p className="truncate">
                <span className="font-medium">Contato:</span> {meeting.contacts}
              </p>
            )}
            {meeting.notes && (
              <p className="line-clamp-2">
                <span className="font-medium">Obs:</span> {meeting.notes}
              </p>
            )}
          </div>
        )}
      </div>

      {isAdmin && (
        <div className={`absolute ${isSmallCard ? 'top-1 right-1' : 'top-2 right-2'} flex flex-col gap-1`}>
          <button
            onClick={() => onEdit?.(meeting)}
            className={`text-blue-600 hover:bg-blue-200/70 rounded transition-colors cursor-pointer ${isSmallCard ? 'p-0.5' : 'p-1.5'}`}
            title="Editar"
          >
            <svg className={isSmallCard ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete?.(meeting.id)}
            className={`text-red-600 hover:bg-red-200/70 rounded transition-colors cursor-pointer ${isSmallCard ? 'p-0.5' : 'p-1.5'}`}
            title="Excluir"
          >
            <svg className={isSmallCard ? 'w-3 h-3' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
