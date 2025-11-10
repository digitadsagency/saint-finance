'use client'

import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { KanbanBoard } from '@/components/KanbanBoard'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { ArrowLeft, Settings, Users, Calendar as CalendarIcon, List, User } from 'lucide-react'
import { Task, CreateTaskInput } from '@/lib/validation'

export default function ProjectKanbanPage({ 
  params 
}: { 
  params: { id: string; projectId: string } 
}) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const { toasts, removeToast, success, error } = useToast()

  // Load tasks from Google Sheets
  useEffect(() => {
    const loadTasks = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/tasks?projectId=${params.projectId}`)
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
  }, [user, params.projectId])

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`/api/tasks?projectId=${params.projectId}`)
        if (response.ok) {
          const tasksData = await response.json()
          setTasks(tasksData)
        }
      } catch (error) {
        console.error('Error fetching tasks:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [params.projectId])

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
      console.log('🔄 Updating task:', taskId, 'with updates:', updates)
      
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      })

      console.log('📡 Response status:', response.status)

      if (response.ok) {
        const updatedTask = await response.json()
        console.log('✅ Updated task received:', updatedTask)
        
        setTasks(prevTasks => {
          const newTasks = prevTasks.map(task => 
            task.id === taskId ? updatedTask : task
          )
          console.log('🔄 Tasks updated:', newTasks.length, 'tasks total')
          return newTasks
        })
        
        // Show success notification
        if (updates.status) {
          const statusLabels = {
            'backlog': 'Backlog',
            'todo': 'Por Hacer',
            'inprogress': 'En Progreso',
            'review': 'Revisión',
            'done': 'Completado'
          }
          success(
            'Estado actualizado',
            `Tarea movida a ${statusLabels[updates.status]}`
          )
        } else if (updates.priority) {
          const priorityLabels = {
            'low': 'Baja',
            'med': 'Media',
            'high': 'Alta',
            'urgent': 'Urgente'
          }
          success(
            'Prioridad actualizada',
            `Prioridad cambiada a ${priorityLabels[updates.priority]}`
          )
        }
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('❌ Error updating task:', response.status, errorData)
        error('Error al actualizar', `No se pudo actualizar la tarea: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (err) {
      console.error('❌ Error updating task:', err)
      error('Error de conexión', 'No se pudo conectar con el servidor')
    }
  }

  const handleTaskCreate = (newTask: Task) => {
    setTasks(prevTasks => [...prevTasks, newTask])
    success('Tarea creada', 'La nueva tarea se ha creado exitosamente')
  }

  const getProjectName = () => {
    switch (params.projectId) {
      case '1': return 'Campaña Redes Sociales'
      case '2': return 'Rediseño Web'
      case '3': return 'Análisis Competencia'
      default: return 'Proyecto'
    }
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
                <h1 className="text-xl font-semibold text-gray-900">
                  {getProjectName()}
                </h1>
                <p className="text-sm text-gray-600">
                  {tasks.length} tareas • 3 miembros
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
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
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Going to My Work...')
                            router.push(`/workspaces/${params.id}/my-work`)
                          }}
                        >
                          <User className="h-4 w-4 mr-1" />
                          Mi Trabajo
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            console.log('Switching to ClickUp list view...')
                            router.push(`/workspaces/${params.id}/projects/${params.projectId}/clickup-list`)
                          }}
                        >
                          <List className="h-4 w-4 mr-1" />
                          Lista ClickUp
                        </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Managing members...')
                alert('👥 ¡Gestionando miembros del proyecto!\n\n• María García (Owner)\n• Carlos López (Admin)\n• Ana Martín (Member)\n• David Rodríguez (Member)\n\n(Próximamente: gestión completa)')
              }}
            >
              <Users className="h-4 w-4 mr-1" />
              Miembros
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log('Opening project settings...')
                alert('⚙️ ¡Configuración del proyecto!\n\n🔧 Opciones disponibles:\n• Cambiar nombre del proyecto\n• Gestionar permisos\n• Configurar notificaciones\n• Exportar datos del proyecto\n• Archivar proyecto\n\n(Próximamente: panel completo)')
              }}
            >
              <Settings className="h-4 w-4" />
            </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Kanban Board */}
      <KanbanBoard
        tasks={tasks}
        projectId={params.projectId}
        onTaskUpdate={handleTaskUpdate}
        onTaskCreate={handleTaskCreate}
      />

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}