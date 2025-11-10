'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Priority, Status } from '@/lib/validation'
import { Plus } from 'lucide-react'
import { z } from 'zod'
import { Textarea } from './ui/textarea'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover'
import { CalendarIcon, Loader2, User } from 'lucide-react'
import { Calendar } from './ui/calendar'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

// Simplified schema for the form
const TaskFormSchema = z.object({
  title: z.string().min(1, 'El título es requerido'),
  description: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assignee_id: z.string().optional(),
  due_date: z.string().optional(),
  estimate_hours: z.number().positive('Las horas deben ser positivas').optional(),
  project_id: z.string().optional(), // Para cuando no hay projectId en props
})

type TaskFormData = z.infer<typeof TaskFormSchema>

interface TaskFormDialogProps {
  projectId?: string
  workspaceId?: string // Necesario para cargar proyectos cuando no hay projectId
  onTaskCreated: (task: any) => void
}

export function TaskFormDialog({ projectId, workspaceId, onTaskCreated }: TaskFormDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [users, setUsers] = useState<any[]>([])
  const [loadingUsers, setLoadingUsers] = useState(false)
  const [projects, setProjects] = useState<any[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)

  // Log projectId cuando cambia para debugging
  useEffect(() => {
    console.log('🔍 TaskFormDialog - projectId recibido:', projectId)
    console.log('🔍 TaskFormDialog - workspaceId recibido:', workspaceId)
  }, [projectId, workspaceId])

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    getValues,
    watch,
    formState: { errors }
  } = useForm<TaskFormData>({
    resolver: zodResolver(TaskFormSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      assignee_id: 'unassigned',
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      estimate_hours: undefined,
      project_id: projectId || ''
    }
  })

  // Watch project_id para detectar cambios
  const selectedProjectId = watch('project_id')

  // Load users from Google Sheets
  useEffect(() => {
    const loadUsers = async () => {
      try {
        setLoadingUsers(true)
        const response = await fetch('/api/users')
        if (response.ok) {
          const usersData = await response.json()
          setUsers(usersData)
          console.log('✅ Users loaded from Google Sheets:', usersData)
        } else {
          console.error('Error loading users:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      } finally {
        setLoadingUsers(false)
      }
    }

    if (open) {
      loadUsers()
    }
  }, [open])

  // Load projects when dialog opens and no projectId is provided
  useEffect(() => {
    const loadProjects = async () => {
      if (!workspaceId || projectId) return // No necesitamos proyectos si ya hay projectId
      
      try {
        setLoadingProjects(true)
        const response = await fetch(`/api/projects?workspaceId=${workspaceId}`)
        if (response.ok) {
          const projectsData = await response.json()
          setProjects(projectsData)
          console.log('✅ Projects loaded from Google Sheets:', projectsData)
        } else {
          console.error('Error loading projects:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading projects:', error)
      } finally {
        setLoadingProjects(false)
      }
    }

    if (open && !projectId) {
      loadProjects()
    }
  }, [open, workspaceId, projectId])

  const onSubmit = async (data: TaskFormData) => {
    setLoading(true)
    try {
      console.log('🔍 TaskFormDialog onSubmit - projectId prop:', projectId)
      console.log('🔍 TaskFormDialog onSubmit - form data:', data)
      
      // Determinar el project_id a usar: del prop o del formulario
      const finalProjectId = projectId || data.project_id || ''
      
      // Validar que projectId esté presente y no sea "general" o vacío
      if (!finalProjectId || finalProjectId === 'general' || finalProjectId.trim() === '') {
        console.error('❌ TaskFormDialog: projectId inválido:', finalProjectId)
        alert('❌ Error: Debes seleccionar un cliente/proyecto para crear la tarea.')
        setLoading(false)
        return
      }

      // Validar que title esté presente y no esté vacío
      const title = data.title?.trim() || ''
      if (!title) {
        console.error('❌ TaskFormDialog: title vacío')
        alert('❌ Error: El título de la tarea es requerido')
        setLoading(false)
        return
      }
      
      const requestData = {
        project_id: finalProjectId.trim(),
        title: title,
        description: (data.description || '').trim(),
        priority: data.priority || 'medium',
        assignee_id: data.assignee_id === 'unassigned' ? '' : (data.assignee_id || ''),
        due_date: data.due_date || '',
        estimate_hours: data.estimate_hours || undefined
      }
      
      console.log('🚀 TaskFormDialog: Request data final:', requestData)
      
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      console.log('🚀 TaskFormDialog: Response status:', response.status)
      console.log('🚀 TaskFormDialog: Response ok:', response.ok)

      if (response.ok) {
        const newTask = await response.json()
        console.log('✅ TaskFormDialog: Task created in Google Sheets:', newTask)
        onTaskCreated(newTask)
        reset({
          title: '',
          description: '',
          priority: 'medium',
          assignee_id: 'unassigned',
          due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          estimate_hours: undefined,
          project_id: projectId || ''
        })
        setOpen(false)
        alert('✅ ¡Tarea creada exitosamente!')
      } else {
        const errorData = await response.json()
        console.error('❌ TaskFormDialog: Error creating task:', errorData)
        alert(`❌ Error al crear la tarea: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (error) {
      console.error('❌ TaskFormDialog: Error creating task:', error)
      alert('❌ Error de conexión. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          onClick={() => {
            console.log('TaskFormDialog trigger clicked!')
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nueva Tarea
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5 text-blue-600" />
            <span>Crear Nueva Tarea</span>
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {console.log('🔍 TaskFormDialog: Form errors:', errors)}
          {console.log('🔍 TaskFormDialog: Form state:', { open, loading })}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <Input
              {...register('title')}
              placeholder="Título de la tarea"
              className={errors.title ? 'border-red-500' : ''}
            />
            {errors.title && (
              <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
            )}
          </div>

          {/* Selector de Cliente/Proyecto - solo cuando no hay projectId */}
          {!projectId && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente/Proyecto <span className="text-red-500">*</span>
              </label>
              <Select
                onValueChange={(value) => setValue('project_id', value)}
                value={selectedProjectId || ''}
              >
                <SelectTrigger className={errors.project_id ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona un cliente/proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {loadingProjects ? (
                    <SelectItem value="loading" disabled>
                      Cargando proyectos...
                    </SelectItem>
                  ) : projects.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No hay proyectos disponibles
                    </SelectItem>
                  ) : (
                    projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        {project.name || 'Proyecto sin nombre'}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {!selectedProjectId && (
                <p className="text-red-500 text-xs mt-1">Debes seleccionar un cliente/proyecto</p>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción
            </label>
            <textarea
              {...register('description')}
              placeholder="Descripción de la tarea"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Asignar a
            </label>
            <Select
              onValueChange={(value) => setValue('assignee_id', value === 'unassigned' ? '' : value)}
              defaultValue="unassigned"
            >
              <SelectTrigger className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500">
                <SelectValue placeholder="Selecciona un miembro del equipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Sin asignar</SelectItem>
                {loadingUsers ? (
                  <SelectItem value="loading" disabled>
                    Cargando usuarios...
                  </SelectItem>
                        ) : (
                          users.map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              <div className="flex items-center space-x-2">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center text-xs font-medium text-blue-600">
                                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <span>{user.name || user.username || 'Usuario'}</span>
                              </div>
                            </SelectItem>
                          ))
                        )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Prioridad
              </label>
              <select
                {...register('priority')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="low">Baja</option>
                <option value="medium">Media</option>
                <option value="high">Alta</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de vencimiento
              </label>
              <Input
                type="date"
                {...register('due_date')}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimado de Horas
            </label>
            <Input
              type="number"
              {...register('estimate_hours', { valueAsNumber: true })}
              placeholder="Ej: 8, 16, 24"
              min="0"
              step="0.5"
              className={errors.estimate_hours ? 'border-red-500' : ''}
            />
            {errors.estimate_hours && (
              <p className="text-red-500 text-xs mt-1">{errors.estimate_hours.message}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              Opcional: Estima cuántas horas tomará completar esta tarea
            </p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creando...' : 'Crear Tarea'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
