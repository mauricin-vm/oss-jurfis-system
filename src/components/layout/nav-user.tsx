"use client"

import { ChevronsUpDown, LogOut, User } from "lucide-react"

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

interface NavUserProps {
  userName?: string | null
  userEmail?: string | null
  isAdmin: boolean
  onLogout: () => void
  onLogin: () => void
}

export function NavUser({ userName, userEmail, isAdmin, onLogout, onLogin }: NavUserProps) {
  const { isMobile } = useSidebar()

  if (!userName) {
    return (
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            size="lg"
            onClick={onLogin}
            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-accent text-sidebar-accent-foreground">
              <User className="size-4" />
            </div>
            <div className="grid flex-1 text-left leading-tight">
              <span className="truncate text-sm font-medium">Fazer Login</span>
              <span className="truncate text-xs text-muted-foreground">Acesse o sistema</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    )
  }

  // Obter iniciais do nome
  const getInitials = (name: string) => {
    const names = name.trim().split(' ')
    if (names.length >= 2) {
      return (names[0][0] + names[names.length - 1][0]).toUpperCase()
    }
    return name.substring(0, 2).toUpperCase()
  }

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
                <span className="text-xs font-semibold">{getInitials(userName)}</span>
              </div>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-sm font-medium">{userName}</span>
                <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
            collisionPadding={16}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                  <span className="text-xs font-semibold">{getInitials(userName)}</span>
                </div>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-medium">{userName}</span>
                  <span className="truncate text-xs text-muted-foreground">{userEmail}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="h-9 cursor-pointer">
              <LogOut className="mr-2 size-4" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
