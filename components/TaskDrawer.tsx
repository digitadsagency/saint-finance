'use client'

import { useState } from 'react'
import { Task, Priority, Status } from '@/lib/validation'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { 
  X, 
  Calendar, 
  Clock, 
  User, 
  Tag, 
  MessageSquare,
  Paperclip,
  Edit3,
  Save,
  Trash2
} from 'lucide-react'
import { formatDate, formatDateTime } from '@/lib/time'

interface TaskDrawerProps {
  task: Task
  onClose: () => void
  onUpdate: (updates: Partial<Task>) => void
}

export function TaskDrawer({ task, onClose, onUpdate }: TaskDrawerProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedTask, setEditedTask] = useState(task)

  const handleSave = async () => {
    try {
      await onUpdate(editedTask)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  const handleCancel = () => {
    setEditedTask(task)
    setIsEditing(false)
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'priority-urgent'
      case 'high': return 'priority-high'
      case 'med': return 'priority-med'
      case 'low': return 'priority-low'
      default: return 'priority-low'
    }
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
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex justify-end">
      <div className="bg-white w-full max-w-2xl h-full overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {isEditing ? (
                <Input
                  value={editedTask.title}
                  onChange={(e) => setEditedTask({ ...editedTask, title: e.target.value })}
                  className="text-lg font-semibold"
                />
              ) : (
                <h2 className="text-lg font-semibold text-gray-900">{task.title}</h2>
              )}
            </div>
            <div className="flex items-center space-x-2">
              {isEditing ? (
                <>
                  <Button size="sm" onClick={handleSave}>
                    <Save className="h-4 w-4 mr-1" />
                    Guardar
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancel}>
                    Cancelar
                  </Button>
                </>
              ) : (
                <>
                  <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
                    <Edit3 className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                  <Button size="sm" variant="outline" onClick={onClose}>
                    <X className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Status and Priority */}
          <div className="flex items-center space-x-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Estado</label>
              {isEditing ? (
                <select
                  value={editedTask.status}
                  onChange={(e) => setEditedTask({ ...editedTask, status: e.target.value as Status })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="backlog">Backlog</option>
                  <option value="todo">Por Hacer</option>
                  <option value="inprogress">En Progreso</option>
                  <option value="review">Revisión</option>
                  <option value="done">Completado</option>
                </select>
              ) : (
                <Badge className={getStatusColor(task.status)}>
                  {task.status}
                </Badge>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Prioridad</label>
              {isEditing ? (
                <select
                  value={editedTask.priority}
                  onChange={(e) => setEditedTask({ ...editedTask, priority: e.target.value as Priority })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="low">Baja</option>
                  <option value="med">Media</option>
                  <option value="high">Alta</option>
                  <option value="urgent">Urgente</option>
                </select>
              ) : (
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-700">Descripción</label>
            {isEditing ? (
              <textarea
                value={editedTask.description_md || ''}
                onChange={(e) => setEditedTask({ ...editedTask, description_md: e.target.value })}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                rows={4}
                placeholder="Describe la tarea..."
              />
            ) : (
              <div className="mt-1 p-3 bg-gray-50 rounded-md">
                {task.description_md ? (
                  <p className="text-sm text-gray-700">{task.description_md}</p>
                ) : (
                  <p className="text-sm text-gray-500 italic">Sin descripción</p>
                )}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Fecha de vencimiento</label>
              {isEditing ? (
                <Input
                  type="date"
                  value={editedTask.due_date || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, due_date: e.target.value })}
                  className="mt-1"
                />
              ) : (
                <div className="mt-1 flex items-center text-sm text-gray-600">
                  <Calendar className="h-4 w-4 mr-1" />
                  {task.due_date ? formatDate(task.due_date) : 'Sin fecha'}
                </div>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Estimación</label>
              {isEditing ? (
                <Input
                  type="number"
                  value={editedTask.estimate_hours || ''}
                  onChange={(e) => setEditedTask({ ...editedTask, estimate_hours: parseInt(e.target.value) || undefined })}
                  className="mt-1"
                  placeholder="Horas"
                />
              ) : (
                <div className="mt-1 flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  {task.estimate_hours ? `${task.estimate_hours}h` : 'Sin estimación'}
                </div>
              )}
            </div>
          </div>

          {/* Assignee */}
          <div>
            <label className="text-sm font-medium text-gray-700">Asignado a</label>
            {isEditing ? (
              <Input
                value={editedTask.assignee_id || ''}
                onChange={(e) => setEditedTask({ ...editedTask, assignee_id: e.target.value })}
                className="mt-1"
                placeholder="ID del usuario"
              />
            ) : (
              <div className="mt-1 flex items-center text-sm text-gray-600">
                <User className="h-4 w-4 mr-1" />
                {task.assignee_id ? (
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {task.assignee_id.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span>Usuario {task.assignee_id.substring(0, 8)}</span>
                  </div>
                ) : (
                  'Sin asignar'
                )}
              </div>
            )}
          </div>

          {/* Labels */}
          <div>
            <label className="text-sm font-medium text-gray-700">Etiquetas</label>
            {isEditing ? (
              <Input
                value={editedTask.labels_csv || ''}
                onChange={(e) => setEditedTask({ ...editedTask, labels_csv: e.target.value })}
                className="mt-1"
                placeholder="etiqueta1, etiqueta2, etiqueta3"
              />
            ) : (
              <div className="mt-1">
                {task.labels_csv ? (
                  <div className="flex flex-wrap gap-1">
                    {task.labels_csv.split(',').map((label, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tag className="h-3 w-3 mr-1" />
                        {label.trim()}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Sin etiquetas</p>
                )}
              </div>
            )}
          </div>

          {/* Comments Section */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Comentarios</h3>
              <Button size="sm" variant="outline">
                <MessageSquare className="h-4 w-4 mr-1" />
                Nuevo comentario
              </Button>
            </div>
            <div className="space-y-3">
              {/* Mock comments */}
              <div className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-start space-x-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">MG</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">María García</span>
                      <span className="text-xs text-gray-500">
                        {formatDateTime(new Date().toISOString())}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 mt-1">
                      He empezado a trabajar en esta tarea. ¿Podrías revisar los requisitos?
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Attachments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-700">Archivos adjuntos</h3>
              <Button size="sm" variant="outline">
                <Paperclip className="h-4 w-4 mr-1" />
                Adjuntar archivo
              </Button>
            </div>
            <div className="text-sm text-gray-500">
              No hay archivos adjuntos
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
