'use client'

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { MiniCalendar } from './mini-calendar';
import { LoginModal } from './login-modal';
import { RegisterModal } from './register-modal';
import { useToast } from './toast-context';

interface SidebarProps {
  isAdmin: boolean;
  userName?: string | null;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  onNewMeeting: () => void;
  onRequestMeeting: () => void;
  onPendingRequests: () => void;
  refreshTrigger?: number;
}

export function Sidebar({
  isAdmin,
  userName,
  selectedDate,
  onDateChange,
  onNewMeeting,
  onRequestMeeting,
  onPendingRequests,
  refreshTrigger
}: SidebarProps) {
  const { addToast } = useToast();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Carregar contagem de solicitações pendentes
  useEffect(() => {
    if (isAdmin) {
      loadPendingCount();
      // Atualizar a cada 30 segundos
      const interval = setInterval(loadPendingCount, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, refreshTrigger]);

  const loadPendingCount = async () => {
    try {
      const response = await fetch('/api/meetings/requests');
      const data = await response.json();
      if (data.success) {
        setPendingCount(data.requests.length);
      }
    } catch (error) {
      console.error('Erro ao carregar contagem de pendências:', error);
    }
  };

  const handleLogout = async () => {
    await signOut({ redirect: false });
    addToast('Logout realizado com sucesso!', 'success');
    // A sessão será atualizada automaticamente pelo NextAuth
    // e o calendário recarregará via useEffect
  };

  return (
    <>
      <div className="w-72 bg-white border-r border-gray-200 shadow-sm flex-shrink-0 overflow-y-auto">
        <div className="space-y-4 h-full flex flex-col">
          {/* Mini Calendário */}
          <div className="border-b">
            <MiniCalendar
              selectedDate={selectedDate}
              onDateChange={onDateChange}
            />
          </div>

          {/* Área de usuário - apenas se admin */}
          {isAdmin && (
            <div className="border-b pb-4 px-4">
              <div className="space-y-3">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-600 font-medium mb-1">Modo Administrador</p>
                  <p className="text-sm text-gray-900 font-semibold">{userName}</p>
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

          {/* Ações */}
          <div className="space-y-2 flex-1 px-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Ações</h3>

            {isAdmin ? (
              <div className="space-y-2">
                <button
                  onClick={onNewMeeting}
                  className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
                >
                  Nova Reunião
                </button>
                <button
                  onClick={onPendingRequests}
                  className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer relative"
                >
                  <span>Solicitações Pendentes</span>
                  {pendingCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center animate-pulse">
                      {pendingCount}
                    </span>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
                >
                  Fazer Login
                </button>
                <button
                  onClick={onRequestMeeting}
                  className="w-full px-3 py-2 text-sm text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer"
                >
                  Solicitar Agendamento
                </button>
              </div>
            )}
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

      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => setIsRegisterModalOpen(true)}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </>
  );
}
