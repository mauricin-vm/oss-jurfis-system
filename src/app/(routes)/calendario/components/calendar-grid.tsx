'use client'

import { Meeting } from '../types';
import { MeetingCard } from './meeting-card';

interface CalendarGridProps {
  startDate: Date;
  meetings: Meeting[];
  isAdmin: boolean;
  onEditMeeting?: (meeting: Meeting) => void;
  onDeleteMeeting?: (id: string) => void;
  isLoading?: boolean;
}

const HOURS = Array.from({ length: 11 }, (_, i) => i + 8); // 8h às 18h

export function CalendarGrid({
  startDate,
  meetings,
  isAdmin,
  onEditMeeting,
  onDeleteMeeting,
  isLoading = false
}: CalendarGridProps) {
  // Gerar array com 4 dias a partir da data inicial
  const days = Array.from({ length: 4 }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Criar mapa de índices de cor por coluna (dia)
  // Cada dia terá seus próprios índices sequenciais para alternância de cores
  const colorIndexByMeetingId = new Map<string, number>();

  days.forEach(day => {
    // Pegar todos os meetings deste dia, ordenados por horário
    const dayMeetings = meetings
      .filter(meeting => {
        const meetingDate = new Date(meeting.date);
        return meetingDate.toDateString() === day.toDateString();
      })
      .sort((a, b) => a.startTime.localeCompare(b.startTime));

    // Atribuir índice sequencial para cada meeting deste dia
    dayMeetings.forEach((meeting, index) => {
      colorIndexByMeetingId.set(meeting.id, index);
    });
  });

  const getDayMeetings = (date: Date, hour: number) => {
    return meetings.filter(meeting => {
      const meetingDate = new Date(meeting.date);
      const meetingHour = parseInt(meeting.startTime.split(':')[0]);

      return (
        meetingDate.toDateString() === date.toDateString() &&
        meetingHour === hour
      );
    });
  };

  const formatDate = (date: Date) => {
    const today = new Date();
    const isToday = date.toDateString() === today.toDateString();

    return {
      text: date.toLocaleDateString('pt-BR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short'
      }),
      isToday
    };
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm h-full flex flex-col relative">
      {/* Overlay de loading para recarregamentos */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-600 mt-3 text-sm">Atualizando...</p>
          </div>
        </div>
      )}

      {/* Container com scroll que contém tudo */}
      <div className="flex-1 overflow-y-scroll">
        {/* Cabeçalho com dias - sticky */}
        <div className="sticky top-0 z-30 grid border-b bg-gray-50" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
          <div className="p-3 font-semibold text-gray-600 text-sm text-center border-r">Horário</div>
          {days.map((day, i) => {
            const { text, isToday } = formatDate(day);
            return (
              <div key={i} className={`p-3 text-center ${i < 3 ? 'border-r' : ''}`}>
                <div className="font-semibold text-gray-900">
                  {text}
                </div>
                {isToday && (
                  <div className="text-xs text-gray-500 mt-1">Hoje</div>
                )}
              </div>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div>
          {HOURS.map(hour => (
            <div key={hour} className="grid border-b last:border-b-0 hover:bg-gray-50 transition-colors" style={{ gridTemplateColumns: '80px 1fr 1fr 1fr 1fr' }}>
              <div className="p-3 text-sm font-medium text-gray-600 border-r bg-gray-50/50 text-center">
                {hour}:00
              </div>
              {days.map((day, i) => {
                const dayMeetings = getDayMeetings(day, hour);
                return (
                  <div key={i} className={`min-h-[80px] relative ${i < 3 ? 'border-r' : ''}`}>
                    {dayMeetings.map((meeting) => (
                      <MeetingCard
                        key={meeting.id}
                        meeting={meeting}
                        isAdmin={isAdmin}
                        colorIndex={colorIndexByMeetingId.get(meeting.id) || 0}
                        onEdit={onEditMeeting}
                        onDelete={onDeleteMeeting}
                      />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
