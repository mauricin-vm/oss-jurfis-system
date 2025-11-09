'use client'

import { useCallback, useRef } from 'react';
import { useSessionContext } from '@/contexts/session-context';
import { signOut } from 'next-auth/react';
import { toast } from 'sonner';

// Flag global para evitar múltiplos toasts de sessão expirada
let sessionExpiredToastShown = false;

export function useApi() {
  const { showLoginModal } = useSessionContext();
  const isHandlingSessionExpired = useRef(false);

  const apiFetch = useCallback(async (url: string, options?: RequestInit) => {
    try {
      const response = await fetch(url, options);

      // Se receber 401, verificar se é sessão inválida
      if (response.status === 401) {
        // Clonar a resposta para poder ler o body múltiplas vezes
        const clonedResponse = response.clone();

        try {
          const data = await clonedResponse.json();

          if (data.code === 'SESSION_INVALID' && !isHandlingSessionExpired.current) {
            isHandlingSessionExpired.current = true;

            // Fazer logout local
            await signOut({ redirect: false });

            // Mostrar toast apenas uma vez
            if (!sessionExpiredToastShown) {
              sessionExpiredToastShown = true;
              toast.error('Sessão expirada. Por favor, faça login novamente.');

              // Resetar flag após 3 segundos
              setTimeout(() => {
                sessionExpiredToastShown = false;
              }, 3000);
            }

            // Mostrar modal de login
            showLoginModal();

            // Resetar flag
            setTimeout(() => {
              isHandlingSessionExpired.current = false;
            }, 1000);

            // Retornar a resposta original (não consumida)
            return response;
          }
        } catch {
          // Se não conseguir ler o JSON, apenas retornar a resposta
          return response;
        }
      }

      return response;
    } catch (error) {
      throw error;
    }
  }, [showLoginModal]);

  return { apiFetch };
}
