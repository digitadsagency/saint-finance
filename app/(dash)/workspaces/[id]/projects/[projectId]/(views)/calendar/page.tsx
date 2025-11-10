'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Calendar as CalendarIcon, CalendarDays, List, Users, Settings, ArrowLeft, Plus } from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { Task } from '@/lib/validation'
import { TaskFormDialog } from '@/components/TaskFormDialog'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { parseLocalDateFromYMD, formatYMDLongEs } from '@/lib/time'

export default function ProjectCalendarPage({
  params
}: {
  params: { id: string; projectId: string }
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, success, error } = useToast()

  // Load tasks and users from Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load tasks for this specific project
        const tasksResponse = await fetch(`/api/tasks?projectId=${params.projectId}`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData)
          console.log('✅ Tasks loaded for project from Google Sheets:', tasksData)
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
  }, [user, params.projectId])

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
      case 'med': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

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
              <h1 className="text-3xl font-bold text-gray-900">Calendario del Cliente</h1>
              <p className="text-sm text-gray-600">Organizadas por fecha</p>
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
                  console.log('Switching to list view...')
                  router.push(`/workspaces/${params.id}/projects/${params.projectId}/list`)
                }}
              >
                <List className="h-4 w-4 mr-1" />
                Lista
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-gray-800">Tareas por Fecha</h2>
          <TaskFormDialog projectId={params.projectId} onTaskCreated={handleTaskCreate} />
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando tareas...</span>
          </div>
        ) : Object.keys(tasksByDate).length === 0 ? (
          <div className="text-center py-12">
            <CalendarIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No hay tareas con fechas asignadas</p>
            <p className="text-sm text-gray-400">Crea una tarea con fecha de vencimiento para verla aquí</p>
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(tasksByDate)
              .sort(([a], [b]) => {
                if (a === 'Sin fecha') return 1
                if (b === 'Sin fecha') return -1
                return parseLocalDateFromYMD(a).getTime() - parseLocalDateFromYMD(b).getTime()
              })
              .map(([date, dateTasks]) => (
                <div key={date} className="bg-white rounded-lg shadow-sm border">
                  <div className="p-4 border-b bg-gray-50">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {date === 'Sin fecha' ? 'Sin fecha asignada' : formatYMDLongEs(date)}
                    </h3>
                    <p className="text-sm text-gray-600">{dateTasks.length} tareas</p>
                  </div>
                  <div className="p-4">
                    <div className="grid gap-3">
                      {dateTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                          onClick={() => {
                            router.push(`/workspaces/${params.id}/projects/${params.projectId}/clickup-list`)
                          }}
                        >
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900">{task.title}</h4>
                            <p className="text-sm text-gray-600">{task.description_md || 'Sin descripción'}</p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(task.status)}`}>
                              {task.status === 'inprogress' ? 'En Progreso' : 
                               task.status === 'todo' ? 'Por Hacer' :
                               task.status === 'done' ? 'Completado' :
                               task.status === 'review' ? 'Revisión' : 'Backlog'}
                            </span>
                            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(task.priority)}`}>
                              {task.priority === 'urgent' ? 'Urgente' :
                               task.priority === 'high' ? 'Alta' :
                                task.priority === 'med' ? 'Media' : 'Baja'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </main>

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
