'use client'

import { Button } from './ui/button'
import { Plus, FolderOpen, DollarSign, BarChart3, Calendar } from 'lucide-react'

interface DashboardQuickActionsProps {
  onCreateProject?: () => void
  onViewAllProjects?: () => void
  onFinance?: () => void
  onMetrics?: () => void
  onPaymentsCalendar?: () => void
}

export function DashboardQuickActions({
  onCreateProject,
  onViewAllProjects,
  onFinance,
  onMetrics,
  onPaymentsCalendar
}: DashboardQuickActionsProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Acciones Rápidas</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <Button
          onClick={onCreateProject}
          className="h-auto p-4 flex flex-col items-center space-y-2 bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Nuevo Cliente</div>
            <div className="text-xs opacity-90">Crear cliente</div>
          </div>
        </Button>

        <Button
          onClick={onViewAllProjects}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2"
        >
          <FolderOpen className="h-6 w-6" />
          <div className="text-center">
            <div className="font-medium">Clientes</div>
            <div className="text-xs text-gray-500">Ver todos</div>
          </div>
        </Button>

        <Button
          onClick={onFinance}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2 border-green-200 hover:bg-green-50"
        >
          <DollarSign className="h-6 w-6 text-green-600" />
          <div className="text-center">
            <div className="font-medium">Finanzas</div>
            <div className="text-xs text-gray-500">Gestión financiera</div>
          </div>
        </Button>

        <Button
          onClick={onMetrics}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2 border-purple-200 hover:bg-purple-50"
        >
          <BarChart3 className="h-6 w-6 text-purple-600" />
          <div className="text-center">
            <div className="font-medium">Métricas</div>
            <div className="text-xs text-gray-500">Análisis financiero</div>
          </div>
        </Button>

        <Button
          onClick={onPaymentsCalendar}
          variant="outline"
          className="h-auto p-4 flex flex-col items-center space-y-2 border-blue-200 hover:bg-blue-50"
        >
          <Calendar className="h-6 w-6 text-blue-600" />
          <div className="text-center">
            <div className="font-medium">Pagos</div>
            <div className="text-xs text-gray-500">Calendario</div>
          </div>
        </Button>
      </div>
    </div>
  )
}
