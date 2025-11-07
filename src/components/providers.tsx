'use client'

//importar bibliotecas e funções
import { SessionProvider } from 'next-auth/react';
import { Toaster } from '@/components/ui/sonner';

//função principal
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      {children}
      <Toaster />
    </SessionProvider>
  );
};