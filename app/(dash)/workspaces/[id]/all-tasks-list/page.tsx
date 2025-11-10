'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  User,
  Filter,
  SortAsc,
  SortDesc,
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { Task } from '@/lib/validation'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { parseLocalDateFromYMD } from '@/lib/time'
import { TaskFormDialog } from '@/components/TaskFormDialog'

// Helper function to get user info from Google Sheets data
const getUserInfo = (assigneeId: string | undefined, users: any[] = []) => {
  if (!assigneeId) return { name: 'Sin asignar', initials: '?', avatar: '👤' }
  const user = users.find(u => u.id === assigneeId)
  if (!user) return { name: 'Sin asignar', initials: '?', avatar: '👤' }
  
  const name = user.name || 'Usuario'
  const initials = name.charAt(0).toUpperCase()
  const avatar = user.avatar || '👤'
  return { name, initials, avatar }
}

// Helper function to get client name
const getClientName = (projectId: string, clients: any[] = []) => {
  const client = clients.find(c => c.id === projectId)
  return client ? client.name : `Cliente ${projectId?.slice(-4) || 'N/A'}`
}

export default function AllTasksClickUpView({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [allTasks, setAllTasks] = useState<Task[]>([]) // Almacenar todas las tareas
  const [clients, setClients] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'due_date' | 'priority' | 'status'>('due_date')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')
  const [showCompleted, setShowCompleted] = useState(true)
  const [updatingTask, setUpdatingTask] = useState<Record<string, boolean>>({})
  const { toasts, removeToast, success, error } = useToast()

  // Verificar si el usuario es admin (Miguel o Raúl)
  const isAdmin = useMemo(() => {
    if (!user) return false
    const name = (user.name || '').toLowerCase()
    return name === 'miguel' || name === 'raul'
  }, [user])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Load data from Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load all tasks for workspace
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
          
          console.log('✅ Tasks loaded:', tasksData)
        } else {
          console.error('Error loading tasks:', tasksResponse.statusText)
        }
        
        // Load clients
        const clientsResponse = await fetch(`/api/projects?workspaceId=${params.id}`)
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
          console.log('✅ Clients loaded:', clientsData)
        } else {
          console.error('Error loading clients:', clientsResponse.statusText)
        }
        
        // Load users
        const usersResponse = await fetch('/api/users')
        if (usersResponse.ok) {
          const usersData = await usersResponse.json()
          setUsers(usersData)
          console.log('✅ Users loaded:', usersData)
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

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prevTasks =>
          prevTasks.map(task =>
            task.id === taskId ? updatedTask : task
          )
        )
        success('Tarea actualizada', 'Los cambios se han guardado correctamente')
      } else {
        error('Error al actualizar', 'No se pudo actualizar la tarea')
      }
    } catch (err) {
      console.error('Error updating task:', err)
      error('Error de conexión', 'No se pudo conectar con el servidor')
    }
  }

  const handleTaskCreate = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask])
    success('Tarea creada', 'La nueva tarea se ha creado exitosamente')
  }

  const handleTaskStatusChange = async (taskId: string, newStatus: string) => {
    // UI optimista
    setUpdatingTask(prev => ({ ...prev, [taskId]: true }))
    const previousStatus = tasks.find(t => t.id === taskId)?.status as Task['status'] | undefined
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus as Task['status'] } : t))
    try {
      await handleTaskUpdate(taskId, { status: newStatus as Task['status'] })
    } catch (e) {
      // rollback si falla
      if (previousStatus) {
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: previousStatus } : t))
      }
    } finally {
      setUpdatingTask(prev => {
        const { [taskId]: _omit, ...rest } = prev
        return rest
      })
    }
  }

  const getNextStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'todo': return 'inprogress'
      case 'inprogress': return 'review'
      case 'review': return 'done'
      case 'done': return 'done'
      default: return 'inprogress'
    }
  }

  const getPreviousStatus = (currentStatus: string) => {
    switch (currentStatus) {
      case 'done': return 'review'
      case 'review': return 'inprogress'
      case 'inprogress': return 'todo'
      case 'todo': return 'todo'
      default: return 'todo'
    }
  }

  const handleTaskComplete = async (taskId: string, checked: boolean) => {
    const currentTask = tasks.find(t => t.id === taskId)
    if (!currentTask) return

    const newStatus = checked ? getNextStatus(currentTask.status) : getPreviousStatus(currentTask.status)
    await handleTaskStatusChange(taskId, newStatus)
  }

  const handleTaskRevert = async (taskId: string) => {
    const currentTask = tasks.find(t => t.id === taskId)
    if (!currentTask) return

    const newStatus = getPreviousStatus(currentTask.status)
    await handleTaskStatusChange(taskId, newStatus)
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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-4 w-4 text-red-600" />
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />
      case 'medium': return <Clock className="h-4 w-4 text-yellow-600" />
      case 'low': return <Clock className="h-4 w-4 text-blue-600" />
      default: return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'done': return 'Completado'
      case 'inprogress': return 'En Progreso'
      case 'todo': return 'Por Hacer'
      case 'review': return 'Revisión'
      case 'backlog': return 'Backlog'
      default: return status
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'medium': return 'Media'
      case 'low': return 'Baja'
      default: return priority
    }
  }

  const renderRevertButton = (task: Task) => {
    const isUpdating = !!updatingTask[task.id]
    const canRevert = task.status !== 'todo'
    
    if (!canRevert) return null
    
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleTaskRevert(task.id)}
        disabled={isUpdating}
        className="text-xs h-7 px-2 text-gray-600 hover:text-gray-800"
      >
        ← Atrás
      </Button>
    )
  }

  // Sort tasks by date and priority
  const sortedTasks = [...tasks].sort((a, b) => {
    if (sortBy === 'due_date') {
      if (!a.due_date && !b.due_date) return 0
      if (!a.due_date) return sortOrder === 'asc' ? 1 : -1
      if (!b.due_date) return sortOrder === 'asc' ? -1 : 1
      
      const dateA = parseLocalDateFromYMD(a.due_date).getTime()
      const dateB = parseLocalDateFromYMD(b.due_date).getTime()
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
      const priorityA = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
      const priorityB = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
      return sortOrder === 'asc' ? priorityB - priorityA : priorityA - priorityB
    } else if (sortBy === 'status') {
      const statusOrder = { backlog: 1, todo: 2, inprogress: 3, review: 4, done: 5 }
      const statusA = statusOrder[a.status as keyof typeof statusOrder] || 0
      const statusB = statusOrder[b.status as keyof typeof statusOrder] || 0
      return sortOrder === 'asc' ? statusA - statusB : statusB - statusA
    }
    return 0
  })

  // Filter tasks based on showCompleted setting
  const filteredTasks = showCompleted ? sortedTasks : sortedTasks.filter(task => task.status !== 'done')

  // Group tasks by status
  const tasksByStatus = filteredTasks.reduce((acc, task) => {
    if (!acc[task.status]) {
      acc[task.status] = []
    }
    acc[task.status].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  // Calculate stats
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'done').length,
    inProgress: tasks.filter(t => t.status === 'inprogress').length,
    todo: tasks.filter(t => t.status === 'todo').length,
    overdue: tasks.filter(t => {
      if (!t.due_date || t.status === 'done') return false
      return parseLocalDateFromYMD(t.due_date) < new Date()
    }).length
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
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
                <h1 className="text-xl font-semibold text-gray-900">
                  Lista de Tareas
                </h1>
                <p className="text-sm text-gray-600">
                  {isAdmin ? 'Todas las tareas del workspace' : 'Tus tareas asignadas'}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => router.push(`/workspaces/${params.id}/calendar`)}
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Calendario
                </Button>
              </div>
              <TaskFormDialog 
                projectId={undefined} 
                workspaceId={params.id}
                onTaskCreated={handleTaskCreate} 
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <User className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Por Hacer</p>
                <p className="text-2xl font-bold text-blue-600">{stats.todo}</p>
              </div>
              <Clock className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Vencidas</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Lista de Tareas</h2>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCompleted(!showCompleted)}
                >
                  {showCompleted ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {showCompleted ? 'Ocultar Completadas' : 'Mostrar Completadas'}
                </Button>
              </div>
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Ordenar por:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'due_date' | 'priority' | 'status')}
                  className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="due_date">Fecha</option>
                  <option value="priority">Prioridad</option>
                  <option value="status">Estado</option>
                </select>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              >
                {sortOrder === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                {sortOrder === 'asc' ? 'Ascendente' : 'Descendente'}
              </Button>
            </div>
          </div>
        </div>

        {/* Tasks List - ClickUp Style */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando tareas...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas</p>
            <p className="text-sm text-gray-400">Crea una tarea para comenzar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* To Do Section */}
            {tasksByStatus['todo'] && tasksByStatus['todo'].length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Por Hacer</h3>
                      <Badge variant="outline" className="text-gray-600 text-xs">
                        {tasksByStatus['todo'].length}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {tasksByStatus['todo'].map((task) => {
                    const assigneeInfo = getUserInfo(task.assignee_id, users)
                    return (
                      <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                            disabled={!!updatingTask[task.id]}
                            className="h-4 w-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                              {task.description_md && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description_md}</p>
                              )}
                              <span className="text-xs text-gray-500">{getClientName(task.project_id, clients)}</span>
                            </div>
                            {getPriorityIcon(task.priority)}
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className="text-sm">{assigneeInfo.avatar}</div>
                              <span className="text-xs text-gray-600">{assigneeInfo.name}</span>
                            </div>
                            {task.due_date && (
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                {parseLocalDateFromYMD(task.due_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* In Progress Section */}
            {tasksByStatus['inprogress'] && tasksByStatus['inprogress'].length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-blue-600" />
                      <h3 className="text-sm font-semibold text-gray-900">En Progreso</h3>
                      <Badge variant="outline" className="text-gray-600 text-xs">
                        {tasksByStatus['inprogress'].length}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {tasksByStatus['inprogress'].map((task) => {
                    const assigneeInfo = getUserInfo(task.assignee_id, users)
                    return (
                      <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                            disabled={!!updatingTask[task.id]}
                            className="h-4 w-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                              {task.description_md && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description_md}</p>
                              )}
                              <span className="text-xs text-gray-500">{getClientName(task.project_id, clients)}</span>
                            </div>
                            {getPriorityIcon(task.priority)}
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className="text-sm">{assigneeInfo.avatar}</div>
                              <span className="text-xs text-gray-600">{assigneeInfo.name}</span>
                            </div>
                            {task.due_date && (
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                {parseLocalDateFromYMD(task.due_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {renderRevertButton(task)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Review Section */}
            {tasksByStatus['review'] && tasksByStatus['review'].length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Eye className="h-4 w-4 text-yellow-600" />
                      <h3 className="text-sm font-semibold text-gray-900">En Revisión</h3>
                      <Badge variant="outline" className="text-gray-600 text-xs">
                        {tasksByStatus['review'].length}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {tasksByStatus['review'].map((task) => {
                    const assigneeInfo = getUserInfo(task.assignee_id, users)
                    return (
                      <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors group">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={false}
                            onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                            disabled={!!updatingTask[task.id]}
                            className="h-4 w-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                              {task.description_md && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description_md}</p>
                              )}
                              <span className="text-xs text-gray-500">{getClientName(task.project_id, clients)}</span>
                            </div>
                            {getPriorityIcon(task.priority)}
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)}`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className="text-sm">{assigneeInfo.avatar}</div>
                              <span className="text-xs text-gray-600">{assigneeInfo.name}</span>
                            </div>
                            {task.due_date && (
                              <div className="text-xs text-gray-500 flex-shrink-0">
                                {parseLocalDateFromYMD(task.due_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {renderRevertButton(task)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Done Section */}
            {showCompleted && tasksByStatus['done'] && tasksByStatus['done'].length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
                <div className="px-4 py-3 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <h3 className="text-sm font-semibold text-gray-900">Completadas</h3>
                      <Badge variant="outline" className="text-gray-600 text-xs">
                        {tasksByStatus['done'].length}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {tasksByStatus['done'].map((task) => {
                    const assigneeInfo = getUserInfo(task.assignee_id, users)
                    return (
                      <div key={task.id} className="px-4 py-3 hover:bg-gray-50 transition-colors group opacity-75">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            checked={true}
                            onCheckedChange={(checked) => handleTaskComplete(task.id, checked as boolean)}
                            disabled={!!updatingTask[task.id]}
                            className="h-4 w-4 flex-shrink-0"
                          />
                          <div className="flex-1 min-w-0 flex items-center space-x-3">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-gray-500 line-through">{task.title}</h4>
                              {task.description_md && (
                                <p className="text-xs text-gray-400 mt-1 line-clamp-2 line-through">{task.description_md}</p>
                              )}
                              <span className="text-xs text-gray-400">{getClientName(task.project_id, clients)}</span>
                            </div>
                            {getPriorityIcon(task.priority)}
                            <span className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${getPriorityColor(task.priority)} opacity-50`}>
                              {getPriorityLabel(task.priority)}
                            </span>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <div className="text-sm opacity-50">{assigneeInfo.avatar}</div>
                              <span className="text-xs text-gray-400">{assigneeInfo.name}</span>
                            </div>
                            {task.due_date && (
                              <div className="text-xs text-gray-400 flex-shrink-0">
                                {parseLocalDateFromYMD(task.due_date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                              </div>
                            )}
                            {renderRevertButton(task)}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
