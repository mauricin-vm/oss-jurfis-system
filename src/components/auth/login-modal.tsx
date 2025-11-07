'use client'

import { useState, useEffect } from 'react';
import { signIn } from 'next-auth/react';
import { toast } from 'sonner';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegister?: () => void;
}

export function LoginModal({ isOpen, onClose, onOpenRegister }: LoginModalProps) {
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
      toast.warning('Email é obrigatório');
      setIsLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.warning('Email inválido');
      setIsLoading(false);
      return;
    }

    if (!password.trim()) {
      toast.warning('Senha é obrigatória');
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
        toast.error('Email ou senha inválidos');
      } else {
        toast.success('Login realizado com sucesso!');
        handleClose();
        // A sessão será atualizada automaticamente pelo NextAuth
        // e o calendário recarregará via useEffect
      }
    } catch {
      toast.error('Erro ao fazer login');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen && !isClosing) return null;

  return (
    <div
      className={`fixed inset-0 bg-black/40 flex items-start justify-center z-50 p-4 pt-16 transition-opacity duration-200 ${isClosing ? 'opacity-0' : shouldAnimate ? 'opacity-100' : 'opacity-0'}`}
    >
      <div
        className={`bg-white rounded-lg shadow-xl max-w-md w-full transition-all duration-200 ${isClosing ? 'scale-95 opacity-0' : shouldAnimate ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Entrar na Conta</h2>
              <p className="text-sm text-gray-600 mt-1">Acesse sua conta para gerenciar as horas extras</p>
            </div>
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
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="exemplo@email.com"
                disabled={isLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Senha <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:border-gray-400 transition-colors"
                placeholder="Digite sua senha"
                disabled={isLoading}
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
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

            <div className="text-center pt-4 border-t">
              <p className="text-sm text-gray-600">
                Ainda não possui uma conta?{' '}
                <button
                  type="button"
                  onClick={() => {
                    handleClose();
                    setTimeout(() => onOpenRegister?.(), 250);
                  }}
                  disabled={isLoading}
                  className="font-semibold text-gray-900 hover:text-gray-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Clique aqui!
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
