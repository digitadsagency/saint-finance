'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, ArrowLeft, Plus, User, Clock, CheckCircle } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { Task } from '@/lib/validation'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { toLocalYMD } from '@/lib/time'
import { getTeamMemberName, getTeamMemberInitials } from '@/lib/team-members'

// Helper function to get user info from Google Sheets data
const getUserInfo = (assigneeId: string, users: any[] = []) => {
  const user = users.find(u => u.id === assigneeId)
  if (!user) return { name: 'Sin asignar', initials: '?' }
  
  const name = user.name || 'Usuario'
  const initials = name.charAt(0).toUpperCase()
  return { name, initials }
}

export default function WorkspaceCalendarPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([]) // Almacenar todas las tareas
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const { toasts, removeToast, success, error } = useToast()

  // Verificar si el usuario es admin (Miguel o Raúl) - debe estar antes de useEffect
  const isAdmin = useMemo(() => {
    if (!user) return false
    const name = (user.name || '').toLowerCase()
    return name === 'miguel' || name === 'raul'
  }, [user])

  // Load tasks and users from Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load tasks
        const tasksResponse = await fetch(`/api/tasks?workspaceId=${params.id}`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setAllTasks(tasksData)
          
          // Filtrar tareas según el usuario
          if (isAdmin) {
            // Admin ve todas las tareas
            setTasks(tasksData)
          } else {
            // Usuario regular solo ve sus tareas asignadas
            const filteredTasks = tasksData.filter((task: Task) => task.assignee_id === user?.id)
            setTasks(filteredTasks)
          }
          
          console.log('✅ Tasks loaded from Google Sheets:', tasksData)
        } else {
          console.error('Error loading tasks:', tasksResponse.statusText)
        }
        
        // Load users
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
          console.log('✅ Users loaded from Google Sheets:', usersData)
        } else {
          console.error('Error loading users:', usersResponse.statusText)
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, params.id, isAdmin])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

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

  const handleTaskCreate = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask])
    success('Tarea creada', 'La nueva tarea se ha creado exitosamente')
  }

  // Group tasks by date
  const tasksByDate = tasks.reduce((acc, task) => {
    const date = task.due_date || 'Sin fecha'
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200'
      case 'inprogress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'todo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'backlog': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'done': return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'inprogress': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'todo': return <Clock className="h-4 w-4 text-blue-600" />
      case 'review': return <Clock className="h-4 w-4 text-purple-600" />
      case 'backlog': return <Clock className="h-4 w-4 text-gray-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  // Generate calendar days
  const generateCalendarDays = () => {
    const year = selectedDate.getFullYear()
    const month = selectedDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startDate = new Date(firstDay)
    startDate.setDate(startDate.getDate() - firstDay.getDay())
    
    const days = []
    const currentDate = new Date(startDate)
    
    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return days
  }

  const calendarDays = generateCalendarDays()
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ]

  const getTasksForDate = (date: Date) => {
    const dateStr = toLocalYMD(date)
    return tasksByDate[dateStr] || []
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/workspaces/${params.id}/dashboard`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Calendario de Tareas</h1>
                <p className="text-sm text-gray-600">
                  {isAdmin ? 'Vista general de todas las tareas del equipo' : 'Tus tareas asignadas'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <TaskFormDialog projectId="general" onTaskCreate={handleTaskCreate} />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                >
                  →
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                const dayTasks = getTasksForDate(date)
                const isCurrentMonthDay = isCurrentMonth(date)
                const isTodayDate = isToday(date)
                
                return (
                  <div
                    key={index}
                    className={`
                      min-h-[120px] p-2 border border-gray-200 rounded-lg
                      ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                      ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`
                        text-sm font-medium
                        ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                        ${isTodayDate ? 'text-blue-600 font-bold' : ''}
                      `}>
                        {date.getDate()}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                          {dayTasks.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div
                          key={task.id}
                          className={`
                            p-1 rounded text-xs cursor-pointer hover:bg-gray-100
                            ${getStatusColor(task.status)}
                          `}
                          onClick={() => {
                            if (task.project_id) {
                              router.push(`/workspaces/${params.id}/projects/${task.project_id}/clickup-list`)
                            }
                          }}
                        >
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(task.status)}
                            <span className="truncate">{task.title}</span>
                          </div>
                          {task.assignee_id && (
                            <div className="flex items-center space-x-1 mt-1">
                              <User className="h-3 w-3" />
                              <span className="text-xs">
                                {getUserInfo(task.assignee_id, users).initials}
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                      {dayTasks.length > 3 && (
                        <div className="text-xs text-gray-500 text-center">
                          +{dayTasks.length - 3} más
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Task Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas por Estado</h3>
            <div className="space-y-2">
              {['todo', 'inprogress', 'review', 'done'].map((status) => {
                const count = tasks.filter(task => task.status === status).length
                const statusLabels = {
                  'todo': 'Por Hacer',
                  'inprogress': 'En Progreso',
                  'review': 'Revisión',
                  'done': 'Completado'
                }
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{statusLabels[status as keyof typeof statusLabels]}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(status)}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tareas por Prioridad</h3>
            <div className="space-y-2">
              {['urgent', 'high', 'medium', 'low'].map((priority) => {
                const count = tasks.filter(task => task.priority === priority).length
                const priorityLabels = {
                  'urgent': 'Urgente',
                  'high': 'Alta',
                  'medium': 'Media',
                  'low': 'Baja'
                }
                return (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{priorityLabels[priority as keyof typeof priorityLabels]}</span>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(priority)}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Asignaciones</h3>
            <div className="space-y-2">
              {tasks.filter(task => task.assignee_id).map((task) => {
                const assigneeInfo = getUserInfo(task.assignee_id, users)
                return (
                  <div key={task.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">{assigneeInfo.name}</span>
                    <span className="text-xs text-gray-500">{task.title}</span>
                  </div>
                )
              }).slice(0, 5)}
            </div>
          </div>
        </div>
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
