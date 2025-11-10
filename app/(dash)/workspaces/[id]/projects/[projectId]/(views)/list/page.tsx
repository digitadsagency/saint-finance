'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, CalendarDays, List, Users, Settings, ArrowLeft, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { Task } from '@/lib/validation'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { parseLocalDateFromYMD } from '@/lib/time'

export default function ProjectListPage({
  params
}: {
  params: { id: string; projectId: string }
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<'priority' | 'status' | 'due_date'>('priority')
  const { toasts, removeToast, success, error } = useToast()

  // Load tasks from Google Sheets
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/tasks?workspaceId=${params.id}`)
        if (response.ok) {
          const tasksData = await response.json()
          setTasks(tasksData)
          console.log('✅ Tasks loaded from Google Sheets:', tasksData)
        } else {
          console.error('Error loading tasks:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadTasks()
    }
  }, [user, params.id])

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

  // Sort tasks
  const sortedTasks = [...tasks].sort((a, b) => {
    switch (sortBy) {
      case 'priority':
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      case 'status':
        const statusOrder = { backlog: 1, todo: 2, inprogress: 3, review: 4, done: 5 }
        return (statusOrder[a.status as keyof typeof statusOrder] || 0) - 
               (statusOrder[b.status as keyof typeof statusOrder] || 0)
      case 'due_date':
        if (!a.due_date && !b.due_date) return 0
        if (!a.due_date) return 1
        if (!b.due_date) return -1
        return parseLocalDateFromYMD(a.due_date).getTime() - parseLocalDateFromYMD(b.due_date).getTime()
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.push(`/workspaces/${params.id}/dashboard`)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Vista de Lista</h1>
              <p className="text-sm text-gray-600">Organizadas por prioridad</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Switching to kanban view...')
                  router.push(`/workspaces/${params.id}/projects/${params.projectId}/kanban`)
                }}
              >
                <CalendarDays className="h-4 w-4 mr-1" />
                Kanban
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  console.log('Switching to calendar view...')
                  router.push(`/workspaces/${params.id}/projects/${params.projectId}/calendar`)
                }}
              >
                <CalendarIcon className="h-4 w-4 mr-1" />
                Calendario
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-2xl font-semibold text-gray-800">Lista de Tareas</h2>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Ordenar por:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'priority' | 'status' | 'due_date')}
                className="px-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="priority">Prioridad</option>
                <option value="status">Estado</option>
                <option value="due_date">Fecha</option>
              </select>
            </div>
          </div>
          <TaskFormDialog projectId={params.projectId} onTaskCreated={handleTaskCreate} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando tareas...</span>
          </div>
        ) : tasks.length === 0 ? (
          <div className="text-center py-12">
            <List className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas en este proyecto</p>
            <p className="text-sm text-gray-400">Crea tu primera tarea para comenzar</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tarea
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prioridad
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Asignado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTasks.map((task) => (
                    <tr key={task.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(task.status)}
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{task.title}</div>
                            <div className="text-sm text-gray-500">
                              {task.description_md || 'Sin descripción'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(task.status)}`}>
                          {task.status === 'inprogress' ? 'En Progreso' : 
                           task.status === 'todo' ? 'Por Hacer' :
                           task.status === 'done' ? 'Completado' :
                           task.status === 'review' ? 'Revisión' : 'Backlog'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getPriorityIcon(task.priority)}
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getPriorityColor(task.priority)}`}>
                            {task.priority === 'urgent' ? 'Urgente' :
                             task.priority === 'high' ? 'Alta' :
                             task.priority === 'medium' ? 'Media' : 'Baja'}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.due_date ? parseLocalDateFromYMD(task.due_date).toLocaleDateString('es-ES') : 'Sin fecha'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {task.assignee_id || 'Sin asignar'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Opening task details:', task.id)
                            // TODO: Open task details modal
                          }}
                        >
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
