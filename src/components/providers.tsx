'use client'

//importar bibliotecas e funções
import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react';
import { SessionProvider } from '@/contexts/session-context';
import { Toaster } from '@/components/ui/sonner';

//função principal
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <NextAuthSessionProvider>
      <SessionProvider>
        {children}
        <Toaster />
      </SessionProvider>
    </NextAuthSessionProvider>
  );
};