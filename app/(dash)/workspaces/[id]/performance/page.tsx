'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  User,
  TrendingUp,
  Target,
  AlertTriangle,
  BarChart3,
  Users,
  Activity,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { parseLocalDateFromYMD } from '@/lib/time'
import { useUsers, useTasks } from '@/lib/hooks/useApiCache'

interface UserStats {
  id: string
  name: string
  avatar: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  completionRate: number
  totalEstimatedHours: number
  completedEstimatedHours: number
  recentActivity: number
}

interface TeamStats {
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  todoTasks: number
  overdueTasks: number
  totalEstimatedHours: number
  completedEstimatedHours: number
  averageCompletionRate: number
  activeUsers: number
}

export default function PerformanceDashboard({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [expandedSections, setExpandedSections] = useState<Record<string, string[]>>({})
  const [timeFilter, setTimeFilter] = useState<'all' | 'day' | 'week' | 'month' | 'custom'>('all')
  const [customDateStart, setCustomDateStart] = useState<string>('')
  const [customDateEnd, setCustomDateEnd] = useState<string>('')
  const { toasts, removeToast, success, error } = useToast()
  
  // Use optimized hooks with caching (data puede ser null inicialmente)
  const { data: usersData, loading: usersLoading } = useUsers()
  const { data: tasksData, loading: tasksLoading } = useTasks(params.id)
  const users = usersData ?? []
  const tasks = tasksData ?? []
  
  const loading = usersLoading || tasksLoading

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Filter tasks by time period
  const filterTasksByTime = (tasks: any[], filter: 'all' | 'day' | 'week' | 'month' | 'custom') => {
    if (filter === 'all') return tasks
    
    if (filter === 'custom') {
      if (!customDateStart || !customDateEnd) return tasks
      const startDate = new Date(customDateStart)
      const endDate = new Date(customDateEnd)
      endDate.setHours(23, 59, 59, 999) // Incluir todo el día final
      
      return tasks.filter(task => {
        const taskDate = new Date(task.created_at)
        return taskDate >= startDate && taskDate <= endDate
      })
    }
    
    const now = new Date()
    const filterDate = new Date()
    
    switch (filter) {
      case 'day':
        filterDate.setDate(now.getDate() - 1)
        break
      case 'week':
        filterDate.setDate(now.getDate() - 7)
        break
      case 'month':
        filterDate.setMonth(now.getMonth() - 1)
        break
    }
    
    return tasks.filter(task => {
      const taskDate = new Date(task.created_at)
      return taskDate >= filterDate
    })
  }

  // Primero: definir los cálculos memoizados como callbacks
  const calculateUserStats = useCallback((users: any[], tasks: any[]): UserStats[] => {
    const now = new Date()
    return users.map(user => {
      const userTasks = tasks.filter(task => task.assignee_id === user.id)
      const completedTasks = userTasks.filter(task => task.status === 'done').length
      const inProgressTasks = userTasks.filter(task => task.status === 'inprogress').length
      const todoTasks = userTasks.filter(task => task.status === 'todo').length
      const overdueTasks = userTasks.filter(task => {
        if (!task.due_date || task.status === 'done') return false
        return parseLocalDateFromYMD(task.due_date) < now
      }).length
      
      const completionRate = userTasks.length > 0 ? Math.round((completedTasks / userTasks.length) * 100) : 0
      
      // Calculate estimated hours - asegurar que los valores sean numéricos
      const totalEstimatedHours = userTasks.reduce((total, task) => {
        const hours = Number(task.estimate_hours) || 0
        return total + hours
      }, 0)
      
      const completedEstimatedHours = userTasks
        .filter(task => task.status === 'done')
        .reduce((total, task) => {
          const hours = Number(task.estimate_hours) || 0
          return total + hours
        }, 0)
      
      return {
        id: user.id,
        name: user.name || 'Usuario',
        avatar: user.avatar || '👤',
        totalTasks: userTasks.length,
        completedTasks,
        inProgressTasks,
        todoTasks,
        overdueTasks,
        completionRate,
        totalEstimatedHours,
        completedEstimatedHours,
        recentActivity: Math.floor(Math.random() * 10) + 1 // Mock recent activity
      }
    })
  }, [])

  const calculateTeamStats = useCallback((tasks: any[], users: any[]): TeamStats => {
    const now = new Date()
    const totalTasks = tasks.length
    const completedTasks = tasks.filter(task => task.status === 'done').length
    const inProgressTasks = tasks.filter(task => task.status === 'inprogress').length
    const todoTasks = tasks.filter(task => task.status === 'todo').length
    const overdueTasks = tasks.filter(task => {
      if (!task.due_date || task.status === 'done') return false
      return parseLocalDateFromYMD(task.due_date) < now
    }).length
    
    const averageCompletionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    const activeUsers = users.filter(user => 
      tasks.some(task => task.assignee_id === user.id)
    ).length
    
    // Calculate estimated hours for team
    const totalEstimatedHours = tasks.reduce((total, task) => {
      const hours = Number(task.estimate_hours) || 0
      return total + hours
    }, 0)
    
    const completedEstimatedHours = tasks
      .filter(task => task.status === 'done')
      .reduce((total, task) => {
        const hours = Number(task.estimate_hours) || 0
        return total + hours
      }, 0)
    
    return {
      totalTasks,
      completedTasks,
      inProgressTasks,
      todoTasks,
      overdueTasks,
      totalEstimatedHours,
      completedEstimatedHours,
      averageCompletionRate,
      activeUsers
    }
  }, [])

  // Filter tasks based on time filter
  const filteredTasks = useMemo(() => {
    return filterTasksByTime(tasks, timeFilter)
  }, [tasks, timeFilter, customDateStart, customDateEnd])

  // Después: usar esos callbacks dentro de useMemo
  const userStats = useMemo(() => {
    if (!Array.isArray(users) || !Array.isArray(filteredTasks) || users.length === 0 || filteredTasks.length === 0) return []
    return calculateUserStats(users, filteredTasks)
  }, [users, filteredTasks, calculateUserStats])

  const teamStats = useMemo(() => {
    if (!Array.isArray(filteredTasks) || filteredTasks.length === 0) return null
    return calculateTeamStats(filteredTasks, users)
  }, [filteredTasks, users, calculateTeamStats])

  const getCompletionColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600'
    if (rate >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getCompletionBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100'
    if (rate >= 60) return 'bg-yellow-100'
    return 'bg-red-100'
  }

  const toggleSection = useCallback((userId: string, section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [userId]: prev[userId]?.includes(section) 
        ? prev[userId].filter(s => s !== section)
        : [...(prev[userId] || []), section]
    }))
  }, [])

  const isSectionExpanded = useCallback((userId: string, section: string) => {
    return expandedSections[userId]?.includes(section) || false
  }, [expandedSections])

  const getMockTasks = useCallback((userId: string, section: string) => {
    const tasks = [
      { name: 'Update contracto...', hours: '2h' },
      { name: 'Plan for next year', hours: '0.5h' },
      { name: 'Finalize project...', hours: '2h' },
      { name: 'Review documentation', hours: '1h' },
      { name: 'Test new features', hours: '3h' }
    ]
    return tasks.slice(0, Math.floor(Math.random() * 3) + 2)
  }, [])

  // Los returns condicionales DEBEN ir después de todos los hooks
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">
                Tablón de Rendimiento
              </h1>
              <p className="text-sm text-gray-600">
                Estadísticas del equipo y rendimiento individual
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Cargando datos...</p>
            </div>
          </div>
        ) : (
          <>

        {/* All Users Progress Overview */}
        <div className="mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Resumen de Progreso del Equipo</h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600">Filtrar por:</span>
                <select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value as 'all' | 'day' | 'week' | 'month' | 'custom')}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">Todo el tiempo</option>
                  <option value="day">Último día</option>
                  <option value="week">Última semana</option>
                  <option value="month">Último mes</option>
                  <option value="custom">Fecha personalizada</option>
                </select>
                {timeFilter === 'custom' && (
                  <div className="flex items-center space-x-2 ml-2">
                    <input
                      type="date"
                      value={customDateStart}
                      onChange={(e) => setCustomDateStart(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fecha inicio"
                    />
                    <span className="text-sm text-gray-500">a</span>
                    <input
                      type="date"
                      value={customDateEnd}
                      onChange={(e) => setCustomDateEnd(e.target.value)}
                      className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Fecha fin"
                    />
                  </div>
                )}
              </div>
            </div>
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Mostrando {filteredTasks.length} tareas del {
                    timeFilter === 'all' ? 'total' : 
                    timeFilter === 'day' ? 'último día' : 
                    timeFilter === 'week' ? 'última semana' : 
                    timeFilter === 'month' ? 'último mes' :
                    timeFilter === 'custom' && customDateStart && customDateEnd 
                      ? `${new Date(customDateStart).toLocaleDateString('es-ES')} a ${new Date(customDateEnd).toLocaleDateString('es-ES')}`
                      : 'período personalizado'
                  }
                </span>
                {teamStats && (
                  <span className="text-gray-600">
                    {teamStats.completedTasks} completadas de {teamStats.totalTasks} totales
                  </span>
                )}
              </div>
            </div>
            <div className="space-y-4">
              {userStats.map((userStat) => (
                <div key={userStat.id} className="flex items-center space-x-4">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                    {userStat.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <h3 className="text-sm font-medium text-gray-900">{userStat.name}</h3>
                      <div className="text-right">
                        <span className="text-sm text-gray-600">
                          {userStat.completedTasks} / {userStat.totalTasks} completadas
                        </span>
                        <div className="text-xs text-gray-500">
                          {userStat.completedEstimatedHours}h / {userStat.totalEstimatedHours}h estimadas
                        </div>
                      </div>
                    </div>
                    <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-green-500 transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${userStat.completionRate}%` }}
                      >
                        {userStat.completionRate > 15 && (
                          <span className="text-xs font-medium text-white">{userStat.completionRate}%</span>
                        )}
                      </div>
                      {userStat.completionRate <= 15 && (
                        <div className="absolute inset-0 flex items-center justify-start pl-2">
                          <span className="text-xs font-medium text-gray-600">{userStat.completionRate}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Individual Performance Cards - ClickUp Style */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {userStats.map((userStat) => {
            // Real time estimates from data
            const doneHours = Number(userStat.completedEstimatedHours || 0)
            const totalHours = Number(userStat.totalEstimatedHours || 0)
            const remainingHours = Math.max(0, totalHours - doneHours)
            
            // Formatear horas para mostrar claramente
            const formatHours = (hours: number) => {
              if (hours === 0) return '0h'
              const wholeHours = Math.floor(hours)
              const minutes = Math.round((hours - wholeHours) * 60)
              if (minutes === 0) {
                return `${wholeHours}h`
              }
              return `${wholeHours}h ${minutes}m`
            }
            
            const formatRemainingHours = (hours: number) => {
              if (hours === 0) return '0h'
              const days = Math.floor(hours / 24)
              const remainingHoursInDay = hours % 24
              const wholeHours = Math.floor(remainingHoursInDay)
              const minutes = Math.round((remainingHoursInDay - wholeHours) * 60)
              
              if (days === 0) {
                if (minutes === 0) {
                  return `${wholeHours}h`
                }
                return `${wholeHours}h ${minutes}m`
              }
              if (minutes === 0) {
                return `${days}d ${wholeHours}h`
              }
              return `${days}d ${wholeHours}h ${minutes}m`
            }
            
            return (
              <div key={userStat.id} className="bg-white rounded-lg shadow-sm border p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-lg">
                      {userStat.avatar}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{userStat.name}</h3>
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </div>
                
                {/* Task Statistics */}
                <div className="mb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Total de tareas</span>
                    <span className="text-sm font-semibold text-gray-900">{userStat.totalTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Completadas</span>
                    <span className="text-sm font-semibold text-green-600">{userStat.completedTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">En progreso</span>
                    <span className="text-sm font-semibold text-blue-600">{userStat.inProgressTasks}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Por hacer</span>
                    <span className="text-sm font-semibold text-purple-600">{userStat.todoTasks}</span>
                  </div>
                  {userStat.overdueTasks > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Vencidas</span>
                      <span className="text-sm font-semibold text-red-600">{userStat.overdueTasks}</span>
                    </div>
                  )}
                </div>
                
                {/* Progress Bar for Tasks */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                    <span>Tareas completadas</span>
                    <span className="font-medium">{userStat.completedTasks} / {userStat.totalTasks}</span>
                  </div>
                  {/* Multi-color progress bar showing different statuses */}
                  <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden flex">
                    {userStat.todoTasks > 0 && (
                      <div
                        className="bg-purple-500 transition-all duration-500"
                        style={{ width: `${(userStat.todoTasks / userStat.totalTasks) * 100}%` }}
                        title={`READY: ${userStat.todoTasks}`}
                      />
                    )}
                    {userStat.inProgressTasks > 0 && (
                      <div
                        className="bg-blue-500 transition-all duration-500"
                        style={{ width: `${(userStat.inProgressTasks / userStat.totalTasks) * 100}%` }}
                        title={`IN PROGRESS: ${userStat.inProgressTasks}`}
                      />
                    )}
                    {userStat.completedTasks > 0 && (
                      <div
                        className="bg-yellow-500 transition-all duration-500"
                        style={{ width: `${(userStat.completedTasks / userStat.totalTasks) * 100}%` }}
                        title={`REVIEW: ${userStat.completedTasks}`}
                      />
                    )}
                  </div>
                </div>
                
                {/* Task Completion */}
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm mb-2">
                    <span className="text-gray-600">{userStat.totalTasks - userStat.completedTasks} Not done</span>
                    <span className="text-gray-600">{userStat.completedTasks} Done</span>
                    <div className="relative w-12 h-12">
                      <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-gray-200"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-green-500"
                          stroke="currentColor"
                          strokeWidth="3"
                          fill="none"
                          strokeDasharray={`${userStat.completionRate}, 100`}
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-semibold text-gray-900">{userStat.completionRate}%</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Time Estimate */}
                <div className="mb-4">
                  <div className="text-sm font-medium text-gray-900 mb-3">ESTIMACIÓN DE TIEMPO</div>
                  
                  {/* Resumen de horas */}
                  <div className="bg-gray-50 rounded-lg p-3 mb-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Completadas</div>
                        <div className="text-lg font-semibold text-green-600">{formatHours(doneHours)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Restantes</div>
                        <div className="text-lg font-semibold text-purple-600">{formatRemainingHours(remainingHours)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">Total</div>
                        <div className="text-lg font-semibold text-gray-900">{formatHours(totalHours)}</div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Barra de progreso visual */}
                  <div className="mb-2">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Completadas: {formatHours(doneHours)}</span>
                      <span>Restantes: {formatRemainingHours(remainingHours)}</span>
                    </div>
                    <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full flex">
                        {doneHours > 0 && (
                          <div 
                            className="bg-green-500 transition-all duration-300" 
                            style={{ width: totalHours > 0 ? `${(doneHours / totalHours) * 100}%` : '0%' }}
                            title={`Completadas: ${formatHours(doneHours)}`}
                          />
                        )}
                        {remainingHours > 0 && (
                          <div 
                            className="bg-purple-500 transition-all duration-300" 
                            style={{ width: totalHours > 0 ? `${(remainingHours / totalHours) * 100}%` : '0%' }}
                            title={`Restantes: ${formatRemainingHours(remainingHours)}`}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Porcentaje de avance */}
                  {totalHours > 0 && (
                    <div className="text-center">
                      <span className="text-xs text-gray-600">
                        Avance: {Math.round((doneHours / totalHours) * 100)}% completado
                      </span>
                    </div>
                  )}
                  
                  {totalHours === 0 && (
                    <div className="flex items-center justify-center space-x-1 text-xs text-orange-600 mt-2">
                      <AlertTriangle className="h-3 w-3" />
                      <span>Sin estimaciones de tiempo disponibles</span>
                    </div>
                  )}
                </div>
                
                {/* Task Status Breakdown */}
                <div className="space-y-2">
                  <div 
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => toggleSection(userStat.id, 'ready')}
                  >
                    <div className="flex items-center space-x-2">
                      {isSectionExpanded(userStat.id, 'ready') ? (
                        <span className="text-purple-600">▲</span>
                      ) : (
                        <span className="text-purple-600">✓</span>
                      )}
                      <span className="text-gray-900">READY ({userStat.todoTasks})</span>
                    </div>
                  </div>
                  {isSectionExpanded(userStat.id, 'ready') && (
                    <div className="ml-6 space-y-1">
                      {getMockTasks(userStat.id, 'ready').map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{task.name}</span>
                          <span className="text-gray-500">{task.hours}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => toggleSection(userStat.id, 'inprogress')}
                  >
                    <div className="flex items-center space-x-2">
                      {isSectionExpanded(userStat.id, 'inprogress') ? (
                        <span className="text-blue-600">▲</span>
                      ) : (
                        <span className="text-blue-600">✓</span>
                      )}
                      <span className="text-gray-900">IN PROGRESS ({userStat.inProgressTasks})</span>
                    </div>
                  </div>
                  {isSectionExpanded(userStat.id, 'inprogress') && (
                    <div className="ml-6 space-y-1">
                      {getMockTasks(userStat.id, 'inprogress').map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{task.name}</span>
                          <span className="text-gray-500">{task.hours}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  <div 
                    className="flex items-center justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                    onClick={() => toggleSection(userStat.id, 'review')}
                  >
                    <div className="flex items-center space-x-2">
                      {isSectionExpanded(userStat.id, 'review') ? (
                        <span className="text-yellow-600">▲</span>
                      ) : (
                        <span className="text-yellow-600">✓</span>
                      )}
                      <span className="text-gray-900">REVIEW ({userStat.completedTasks})</span>
                    </div>
                  </div>
                  {isSectionExpanded(userStat.id, 'review') && (
                    <div className="ml-6 space-y-1">
                      {getMockTasks(userStat.id, 'review').map((task, index) => (
                        <div key={index} className="flex items-center justify-between text-xs text-gray-600">
                          <span>{task.name}</span>
                          <span className="text-gray-500">{task.hours}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Team Summary */}
        {teamStats && (
          <div className="mt-8 bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Resumen del Equipo</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{teamStats.activeUsers}</div>
                <div className="text-sm text-gray-600">Miembros Activos</div>
                <div className="text-xs text-gray-500 mt-1">de {users.length} total</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{teamStats.completedTasks}</div>
                <div className="text-sm text-gray-600">Tareas Entregadas</div>
                <div className="text-xs text-gray-500 mt-1">de {teamStats.totalTasks} total</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{teamStats.inProgressTasks}</div>
                <div className="text-sm text-gray-600">En Progreso</div>
                <div className="text-xs text-gray-500 mt-1">activas ahora</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{teamStats.averageCompletionRate}%</div>
                <div className="text-sm text-gray-600">Eficiencia Promedio</div>
                <div className="text-xs text-gray-500 mt-1">del equipo</div>
              </div>
            </div>
            
            {/* Performance Insights */}
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-md font-semibold text-gray-900 mb-4">Insights de Rendimiento</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-gray-900">Top Performer</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {userStats.length > 0 ? userStats.reduce((prev, current) => 
                      prev.completionRate > current.completionRate ? prev : current
                    ).name : 'N/A'} con {userStats.length > 0 ? userStats.reduce((prev, current) => 
                      prev.completionRate > current.completionRate ? prev : current
                    ).completionRate : 0}% de completado
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <span className="font-medium text-gray-900">Necesita Atención</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {teamStats.overdueTasks} tareas vencidas requieren atención inmediata
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
          </>
        )}
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
