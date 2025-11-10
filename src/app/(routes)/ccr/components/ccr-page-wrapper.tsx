'use client';

import React, { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { MdLock } from 'react-icons/md';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface CCRPageWrapperProps {
  children: ReactNode;
  title: string;
  breadcrumbs?: BreadcrumbItem[];
}

export function CCRPageWrapper({ children, title, breadcrumbs }: CCRPageWrapperProps) {
  const { data: session, status } = useSession();

  const isLoggedIn = !!session;
  const isCheckingSession = status === 'loading';
  const userOrganization = session?.user?.organizationName;
  const hasAccess = userOrganization === 'Junta de Recursos Fiscais';

  // Se breadcrumbs customizados não foram fornecidos, usar o padrão
  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Menu', href: '/' },
    { label: 'CCR', href: '/ccr' },
    { label: title }
  ];

  const currentBreadcrumbs = breadcrumbs || defaultBreadcrumbs;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <div className="flex items-center gap-2 text-sm">
            {currentBreadcrumbs.map((breadcrumb, index) => (
              <React.Fragment key={index}>
                {index > 0 && <span className="text-muted-foreground">/</span>}
                {breadcrumb.href ? (
                  <Link href={breadcrumb.href} className="text-muted-foreground hover:text-foreground transition-colors">
                    {breadcrumb.label}
                  </Link>
                ) : (
                  <span className="font-semibold">{breadcrumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <div className="flex-1 overflow-auto">
        {isCheckingSession ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Carregando...</p>
          </div>
        ) : !isLoggedIn || !hasAccess ? (
          <div className="flex h-full items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <MdLock className="text-5xl text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-2">
                Apenas usuários da <strong>Junta de Recursos Fiscais</strong> têm acesso ao sistema CCR.
              </p>
              {isLoggedIn && userOrganization && (
                <p className="text-sm text-muted-foreground">
                  Sua organização: <strong>{userOrganization}</strong>
                </p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4 p-4 pt-0">
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
