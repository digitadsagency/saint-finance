'use client'

import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useMemo } from 'react'
import { useWorkspaceData } from '@/lib/hooks/useWorkspaceData'
import { parseLocalDateFromYMD } from '@/lib/time'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StatsCard } from '@/components/StatsCard'
import { DashboardQuickActions } from '@/components/DashboardQuickActions'
import { InteractiveModal } from '@/components/InteractiveModal'
import { ClientCreationModal } from '@/components/ProjectCreationModal'
import {
  Plus,
  Users,
  FolderOpen,
  CheckSquare,
  Clock,
  AlertCircle,
  Calendar,
  BarChart3,
  CalendarDays,
  User,
  List,
  DollarSign,
  Bell
} from 'lucide-react'

export default function WorkspaceDashboard({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [activeModal, setActiveModal] = useState<string | null>(null)
  const [showClientCreation, setShowClientCreation] = useState(false)
  const [billings, setBillings] = useState<any[]>([])
  
  // Use optimized hook for data loading
  const { users, tasks, projects: clients, loading: loadingData, refetch } = useWorkspaceData(params.id)
  
  const isAdmin = useMemo(() => {
    const name = (user?.name || '').toLowerCase()
    return name === 'miguel' || name === 'raul'
  }, [user])
  
  // Load billings for admin users
  useEffect(() => {
    if (isAdmin) {
      fetch(`/api/finance/client-billing?workspaceId=${params.id}`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setBillings(Array.isArray(data) ? data : []))
        .catch(() => setBillings([]))
    }
  }, [isAdmin, params.id])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/sign-in')
    }
  }, [user, loading, router])

  // Calculate stats from real data with memoization - MUST be before any conditional returns
  const stats = useMemo(() => {
    const now = new Date()
    const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    
    return {
      totalClients: clients.length,
      totalTasks: tasks.length,
      completedTasks: tasks.filter(task => task.status === 'done').length,
      overdueTasks: tasks.filter(task => {
        if (!task.due_date || task.status === 'done') return false
        return parseLocalDateFromYMD(task.due_date) < now
      }).length,
      thisWeekTasks: tasks.filter(task => {
        if (!task.due_date) return false
        const dueDate = parseLocalDateFromYMD(task.due_date)
        return dueDate >= now && dueDate <= weekFromNow
      }).length
    }
  }, [clients.length, tasks])

  const handleClientCreated = async (newClient: any) => {
    console.log('🔄 Client created, refreshing data...')
    // Use the optimized refetch function
    await refetch()
    alert(`✅ ¡Cliente "${newClient.name}" agregado exitosamente!`)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  // Use real data instead of mock data
  const recentTasks = tasks.slice(0, 3) // Show first 3 tasks

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent'
      case 'high': return 'priority-high'
      case 'med': return 'priority-med'
      case 'low': return 'priority-low'
      default: return 'priority-low'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'status-done'
      case 'inprogress': return 'status-inprogress'
      case 'todo': return 'status-todo'
      case 'review': return 'status-review'
      case 'backlog': return 'status-backlog'
      default: return 'status-backlog'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-semibold text-gray-900">
                Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button onClick={() => setShowClientCreation(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Clientes Activos"
            value={stats.totalClients}
            icon={FolderOpen}
            color="blue"
            description={`${stats.totalClients} clientes en curso`}
            trend={{ value: 12, isPositive: true }}
          />
          
          <StatsCard
            title="Total de Tareas"
            value={stats.totalTasks}
            icon={CheckSquare}
            color="green"
            description={`${stats.completedTasks} completadas`}
            trend={{ value: 8, isPositive: true }}
          />
          
          <StatsCard
            title="Esta Semana"
            value={stats.thisWeekTasks}
            icon={Clock}
            color="yellow"
            description="Tareas pendientes"
          />
          
          <StatsCard
            title="Tareas Vencidas"
            value={stats.overdueTasks}
            icon={AlertCircle}
            color="red"
            description="Requieren atención"
            trend={{ value: -5, isPositive: true }}
          />
        </div>


        {/* Payment Reminders - Solo para Miguel y Raúl */}
        {isAdmin && (
          <PaymentReminders billings={billings} clients={clients} workspaceId={params.id} router={router} />
        )}

        {/* Quick Actions */}
        <div className="mb-8">
          <DashboardQuickActions
            onCreateProject={() => {
              console.log('Creating new client...')
              setShowClientCreation(true)
            }}
            onViewAllProjects={() => {
              console.log('Viewing all projects...')
              setActiveModal('project')
            }}
            onManageMembers={() => {
              console.log('Managing members...')
              setActiveModal('members')
            }}
            onViewReports={() => {
              console.log('Viewing reports...')
              setActiveModal('reports')
            }}
            onSettings={() => {
              console.log('Opening settings...')
              setActiveModal('settings')
            }}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Recent Clients */}
                  <div className="bg-white rounded-lg shadow-sm border">
                    <div className="p-6 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-gray-900">Clientes Recientes</h3>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            router.push(`/workspaces/${params.id}/clients`)
                          }}
                        >
                          Ver todos
                        </Button>
                      </div>
                    </div>
                    <div className="p-6">
                      {loadingData ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                          <span className="ml-2 text-gray-600">Cargando clientes...</span>
                        </div>
                      ) : clients.length === 0 ? (
                        <div className="text-center py-8">
                          <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                          <p className="text-gray-500">No hay clientes aún</p>
                          <p className="text-sm text-gray-400">Agrega tu primer cliente para comenzar</p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {clients.slice(0, 3).map((client) => {
                            const clientTasks = tasks.filter(task => task.project_id === client.id)
                            const completedTasks = clientTasks.filter(task => task.status === 'done').length

                            return (
                              <div key={client.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                                <div className="flex-1">
                                  <h4 className="font-medium text-gray-900">{client.name}</h4>
                                  <p className="text-sm text-gray-600">{client.description}</p>
                                  <div className="flex items-center space-x-4 mt-2">
                                    <span className="text-sm text-gray-500">
                                      {completedTasks}/{clientTasks.length} tareas completadas
                                    </span>
                                    <Badge variant="outline" className="text-green-600 border-green-600">
                                      {client.status}
                                    </Badge>
                                  </div>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      console.log('Opening client:', client.id)
                                      router.push(`/workspaces/${params.id}/projects/${client.id}/clickup-list`)
                                    }}
                                  >
                                    Abrir
                                  </Button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>

          {/* Recent Tasks */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Tareas Recientes</h3>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    console.log('Viewing all tasks...')
                    setActiveModal('reports')
                  }}
                >
                  Ver todas
                </Button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {recentTasks.map((task) => (
                  <div key={task.id} className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.project}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Badge className={getPriorityColor(task.priority)}>
                          {task.priority}
                        </Badge>
                        <Badge className={getStatusColor(task.status)}>
                          {task.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">{task.assignee}</p>
                      <p className="text-xs text-gray-500">{task.dueDate}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Interactive Modals */}
      <ClientCreationModal
        isOpen={showClientCreation}
        onClose={() => setShowClientCreation(false)}
        onClientCreated={handleClientCreated}
      />
      
      <InteractiveModal
        isOpen={activeModal === 'project'}
        onClose={() => setActiveModal(null)}
        type="project"
        title="Gestión de Proyectos"
      />
      
      <InteractiveModal
        isOpen={activeModal === 'members'}
        onClose={() => setActiveModal(null)}
        type="members"
        title="Miembros del Equipo"
      />
      
      <InteractiveModal
        isOpen={activeModal === 'reports'}
        onClose={() => setActiveModal(null)}
        type="reports"
        title="Reportes y Estadísticas"
      />
      
      <InteractiveModal
        isOpen={activeModal === 'settings'}
        onClose={() => setActiveModal(null)}
        type="settings"
        title="Configuración del Workspace"
      />
    </div>
  )
}

// Componente para recordatorios de pagos
function PaymentReminders({ billings, clients, workspaceId, router }: { billings: any[], clients: any[], workspaceId: string, router: any }) {
  const formatMXN = (value: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0)
  }
  
  const getUpcomingPayments = useMemo(() => {
    const today = new Date()
    const todayDay = today.getDate()
    const daysFromNow = 7
    const upcomingPayments: any[] = []
    
    // Para cada día en los próximos 7 días, verificar si hay pagos
    for (let i = 0; i <= daysFromNow; i++) {
      const checkDate = new Date(today)
      checkDate.setDate(todayDay + i)
      const checkDay = checkDate.getDate()
      
      const paymentsOnDay = billings
        .filter(b => {
          const paymentDay = Number(b.payment_day || b.paymentDay || 0)
          if (paymentDay !== checkDay) return false
          // Solo incluir clientes activos
          const project = clients.find(p => p.id === (b.project_id || b.projectId))
          return project?.status === 'active'
        })
        .map(b => {
          const project = clients.find(p => p.id === (b.project_id || b.projectId))
          return {
            ...b,
            projectName: project?.name || 'Cliente',
            amount: Number(b.monthly_amount || b.monthlyAmountMXN || 0),
            paymentDay: Number(b.payment_day || b.paymentDay || 0),
            daysUntil: i,
            date: checkDate
          }
        })
      
      upcomingPayments.push(...paymentsOnDay)
    }
    
    return upcomingPayments.sort((a, b) => a.daysUntil - b.daysUntil)
  }, [billings, clients])
  
  if (getUpcomingPayments.length === 0) return null
  
  const totalAmount = getUpcomingPayments.reduce((sum, p) => sum + p.amount, 0)
  
  return (
    <div className="mb-8 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <Bell className="h-6 w-6 text-green-600" />
          <h3 className="text-lg font-semibold text-gray-900">Recordatorios de Pagos</h3>
          <Badge className="bg-green-100 text-green-700 border-green-300">
            Próximos 7 días
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push(`/workspaces/${workspaceId}/finance/payments-calendar`)}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Ver Calendario
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {getUpcomingPayments.slice(0, 4).map((payment, idx) => {
          const paymentId = payment.id || payment.project_id || payment.projectId || idx
          const isToday = payment.daysUntil === 0
          const isTomorrow = payment.daysUntil === 1
          
          return (
            <div
              key={paymentId}
              className={`p-4 rounded-lg border-2 ${
                isToday 
                  ? 'bg-red-50 border-red-300' 
                  : isTomorrow 
                  ? 'bg-yellow-50 border-yellow-300' 
                  : 'bg-white border-green-200'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <DollarSign className={`h-4 w-4 ${
                    isToday ? 'text-red-600' : isTomorrow ? 'text-yellow-600' : 'text-green-600'
                  }`} />
                  <span className="font-semibold text-gray-900">{payment.projectName}</span>
                </div>
                <Badge className={
                  isToday 
                    ? 'bg-red-100 text-red-700 border-red-300' 
                    : isTomorrow 
                    ? 'bg-yellow-100 text-yellow-700 border-yellow-300' 
                    : 'bg-green-100 text-green-700 border-green-300'
                }>
                  {isToday ? 'Hoy' : isTomorrow ? 'Mañana' : `En ${payment.daysUntil} días`}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Día {payment.paymentDay}</span>
                <span className={`text-lg font-bold ${
                  isToday ? 'text-red-700' : isTomorrow ? 'text-yellow-700' : 'text-green-700'
                }`}>
                  {formatMXN(payment.amount)}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      {getUpcomingPayments.length > 4 && (
        <div className="text-center pt-2 border-t border-green-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/workspaces/${workspaceId}/finance/payments-calendar`)}
            className="text-green-700 hover:text-green-800"
          >
            Ver {getUpcomingPayments.length - 4} pagos más
          </Button>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-green-200 flex items-center justify-between">
        <span className="text-sm text-gray-600">Total a recibir en los próximos 7 días:</span>
        <span className="text-xl font-bold text-green-700">{formatMXN(totalAmount)}</span>
      </div>
    </div>
  )
}
