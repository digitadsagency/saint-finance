'use client'

import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskCard } from '@/components/TaskCard'
import { TaskDrawer } from '@/components/TaskDrawer'
import { 
  ArrowLeft, 
  Filter, 
  Search, 
  Plus,
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle
} from 'lucide-react'
import { Task, Status, Priority } from '@/lib/validation'

export default function MyWorkPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [tasks, setTasks] = useState<Task[]>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [filter, setFilter] = useState<Status | 'all'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Mock data for demo
    const mockTasks: Task[] = [
      {
        id: '1',
        project_id: 'project-1',
        title: 'Crear contenido para Instagram',
        description_md: 'Desarrollar posts creativos para la campaña de verano',
        priority: 'high',
        status: 'inprogress',
        assignee_id: 'user-1',
        reporter_id: 'user-2',
        due_date: '2024-01-15',
        estimate_hours: 4,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        version: 1,
        labels_csv: 'redes sociales, contenido'
      },
      {
        id: '2',
        project_id: 'project-2',
        title: 'Diseñar mockups para landing page',
        description_md: 'Crear wireframes y mockups para la nueva landing page',
        priority: 'urgent',
        status: 'todo',
        assignee_id: 'user-1',
        reporter_id: 'user-2',
        due_date: '2024-01-12',
        estimate_hours: 8,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        version: 1,
        labels_csv: 'diseño, web'
      },
      {
        id: '3',
        project_id: 'project-3',
        title: 'Analizar métricas de competidores',
        description_md: 'Investigar y analizar las métricas de los principales competidores',
        priority: 'med',
        status: 'done',
        assignee_id: 'user-1',
        reporter_id: 'user-2',
        due_date: '2024-01-10',
        estimate_hours: 6,
        completed_at: '2024-01-09T16:00:00Z',
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-09T16:00:00Z',
        version: 2,
        labels_csv: 'análisis, investigación'
      },
      {
        id: '4',
        project_id: 'project-1',
        title: 'Revisar copy de email marketing',
        description_md: 'Revisar y optimizar los textos de las campañas de email',
        priority: 'high',
        status: 'review',
        assignee_id: 'user-1',
        reporter_id: 'user-2',
        due_date: '2024-01-14',
        estimate_hours: 2,
        created_at: '2024-01-01T10:00:00Z',
        updated_at: '2024-01-01T10:00:00Z',
        version: 1,
        labels_csv: 'copy, email, marketing'
      }
    ]

    setTasks(mockTasks)
  }, [])

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const filteredTasks = tasks.filter(task => {
    const matchesFilter = filter === 'all' || task.status === filter
    const matchesSearch = searchQuery === '' || 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description_md && task.description_md.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesFilter && matchesSearch
  })

  const getStatusCount = (status: Status) => {
    return tasks.filter(task => task.status === status).length
  }

  const getPriorityCount = (priority: Priority) => {
    return tasks.filter(task => task.priority === priority).length
  }

  const handleTaskUpdate = (taskId: string, updates: Partial<Task>) => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId 
          ? { ...task, ...updates, updated_at: new Date().toISOString() }
          : task
      )
    )
  }

  const getStatusColor = (status: Status) => {
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
              <Button
                variant="ghost"
                onClick={() => router.push('/workspaces')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Mi Trabajo
                </h1>
                <p className="text-sm text-gray-600">
                  {tasks.length} tareas asignadas
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nueva Tarea
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getStatusCount('inprogress')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgentes</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getPriorityCount('urgent')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-bold text-gray-900">
                  {getStatusCount('done')}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center">
              <Calendar className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Esta Semana</p>
                <p className="text-2xl font-bold text-gray-900">
                  {tasks.filter(task => {
                    if (!task.due_date) return false
                    const dueDate = new Date(task.due_date)
                    const today = new Date()
                    const weekFromNow = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
                    return dueDate >= today && dueDate <= weekFromNow
                  }).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar tareas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value as Status | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">Todos los estados</option>
                <option value="backlog">Backlog</option>
                <option value="todo">Por Hacer</option>
                <option value="inprogress">En Progreso</option>
                <option value="review">Revisión</option>
                <option value="done">Completado</option>
              </select>
            </div>
          </div>
        </div>

        {/* Tasks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => setSelectedTask(task)}
            />
          ))}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">
              {searchQuery || filter !== 'all' 
                ? 'No se encontraron tareas con los filtros aplicados'
                : 'No tienes tareas asignadas'
              }
            </p>
          </div>
        )}
      </main>

      {/* Task Drawer */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            handleTaskUpdate(selectedTask.id, updates)
            setSelectedTask({ ...selectedTask, ...updates })
          }}
        />
      )}
    </div>
  )
}
