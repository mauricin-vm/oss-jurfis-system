'use client'

import { OvertimeStats } from '../types';
import { MdAccessTime, MdSchedule, MdAccountBalance } from 'react-icons/md';

interface DashboardProps {
  stats: OvertimeStats;
  selectedYear: number | null;
}

export function Dashboard({ stats, selectedYear }: DashboardProps) {
  const yearLabel = selectedYear !== null ? `Ano de ${selectedYear}` : 'Todos os anos';
  const balanceColor = stats.currentBalance >= 0 ? 'text-blue-600' : 'text-orange-600';
  const balanceBg = stats.currentBalance >= 0 ? 'bg-blue-50 border-blue-200' : 'bg-orange-50 border-orange-200';

  // Converter decimal para HH:MM
  const convertDecimalToTime = (decimal: number): string => {
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);
    const hours = Math.floor(absDecimal);
    const minutes = Math.round((absDecimal - hours) * 60);
    return `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      {/* Card Horas Extras */}
      <div className="bg-white border-2 border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Total Horas Extras</h3>
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <MdAccessTime className="text-2xl text-green-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-green-600">
          +{convertDecimalToTime(stats.totalExtraHours)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{yearLabel}</p>
      </div>

      {/* Card Atrasos */}
      <div className="bg-white border-2 border-red-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Total Atrasos</h3>
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <MdSchedule className="text-2xl text-red-600" />
          </div>
        </div>
        <p className="text-2xl font-bold text-red-600">
          -{convertDecimalToTime(stats.totalLateHours)}
        </p>
        <p className="text-xs text-gray-500 mt-1">{yearLabel}</p>
      </div>

      {/* Card Saldo Acumulado */}
      <div className={`bg-white border-2 rounded-lg p-4 ${balanceBg}`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-700">Saldo Acumulado</h3>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${stats.currentBalance >= 0 ? 'bg-blue-100' : 'bg-orange-100'}`}>
            <MdAccountBalance className={`text-2xl ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`} />
          </div>
        </div>
        <p className={`text-2xl font-bold ${balanceColor}`}>
          {stats.currentBalance >= 0 ? '+' : ''}{convertDecimalToTime(stats.currentBalance)}
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {stats.currentBalance >= 0 ? 'Saldo positivo' : 'Saldo negativo'}
        </p>
      </div>
    </div>
  );
}
