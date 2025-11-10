'use client'

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode } from 'react';

export interface SidebarAction {
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?: 'default' | 'outline' | 'ghost';
}

export interface SidebarMenuItem {
  label?: string;
  icon?: React.ComponentType<{ className?: string }>;
  href?: string;
  onClick?: () => void;
  active?: boolean;
  // Para submenus colapsáveis no item
  collapsible?: boolean;
  defaultOpen?: boolean;
  subItems?: SidebarMenuItem[];
}

export interface SidebarSection {
  title?: string;
  items?: SidebarMenuItem[];
  // Para nova estrutura com menuItems
  menuItems?: SidebarMenuItem[];
  // Para submenus colapsáveis (manter compatibilidade)
  collapsible?: boolean;
  defaultOpen?: boolean;
  subItems?: SidebarMenuItem[];
}

export interface SidebarConfig {
  showAppSwitcher: boolean;
  showUserAuth: boolean;
  customActions?: SidebarAction[];
  customSections?: SidebarSection[];
  customContent?: React.ReactNode;
}

interface SidebarContextType {
  config: SidebarConfig;
  setConfig: (config: SidebarConfig) => void;
  updateConfig: (partial: Partial<SidebarConfig>) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const defaultConfig: SidebarConfig = {
  showAppSwitcher: true,
  showUserAuth: true,
  customActions: [],
  customSections: [],
  customContent: null,
};

export function SidebarConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<SidebarConfig>(defaultConfig);

  const updateConfig = useCallback((partial: Partial<SidebarConfig>) => {
    setConfig(prev => ({ ...prev, ...partial }));
  }, []);

  const value = useMemo(() => ({ config, setConfig, updateConfig }), [config, updateConfig]);

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
}

export function useSidebarConfig() {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebarConfig must be used within SidebarConfigProvider');
  }
  return context;
}
