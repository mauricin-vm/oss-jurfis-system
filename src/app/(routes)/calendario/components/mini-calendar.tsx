'use client'

import { useState } from 'react';

interface Meeting {
  id: string;
  date: Date | string;
  [key: string]: any;
}

interface MiniCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  meetings?: Meeting[];
}

export function MiniCalendar({ selectedDate, onDateChange, meetings = [] }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    // Dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        day: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        isPrevMonth: true
      })
    );

    // Dias do mês atual
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        isPrevMonth: false
      })
    );

    // Dias do próximo mês para completar a grade
    const totalDays = prevMonthDays.length + currentMonthDays.length;
    const remainingDays = totalDays % 7 === 0 ? 0 : 7 - (totalDays % 7);
    const nextMonthDays = Array.from(
      { length: remainingDays },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: false,
        isPrevMonth: false
      })
    );

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const allDays = getDaysInMonth(currentMonth);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (day: number, isPrevMonth: boolean, isCurrentMonth: boolean) => {
    let newDate: Date;
    if (isPrevMonth) {
      // Mês anterior
      newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, day);
    } else if (isCurrentMonth) {
      // Mês atual
      newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    } else {
      // Próximo mês
      newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, day);
    }
    onDateChange(newDate);
  };

  const isToday = (day: number, isPrevMonth: boolean, isCurrentMonth: boolean) => {
    const today = new Date();
    let checkMonth = currentMonth.getMonth();

    if (isPrevMonth) {
      checkMonth = currentMonth.getMonth() - 1;
    } else if (!isCurrentMonth) {
      checkMonth = currentMonth.getMonth() + 1;
    }

    return (
      day === today.getDate() &&
      checkMonth === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number, isPrevMonth: boolean, isCurrentMonth: boolean) => {
    let checkMonth = currentMonth.getMonth();

    if (isPrevMonth) {
      checkMonth = currentMonth.getMonth() - 1;
    } else if (!isCurrentMonth) {
      checkMonth = currentMonth.getMonth() + 1;
    }

    return (
      day === selectedDate.getDate() &&
      checkMonth === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const hasEvent = (day: number, isPrevMonth: boolean, isCurrentMonth: boolean) => {
    if (!meetings || meetings.length === 0) return false;

    let checkMonth = currentMonth.getMonth();
    let checkYear = currentMonth.getFullYear();

    if (isPrevMonth) {
      checkMonth = currentMonth.getMonth() - 1;
      if (checkMonth < 0) {
        checkMonth = 11;
        checkYear--;
      }
    } else if (!isCurrentMonth) {
      checkMonth = currentMonth.getMonth() + 1;
      if (checkMonth > 11) {
        checkMonth = 0;
        checkYear++;
      }
    }

    return meetings.some(meeting => {
      const meetingDate = new Date(meeting.date);
      return (
        meetingDate.getDate() === day &&
        meetingDate.getMonth() === checkMonth &&
        meetingDate.getFullYear() === checkYear
      );
    });
  };

  const monthYear = currentMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).split(' de ');

  const formattedDate = `${monthYear[0].charAt(0).toUpperCase() + monthYear[0].slice(1)}/${monthYear[1]}`;

  return (
    <div className="pb-3">
      {/* Header */}
      <div className="flex h-8 shrink-0 items-center rounded-md px-2 mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1 hover:bg-sidebar-accent rounded transition-colors cursor-pointer -ml-1"
          aria-label="Mês anterior"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-xs font-medium text-sidebar-foreground/70 pl-1 pr-2 flex-1 text-center">
          {formattedDate}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1 hover:bg-sidebar-accent rounded transition-colors cursor-pointer"
          aria-label="Próximo mês"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2 px-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-sidebar-foreground/50">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1 px-2">
        {allDays.map((dayObj, i) => {
          const { day, isCurrentMonth, isPrevMonth } = dayObj;
          const selected = isSelected(day, isPrevMonth, isCurrentMonth);
          const today = isToday(day, isPrevMonth, isCurrentMonth);
          const hasEventOnDay = hasEvent(day, isPrevMonth, isCurrentMonth);

          return (
            <button
              key={i}
              onClick={() => handleDateClick(day, isPrevMonth, isCurrentMonth)}
              className={`
                relative p-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer
                ${!isCurrentMonth ? 'text-sidebar-foreground/30' : ''}
                ${selected ? 'bg-sidebar-primary text-sidebar-primary-foreground font-semibold shadow-sm' : ''}
                ${today && !selected ? 'ring-2 ring-sidebar-ring ring-inset font-medium' : ''}
                ${!selected && !today && isCurrentMonth ? 'hover:bg-sidebar-accent text-sidebar-foreground' : ''}
                ${!selected && !today && !isCurrentMonth ? 'hover:bg-sidebar-accent/50' : ''}
              `}
            >
              {day}
              {hasEventOnDay && (
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-current opacity-70" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
