'use client'

import { OvertimeRecord } from '../types';

interface RecordsTableProps {
  records: OvertimeRecord[];
  onEdit: (record: OvertimeRecord) => void;
  onDelete: (id: string) => void;
  onViewDocument: (id: string) => void;
  isAdmin: boolean;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function RecordsTable({ records, onEdit, onDelete, onViewDocument, isAdmin }: RecordsTableProps) {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  // Converter decimal para HH:MM
  const convertDecimalToTime = (decimal: number): string => {
    const isNegative = decimal < 0;
    const absDecimal = Math.abs(decimal);
    const hours = Math.floor(absDecimal);
    const minutes = Math.round((absDecimal - hours) * 60);
    return `${isNegative ? '-' : ''}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  if (records.length === 0) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <p className="text-gray-500">Nenhum registro encontrado para este ano.</p>
        <p className="text-sm text-gray-400 mt-2">Clique em "Novo Registro Mensal" para adicionar.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Mês/Ano</th>
              {isAdmin && <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Servidor</th>}
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Horas Extras</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Atrasos</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Saldo Mensal</th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Saldo Acumulado</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Documento</th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {records.map((record) => {
              const isCurrentMonth = record.month === currentMonth && record.year === currentYear;
              const balanceColor = record.balance >= 0 ? 'text-green-600' : 'text-red-600';
              const accBalanceColor = record.accumulatedBalance >= 0 ? 'text-blue-600' : 'text-orange-600';

              return (
                <tr
                  key={record.id}
                  className={`hover:bg-gray-50 transition-colors ${isCurrentMonth ? 'bg-blue-50' : ''}`}
                >
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {monthNames[record.month - 1]} / {record.year}
                    {isCurrentMonth && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                        Atual
                      </span>
                    )}
                  </td>
                  {isAdmin && (
                    <td className="px-4 py-3 text-sm text-gray-700">
                      {record.user?.name || record.user?.email || 'N/A'}
                    </td>
                  )}
                  <td className="px-4 py-3 text-sm text-right text-green-600 font-medium">
                    +{convertDecimalToTime(record.extraHours)}
                  </td>
                  <td className="px-4 py-3 text-sm text-right text-red-600 font-medium">
                    -{convertDecimalToTime(record.lateHours)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${balanceColor}`}>
                    {record.balance >= 0 ? '+' : ''}{convertDecimalToTime(record.balance)}
                  </td>
                  <td className={`px-4 py-3 text-sm text-right font-semibold ${accBalanceColor}`}>
                    {record.accumulatedBalance >= 0 ? '+' : ''}{convertDecimalToTime(record.accumulatedBalance)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {record.documentPath ? (
                      <button
                        onClick={() => onViewDocument(record.id)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 px-3 py-1 rounded transition-colors cursor-pointer inline-flex items-center gap-1 text-sm"
                        title="Ver documento"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Ver
                      </button>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => onEdit(record)}
                        className="text-blue-600 hover:bg-blue-50 p-1.5 rounded transition-colors cursor-pointer"
                        title="Editar"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(record.id)}
                        className="text-red-600 hover:bg-red-50 p-1.5 rounded transition-colors cursor-pointer"
                        title="Excluir"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
