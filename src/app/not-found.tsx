'use client'

//importar bibliotecas e funções
import { useEffect } from 'react';
import Link from 'next/link';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { IoAlertCircle } from 'react-icons/io5';
import { useSidebarConfig } from '@/contexts/sidebar-context';

//função principal
export default function NotFound() {
  const { setConfig } = useSidebarConfig();

  // Configurar sidebar para não mostrar o AppSwitcher
  useEffect(() => {
    setConfig({
      showAppSwitcher: false,
      showUserAuth: true,
      customActions: [],
      customSections: [],
    });
  }, [setConfig]);

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
            <span className="font-semibold">404</span>
          </div>
        </div>
      </header>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="mx-auto max-w-2xl w-full h-full flex items-center justify-center">
          <div className="text-center space-y-6">
            {/* Ícone de erro */}
            <div className="flex justify-center">
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-muted">
                <IoAlertCircle className="h-12 w-12 text-muted-foreground" />
              </div>
            </div>

            {/* Mensagem de erro */}
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">404 | Página Não Encontrada</h1>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                A página que você está procurando não existe ou foi movida para outro local.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
