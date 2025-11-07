"use client"

import * as React from "react"
import { ChevronsUpDown, Calendar, MessageSquare, Scale, Clock, Files, Lock } from "lucide-react"
import { usePathname } from "next/navigation"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"
import Link from "next/link"

export function AppSwitcher() {
  const { isMobile } = useSidebar()
  const pathname = usePathname()

  const apps = [
    {
      name: "Horas Extras",
      icon: Clock,
      href: "/horas-extras",
    },
    {
      name: "Calendário",
      icon: Calendar,
      href: "/calendario",
    },
    {
      name: "Chat de Atendimento",
      icon: MessageSquare,
      href: "/chat",
    },
    {
      name: "Controle de Recursos",
      icon: Scale,
      href: "#",
      disabled: true,
    },
    {
      name: "Mesclar PDF",
      icon: Files,
      href: "/mesclar",
    },
    {
      name: "Anonimizar PDF",
      icon: Lock,
      href: "/anonimizar",
    },
  ]

  // Detectar app ativo baseado na rota
  const activeApp = apps.find(app => pathname.startsWith(app.href) && app.href !== "#") || {
    name: "Horas Extras",
    icon: Clock,
    href: "/horas-extras",
  }

  // Filtrar apps removendo o ativo
  const otherApps = apps.filter(app => app.href !== activeApp.href)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <activeApp.icon className="size-4" />
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{activeApp.name}</span>
                <span className="truncate text-xs text-muted-foreground">Controle individual</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Funcionalidades
            </DropdownMenuLabel>
            {otherApps.map((app) => (
              <React.Fragment key={app.name}>
                {app.disabled ? (
                  <DropdownMenuItem disabled className="gap-2 p-2 h-9">
                    <div className="flex size-6 items-center justify-center rounded-md border border-muted-foreground/30">
                      <app.icon className="!h-3.5 !w-3.5 shrink-0 text-muted-foreground/70" />
                    </div>
                    {app.name}
                    <span className="ml-auto text-xs text-muted-foreground">Em breve</span>
                  </DropdownMenuItem>
                ) : (
                  <Link href={app.href}>
                    <DropdownMenuItem className="gap-2 p-2 cursor-pointer h-9">
                      <div className="flex size-6 items-center justify-center rounded-md border border-muted-foreground/30">
                        <app.icon className="!h-3.5 !w-3.5 shrink-0 text-muted-foreground/70" />
                      </div>
                      {app.name}
                    </DropdownMenuItem>
                  </Link>
                )}
              </React.Fragment>
            ))}
            <DropdownMenuSeparator />
            <Link href="/">
              <DropdownMenuItem className="gap-2 p-2 cursor-pointer h-9">
                <div className="flex size-4 items-center justify-center">
                  <span className="text-sm">←</span>
                </div>
                Voltar ao Menu
              </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
