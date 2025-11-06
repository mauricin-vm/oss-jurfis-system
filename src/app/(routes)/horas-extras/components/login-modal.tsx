'use client'

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { useToast } from './toast-context';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export function LoginModal({ isOpen, onClose, onOpenRegister }: LoginModalProps) {
  const { addToast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsClosing(false);
      setShouldAnimate(false);
      // Resetar formulário
      setEmail('');
      setPassword('');
      setIsLoading(false);

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setShouldAnimate(true);
        });
      });
    }
  }, [isOpen]);

  const handleClose = () => {
    if (isLoading) return; // Não permite fechar enquanto está carregando
    setIsClosing(true);
    setShouldAnimate(false);
    setTimeout(() => {
      onClose();
      setIsClosing(false);
    }, 200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validações
    if (!email.trim()) {
      addToast('Email é obrigatório', 'warning');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      addToast('Email inválido', 'warning');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      addToast('Senha é obrigatória', 'warning');
      setIsLoading(false);
      return;
    }

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        addToast('Email ou senha inválidos', 'error');
      } else {
        addToast('Login realizado com sucesso!', 'success');
        handleClose();
        // A sessão será atualizada automaticamente pelo NextAuth
        // e o calendário recarregará via useEffect
      }
    } catch {
      addToast('Erro ao fazer login', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Login de Administrador</h2>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="seu@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                type="button"
                onClick={handleClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors cursor-pointer disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg hover:bg-black transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Entrando...' : 'Entrar'}
              </button>
            </div>

            <div className="text-center pt-2 border-t">
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  setTimeout(() => onOpenRegister?.(), 250);
                }}
                disabled={isLoading}
                className="text-sm text-gray-600 hover:text-gray-900 transition-colors cursor-pointer disabled:opacity-50"
              >
                Não tem uma conta? <span className="font-semibold">Criar nova conta</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
