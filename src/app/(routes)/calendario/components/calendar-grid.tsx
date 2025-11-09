'use client'

import { useState, useEffect } from 'react';
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
  const [daysToShow, setDaysToShow] = useState(4);

  // Detectar tamanho da tela e ajustar número de dias
  useEffect(() => {
    const updateDaysToShow = () => {
      if (window.innerWidth < 640) {
        setDaysToShow(1); // Mobile: 1 dia
      } else if (window.innerWidth < 1024) {
        setDaysToShow(2); // Tablet: 2 dias
      } else {
        setDaysToShow(4); // Desktop: 4 dias
      }
    };

    updateDaysToShow();
    window.addEventListener('resize', updateDaysToShow);
    return () => window.removeEventListener('resize', updateDaysToShow);
  }, []);

  // Gerar array com número dinâmico de dias
  const days = Array.from({ length: daysToShow }, (_, i) => {
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

  // Gerar grid template columns dinamicamente
  const getGridColumns = () => {
    const timeColumn = daysToShow === 1 ? '60px' : '80px';
    const dayColumns = Array(daysToShow).fill('1fr').join(' ');
    return `${timeColumn} ${dayColumns}`;
  };

  return (
    <div className="bg-card border rounded-lg shadow-sm h-full flex flex-col relative overflow-hidden">
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
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Cabeçalho com dias - sticky */}
        <div className="sticky top-0 z-30 grid border-b bg-muted" style={{ gridTemplateColumns: getGridColumns() }}>
          <div className="p-3 font-semibold text-muted-foreground text-sm text-center border-r">
            {daysToShow === 1 ? 'Hr' : 'Horário'}
          </div>
          {days.map((day, i) => {
            const { text, isToday } = formatDate(day);
            return (
              <div key={i} className={`p-3 text-center ${i < daysToShow - 1 ? 'border-r' : ''}`}>
                <div className="font-semibold text-foreground">
                  {text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Grade de horários */}
        <div>
          {HOURS.map(hour => (
            <div key={hour} className="grid border-b last:border-b-0 hover:bg-muted/40 transition-colors" style={{ gridTemplateColumns: getGridColumns() }}>
              <div className="p-3 text-sm font-medium text-muted-foreground border-r bg-muted/30 text-center">
                {hour}:00
              </div>
              {days.map((day, i) => {
                const dayMeetings = getDayMeetings(day, hour);
                return (
                  <div key={i} className={`min-h-[80px] relative bg-white ${i < daysToShow - 1 ? 'border-r' : ''}`}>
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
