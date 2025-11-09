'use client'

import { signOut, useSession } from 'next-auth/react';
import { toast } from 'sonner';
import { useState } from 'react';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { AppSwitcher } from './app-switcher';
import { NavUser } from './nav-user';
import { useSidebarConfig } from '@/contexts/sidebar-context';
import { LoginModal } from '@/components/auth/login-modal';
import { RegisterModal } from '@/components/auth/register-modal';

interface GlobalSidebarProps {
  onLogin?: () => void;
}

export function GlobalSidebar({ onLogin }: GlobalSidebarProps) {
  const { data: session } = useSession();
  const { config } = useSidebarConfig();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await signOut({ redirect: false });
      toast.success('Logout realizado com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
      toast.error('Erro ao fazer logout');
    } finally {
      setIsLoggingOut(false);
    }
  };

  const handleLogin = () => {
    setIsLoginModalOpen(true);
  };

  const isLoggedIn = !!session?.user;
  const userName = session?.user?.name;
  const userEmail = session?.user?.email;
  const isAdmin = session?.user?.role === 'ADMIN';
  const organizationName = session?.user?.organizationName;
  const role = session?.user?.role;

  return (
    <Sidebar collapsible="icon">
      {/* Header com AppSwitcher (se configurado) */}
      {config.showAppSwitcher && (
        <SidebarHeader>
          <AppSwitcher />
        </SidebarHeader>
      )}

      <SidebarContent>
        {/* Custom Content (ex: Mini Calendário) */}
        {config.customContent && (
          <SidebarGroup className="group-data-[collapsible=icon]:hidden">
            {config.customContent}
          </SidebarGroup>
        )}

        {/* Custom Actions */}
        {config.customActions && config.customActions.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Ações</SidebarGroupLabel>
            <SidebarMenu>
              {config.customActions.map((action, index) => (
                <SidebarMenuItem key={index}>
                  <SidebarMenuButton
                    onClick={action.onClick}
                    className="cursor-pointer"
                  >
                    {action.icon && <action.icon className="size-4" />}
                    <span>{action.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}

        {/* Custom Sections */}
        {config.customSections && config.customSections.map((section, sectionIndex) => (
          <SidebarGroup key={sectionIndex}>
            {section.title && <SidebarGroupLabel>{section.title}</SidebarGroupLabel>}
            <SidebarMenu>
              {section.items.map((item, itemIndex) => (
                <SidebarMenuItem key={itemIndex}>
                  <SidebarMenuButton
                    onClick={item.onClick}
                    asChild={!!item.href}
                    className="cursor-pointer"
                    isActive={item.active}
                  >
                    {item.href ? (
                      <a href={item.href}>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.label}</span>
                      </a>
                    ) : (
                      <>
                        {item.icon && <item.icon className="size-4" />}
                        <span>{item.label}</span>
                      </>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        ))}
      </SidebarContent>

      {/* Footer com NavUser (se configurado) */}
      {config.showUserAuth && (
        <SidebarFooter>
          <NavUser
            userName={userName}
            userEmail={userEmail}
            isAdmin={isAdmin}
            organizationName={organizationName}
            role={role}
            onLogout={handleLogout}
            onLogin={handleLogin}
          />
        </SidebarFooter>
      )}

      {/* Modais de Login e Registro */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onOpenRegister={() => {
          setIsLoginModalOpen(false);
          setIsRegisterModalOpen(true);
        }}
      />

      <RegisterModal
        isOpen={isRegisterModalOpen}
        onClose={() => setIsRegisterModalOpen(false)}
      />
    </Sidebar>
  );
}
