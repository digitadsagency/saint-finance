'use client'

import { Button } from './ui/button'
import { Plus, FolderOpen, Users, Settings, BarChart3 } from 'lucide-react'

interface DashboardQuickActionsProps {
  onCreateProject?: () => void
  onViewAllProjects?: () => void
  onManageMembers?: () => void
  onViewReports?: () => void
  onSettings?: () => void
}

export function DashboardQuickActions({
  onCreateProject,
  onViewAllProjects,
  onManageMembers,
  onViewReports,
  onSettings
}: DashboardQuickActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Button
          onClick={onCreateProject}
          className="h-auto p-4 flex flex-col items-center space-y-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Nuevo Proyecto</div>
            <div className="text-xs opacity-90">Crear proyecto</div>
          </div>
        </Button>

        <Button
          onClick={onViewAllProjects}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
        >
          <FolderOpen className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Ver Proyectos</div>
            <div className="text-xs text-gray-500">Todos los proyectos</div>
          </div>
        </Button>

        <Button
          onClick={onManageMembers}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
        >
          <Users className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Miembros</div>
            <div className="text-xs text-gray-500">Gestionar equipo</div>
          </div>
        </Button>

        <Button
          onClick={onViewReports}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
        >
          <BarChart3 className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Reportes</div>
            <div className="text-xs text-gray-500">Ver estadísticas</div>
          </div>
        </Button>

        <Button
          onClick={onSettings}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
        >
          <Settings className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Configuración</div>
            <div className="text-xs text-gray-500">Ajustes del workspace</div>
          </div>
        </Button>
      </div>
    </div>
  )
}
