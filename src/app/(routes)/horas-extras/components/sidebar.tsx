'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { useToast } from './toast-context';

interface User {
  id: string;
  name?: string;
  email: string;
}

interface SidebarProps {
  isAdmin: boolean;
  userName?: string | null;
  userEmail?: string | null;
  userId?: string | null;
  selectedYear: number | null;
  onYearChange: (year: number | null) => void;
  selectedUserId: string | null;
  onUserChange: (userId: string | null) => void;
  onNewRecord: () => void;
  onLogin: () => void;
  users: User[];
}

export function Sidebar({
  isAdmin,
  userName,
  userEmail,
  userId,
  selectedYear,
  onYearChange,
  selectedUserId,
  onUserChange,
  onNewRecord,
  onLogin,
  users
}: SidebarProps) {
  const { addToast } = useToast();
  const [years, setYears] = useState<number[]>([]);

  // Gerar lista de anos (ano atual e 4 anos anteriores)
  useEffect(() => {
    const currentYear = new Date().getFullYear();
    const yearList = [];
    for (let i = currentYear; i >= currentYear - 4; i--) {
      yearList.push(i);
    }
    setYears(yearList); // Já em ordem decrescente
  }, []);


  const handleLogout = async () => {
    await signOut({ redirect: false });
    addToast('Logout realizado com sucesso!', 'success');
  };

  return (
    <div className="w-72 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 overflow-y-auto">
      <div className="space-y-4 h-full flex flex-col">
        {/* Header */}
        <div className="border-b pb-4 px-4 pt-4">
          <h2 className="text-lg font-bold text-gray-900">Gestão de Horas Extras</h2>
          <p className="text-xs text-gray-600 mt-1">Controle de banco de horas</p>
        </div>

        {/* Área de usuário - apenas se logado */}
        {userName && (
          <div className="border-b pb-4 px-4">
            <div className="space-y-3">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-600 font-medium mb-1">
                  {isAdmin ? 'Modo Administrador' : 'Servidor'}
                </p>
                <p className="text-sm text-gray-900 font-semibold truncate">{userName}</p>
                <p className="text-xs text-gray-600 truncate">{userEmail}</p>
              </div>

              <button
                onClick={handleLogout}
                className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Sair
              </button>
            </div>
          </div>
        )}

        {/* Filtros e Ações */}
        <div className="space-y-4 flex-1 px-4">
          {/* Filtro de Servidor - apenas admin */}
          {userName && isAdmin && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Filtrar por Servidor</label>
              <select
                value={selectedUserId || userId || ''}
                onChange={(e) => onUserChange(e.target.value || null)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm cursor-pointer"
              >
                {users.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.name || user.email}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Filtro de Ano - apenas se logado */}
          {userName && (
            <div>
              <label className="block text-sm font-semibold text-gray-900 mb-2">Filtrar por Ano</label>
              <select
                value={selectedYear || 'todos'}
                onChange={(e) => onYearChange(e.target.value === 'todos' ? null : Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent text-sm cursor-pointer"
              >
                <option value="todos">Todos</option>
                {years.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          )}

          {/* Ações */}
          <div>
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Ações</h3>
            {userName ? (
              <button
                onClick={onNewRecord}
                className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Novo Registro Mensal
              </button>
            ) : (
              <button
                onClick={onLogin}
                className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
              >
                Fazer Login
              </button>
            )}
          </div>
        </div>

        {/* Footer com link voltar */}
        <div className="border-t pt-4 mt-auto px-4 pb-4">
          <Link href="/">
            <button className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">
              Voltar ao Menu
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
