'use client';

import { useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import {
  LayoutDashboard,
  FileText,
  Search,
  ArrowRightLeft,
  Calendar,
  FileStack,
  Gavel,
  Bell,
  BookOpen,
  Users,
  Building2,
  UserCircle,
  Contact,
} from 'lucide-react';

export default function CCRLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const { setConfig } = useSidebarConfig();

  const isLoggedIn = !!session;
  const isCheckingSession = status === 'loading';
  const userOrganization = session?.user?.organizationName;
  const hasAccess = userOrganization === 'Junta de Recursos Fiscais';
  const userRole = session?.user?.role;
  const isExternal = userRole === 'EXTERNAL';

  useEffect(() => {
    // Não configurar enquanto está verificando a sessão
    if (isCheckingSession) {
      return;
    }

    // Só mostrar menu se estiver logado E for da organização correta
    if (isLoggedIn && session?.user && hasAccess) {
      // Construir subitens de Configurações baseado na role
      const configSubItems = [];

      // Assuntos, Membros e Setores - apenas para ADMIN e EMPLOYEE
      if (!isExternal) {
        configSubItems.push(
          { label: 'Assuntos', href: '/ccr/assuntos' },
          { label: 'Membros', href: '/ccr/membros' },
          { label: 'Setores', href: '/ccr/setores' }
        );
      }

      // Construir menuItems baseado na role
      const menuItems = [
        // Dashboard - item único sem colapsar
        { label: 'Dashboard', icon: LayoutDashboard, href: '/ccr' },
        // Recursos - colapsável
        {
          label: 'Recursos',
          icon: FileText,
          collapsible: true,
          defaultOpen: false,
          subItems: [
            { label: 'Protocolos', href: '/ccr/protocolos' },
            { label: 'Consultar Recursos', href: '/ccr/recursos' },
            { label: 'Tramitações', href: '/ccr/tramitacoes' },
          ],
        },
        // Sessões - colapsável
        {
          label: 'Sessões',
          icon: Calendar,
          collapsible: true,
          defaultOpen: false,
          subItems: [
            { label: 'Consultar Sessões', href: '/ccr/sessoes' },
            { label: 'Atas', href: '/ccr/sessoes/atas' },
            { label: 'Acórdãos', href: '/ccr/sessoes/acordaos' },
          ],
        },
        // Notificações - item único sem colapsar
        { label: 'Notificações', icon: Bell, href: '/ccr/notificacoes' },
      ];

      // Adicionar Configurações apenas se houver subitens (não EXTERNAL)
      if (configSubItems.length > 0) {
        menuItems.push({
          label: 'Configurações',
          icon: BookOpen,
          collapsible: true,
          defaultOpen: false,
          subItems: configSubItems,
        });
      }

      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customSections: [
        {
          title: 'Menu',
          menuItems,
        },
      ],
      customActions: [],
    });
    } else {
      // Se não estiver logado OU não for da organização correta, não mostrar menu
      setConfig({
        showAppSwitcher: true,
        showUserAuth: true,
        customActions: [],
        customSections: [],
        customContent: null,
      });
    }
  }, [isCheckingSession, isLoggedIn, session?.user, hasAccess, setConfig]);

  return <>{children}</>;
}
