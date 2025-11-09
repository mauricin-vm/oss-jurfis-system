'use client'

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { LoginModal } from '@/components/auth/login-modal';

interface SessionContextType {
  showLoginModal: () => void;
  hideLoginModal: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [wasAuthenticated, setWasAuthenticated] = useState(false);

  // Detectar quando sessão fica inválida após estar autenticada
  useEffect(() => {
    if (status === 'loading') return;

    if (session?.user) {
      // Usuário está autenticado
      setWasAuthenticated(true);
    } else if (wasAuthenticated && !session) {
      // Usuário estava autenticado mas agora não está mais
      // Sessão foi invalidada
      setIsLoginModalOpen(true);
      setWasAuthenticated(false);
    }
  }, [session, status, wasAuthenticated]);

  const showLoginModal = useCallback(() => {
    setIsLoginModalOpen(true);
  }, []);

  const hideLoginModal = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  const handleLoginClose = useCallback(() => {
    setIsLoginModalOpen(false);
  }, []);

  return (
    <SessionContext.Provider value={{ showLoginModal, hideLoginModal }}>
      {children}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={handleLoginClose}
      />
    </SessionContext.Provider>
  );
}

export function useSessionContext() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSessionContext deve ser usado dentro de SessionProvider');
  }
  return context;
}
