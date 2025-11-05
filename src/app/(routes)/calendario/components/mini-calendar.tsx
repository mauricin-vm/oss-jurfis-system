'use client'

import { useState } from 'react';

interface MiniCalendarProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function MiniCalendar({ selectedDate, onDateChange }: MiniCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: startingDayOfWeek }, (_, i) => null);

  const handlePrevMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    onDateChange(newDate);
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      currentMonth.getMonth() === today.getMonth() &&
      currentMonth.getFullYear() === today.getFullYear()
    );
  };

  const isSelected = (day: number) => {
    return (
      day === selectedDate.getDate() &&
      currentMonth.getMonth() === selectedDate.getMonth() &&
      currentMonth.getFullYear() === selectedDate.getFullYear()
    );
  };

  const monthYear = currentMonth.toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric'
  }).split(' de ');

  const formattedDate = `${monthYear[0].charAt(0).toUpperCase() + monthYear[0].slice(1)}/${monthYear[1]}`;

  return (
    <div className="p-3">
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={handlePrevMonth}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h3 className="text-sm font-semibold text-gray-900">
          {formattedDate}
        </h3>
        <button
          onClick={handleNextMonth}
          className="p-1.5 hover:bg-gray-100 rounded transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Dias da semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <div key={i} className="text-center text-xs font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>

      {/* Dias do mês */}
      <div className="grid grid-cols-7 gap-1">
        {[...blanks, ...days].map((day, i) => (
          <button
            key={i}
            onClick={() => day && handleDateClick(day)}
            disabled={!day}
            className={`
              p-1.5 text-xs rounded-md transition-all duration-200 cursor-pointer
              ${!day ? 'invisible' : ''}
              ${isSelected(day as number) ? 'bg-gray-900 text-white font-semibold shadow-sm' : ''}
              ${isToday(day as number) && !isSelected(day as number) ? 'bg-gray-200 text-gray-700 font-medium' : ''}
              ${!isSelected(day as number) && !isToday(day as number) ? 'hover:bg-gray-100 text-gray-700' : ''}
            `}
          >
            {day}
          </button>
        ))}
      </div>
    </div>
  );
}
