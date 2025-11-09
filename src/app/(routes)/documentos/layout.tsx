'use client'

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import { HiDocumentDuplicate } from 'react-icons/hi';
import { MdContentCut } from 'react-icons/md';
import { IoLockClosed } from 'react-icons/io5';

export default function DocumentosLayout({ children }: { children: React.ReactNode }) {
  const { setConfig } = useSidebarConfig();
  const pathname = usePathname();

  // Determinar seção ativa baseada na rota
  const activeSection = pathname.includes('/dividir')
    ? 'dividir'
    : pathname.includes('/anonimizar')
    ? 'anonimizar'
    : 'mesclar';

  // Determinar título da seção
  const sectionTitle = activeSection === 'dividir'
    ? 'Dividir'
    : activeSection === 'anonimizar'
    ? 'Anonimizar'
    : 'Mesclar';

  // Configurar sidebar com seções personalizadas
  useEffect(() => {
    setConfig({
      showAppSwitcher: true,
      showUserAuth: true,
      customActions: [],
      customContent: null,
      customSections: [
        {
          title: 'Ferramentas',
          items: [
            {
              label: 'Mesclar',
              icon: HiDocumentDuplicate,
              href: '/documentos/mesclar',
              active: activeSection === 'mesclar',
            },
            {
              label: 'Dividir',
              icon: MdContentCut,
              href: '/documentos/dividir',
              active: activeSection === 'dividir',
            },
            {
              label: 'Anonimizar',
              icon: IoLockClosed,
              href: '/documentos/anonimizar',
              active: activeSection === 'anonimizar',
            },
          ],
        },
      ],
    });
  }, [setConfig, activeSection, pathname]);

  return (
    <>
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm">
            <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
              Menu
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-semibold">{sectionTitle}</span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      {children}
    </>
  );
}
