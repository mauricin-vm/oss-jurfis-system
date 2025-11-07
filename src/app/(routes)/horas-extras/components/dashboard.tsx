'use client'

import { OvertimeStats } from '../types';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface DashboardProps {
  stats: OvertimeStats;
  selectedYear: number | null;
}

export function Dashboard({ stats, selectedYear }: DashboardProps) {
  const yearLabel = selectedYear !== null ? `Ano de ${selectedYear}` : 'Todos os anos';

  // Converter decimal para HH:MM
  const convertDecimalToTime = (decimal: number): string => {
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);
    const hours = Math.floor(absDecimal);
    const minutes = Math.round((absDecimal - hours) * 60);
    return `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  return (
    <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
      {/* Card Horas Extras */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
        <div className="text-sm text-muted-foreground mb-4">Total Horas Extras</div>
        <div className="text-3xl font-bold mb-3 text-green-600">
          +{convertDecimalToTime(stats.totalExtraHours)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-green-600" />
            <span>Acumulando horas positivas</span>
          </div>
          <div className="text-xs text-muted-foreground">
            {yearLabel}
          </div>
        </div>
      </div>

      {/* Card Atrasos */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
        <div className="text-sm text-muted-foreground mb-4">Total Atrasos</div>
        <div className="text-3xl font-bold mb-3 text-red-600">
          -{convertDecimalToTime(stats.totalLateHours)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm font-medium">
            {stats.totalLateHours > 0 ? (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                <span>Requer atenção</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-green-600" />
                <span>Sem atrasos</span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {yearLabel}
          </div>
        </div>
      </div>

      {/* Card Saldo Acumulado */}
      <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4 sm:p-6">
        <div className="text-sm text-muted-foreground mb-4">Saldo Acumulado</div>
        <div className={`text-3xl font-bold mb-3 ${stats.currentBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
          {stats.currentBalance >= 0 ? '+' : ''}{convertDecimalToTime(stats.currentBalance)}
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-sm font-medium">
            {stats.currentBalance >= 0 ? (
              <>
                <TrendingUp className="h-3.5 w-3.5 text-blue-600" />
                <span>Saldo positivo</span>
              </>
            ) : (
              <>
                <TrendingDown className="h-3.5 w-3.5 text-orange-600" />
                <span>Saldo negativo</span>
              </>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.currentBalance >= 0 ? 'Mantendo bom desempenho' : 'Necessário compensação'}
          </div>
        </div>
      </div>
    </div>
  );
}
