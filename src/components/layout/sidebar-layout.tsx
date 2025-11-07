'use client'

import { usePathname } from 'next/navigation';
import { ReactNode, useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { GlobalSidebar } from './global-sidebar';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import { Loader2 } from 'lucide-react';

interface SidebarLayoutProps {
  children: ReactNode;
}

export function SidebarLayout({ children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const { status } = useSession();
  const { setConfig } = useSidebarConfig();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Rotas que NÃO usam sidebar global (usam sidebars customizadas)
  const routesWithoutGlobalSidebar = ['/chat', '/calendario'];

  // Verificar se deve mostrar sidebar global
  const shouldShowSidebar = !routesWithoutGlobalSidebar.some(route => pathname.startsWith(route));

  // Marcar como carregado após verificar sessão
  useEffect(() => {
    if (status !== 'loading') {
      setIsInitialLoad(false);
    }
  }, [status]);

  // Resetar configuração ao mudar de rota
  useEffect(() => {
    // Configuração padrão baseada na rota
    if (pathname === '/') {
      // Home page: sem AppSwitcher, apenas login/logout
      setConfig({
        showAppSwitcher: false,
        showUserAuth: true,
        customActions: [],
        customSections: [],
      });
    } else {
      // Outras rotas: com AppSwitcher e login/logout
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customActions: [],
        customSections: [],
      });
    }
  }, [pathname, setConfig]);

  // Mostrar spinner durante carregamento inicial
  if (shouldShowSidebar && isInitialLoad) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não deve mostrar sidebar, retorna apenas children
  if (!shouldShowSidebar) {
    return <>{children}</>;
  }

  return (
    <SidebarProvider>
      <GlobalSidebar onLogin={() => setShowLoginModal(true)} />
      <SidebarInset>
        {children}
      </SidebarInset>
    </SidebarProvider>
  );
}
