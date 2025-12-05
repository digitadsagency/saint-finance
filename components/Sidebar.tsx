'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { 
  LayoutDashboard,
  Calendar,
  BarChart3,
  FolderOpen,
  Users,
  Settings,
  LogOut,
  Menu,
  X,
  FileText
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SidebarProps {
  workspaceId: string
}

export function Sidebar({ workspaceId }: SidebarProps) {
  const router = useRouter()
  const pathname = usePathname()
  const { user, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    // Update main content margin when sidebar collapses
    const mainContent = document.querySelector('.main-content')
    if (mainContent) {
      if (isCollapsed) {
        mainContent.classList.remove('ml-64')
        mainContent.classList.add('ml-16')
      } else {
        mainContent.classList.remove('ml-16')
        mainContent.classList.add('ml-64')
      }
    }
  }, [isCollapsed])

  const isActive = (path: string) => {
    return pathname === path || pathname?.startsWith(path + '/')
  }

  const mainNavItems = [
    {
      icon: LayoutDashboard,
      label: 'Dashboard',
      path: `/workspaces/${workspaceId}/dashboard`
    },
    {
      icon: FileText,
      label: 'Logs Diarios',
      path: `/workspaces/${workspaceId}/daily-logs`
    }
  ]

  const secondaryNavItems = [
    {
      icon: FolderOpen,
      label: 'Clientes',
      path: `/workspaces/${workspaceId}/clients`
    }
  ]

  const handleLogout = () => {
    logout()
    router.push('/sign-in')
  }

  return (
    <div className={cn(
      "fixed left-0 top-0 h-screen bg-white border-r border-gray-200 transition-all duration-300 z-50 flex flex-col",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
        {!isCollapsed && (
          <h2 className="text-lg font-semibold text-gray-900">MiniMonday</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="ml-auto"
        >
          {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto py-4">
        {/* Main Navigation */}
        <div className="px-2 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Principal
            </div>
          )}
          {mainNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                )} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}
        </div>

        {/* Secondary Navigation */}
        <div className="mt-6 px-2 space-y-1">
          {!isCollapsed && (
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              Gestión
            </div>
          )}
          {secondaryNavItems.map((item) => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                href={item.path}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                  active
                    ? "bg-blue-50 text-blue-700 font-medium"
                    : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={cn(
                  "h-5 w-5 flex-shrink-0",
                  active ? "text-blue-600" : "text-gray-500 group-hover:text-gray-700"
                )} />
                {!isCollapsed && <span className="text-sm">{item.label}</span>}
              </Link>
            )
          })}
          <Link
            href={`/workspaces/${workspaceId}/finance`}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
              isActive(`/workspaces/${workspaceId}/finance`)
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? 'Finanzas' : undefined}
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            {!isCollapsed && <span className="text-sm">Finanzas</span>}
          </Link>
          <Link
            href={`/workspaces/${workspaceId}/finance/metrics`}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
              isActive(`/workspaces/${workspaceId}/finance/metrics`)
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? 'Métricas' : undefined}
          >
            <BarChart3 className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            {!isCollapsed && <span className="text-sm">Métricas</span>}
          </Link>
          <Link
            href={`/workspaces/${workspaceId}/finance/payments-calendar`}
            className={cn(
              "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
              isActive(`/workspaces/${workspaceId}/finance/payments-calendar`)
                ? "bg-blue-50 text-blue-700 font-medium"
                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            )}
            title={isCollapsed ? 'Calendario de Pagos' : undefined}
          >
            <Calendar className="h-5 w-5 flex-shrink-0 text-gray-500 group-hover:text-gray-700" />
            {!isCollapsed && <span className="text-sm">Calendario de Pagos</span>}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        {!isCollapsed && user && (
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-medium">
              {user.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">{user.name}</p>
              <p className="text-xs text-gray-500 truncate">{user.email}</p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          className="w-full justify-start"
          onClick={handleLogout}
          title={isCollapsed ? "Cerrar sesión" : undefined}
        >
          <LogOut className="h-4 w-4 mr-2" />
          {!isCollapsed && <span>Cerrar sesión</span>}
        </Button>
      </div>
    </div>
  )
}
