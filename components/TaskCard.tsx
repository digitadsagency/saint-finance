'use client'

import { memo } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Task, Status, Priority } from '@/lib/validation'
import { Badge } from './ui/badge'
import { Avatar, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import { formatDate, isPastDue } from '@/lib/time'
import { CheckCircle, Clock, AlertTriangle, Star, Edit3, MoreHorizontal, User } from 'lucide-react'
import { QuickActionButton } from './QuickActionButton'

// Helper function to get user info from Google Sheets data
const getUserInfo = (assigneeId: string, users: any[] = []) => {
  const user = users.find(u => u.id === assigneeId)
  if (!user) return { name: 'Sin asignar', initials: '?' }
  
  const name = user.name || user.username || 'Usuario'
  const initials = name.charAt(0).toUpperCase()
  return { name, initials }
}

interface TaskCardProps {
  task: Task
  onClick?: () => void
  onStatusChange?: (taskId: string, newStatus: Status) => void
  onPriorityChange?: (taskId: string, newPriority: Priority) => void
  users?: any[]
}

export const TaskCard = memo(function TaskCard({ task, onClick, onStatusChange, onPriorityChange, users = [] }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const getPriorityColor = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'med': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusColor = (status: Status) => {
    switch (status) {
      case 'done': return 'bg-green-100 text-green-800 border-green-200'
      case 'inprogress': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'todo': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'review': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'backlog': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityIcon = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="h-3 w-3" />
      case 'high': return <Star className="h-3 w-3" />
      case 'med': return <Clock className="h-3 w-3" />
      case 'low': return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getStatusIcon = (status: Status) => {
    switch (status) {
      case 'done': return <CheckCircle className="h-3 w-3" />
      case 'inprogress': return <Clock className="h-3 w-3" />
      case 'todo': return <Clock className="h-3 w-3" />
      case 'review': return <Clock className="h-3 w-3" />
      case 'backlog': return <Clock className="h-3 w-3" />
      default: return <Clock className="h-3 w-3" />
    }
  }

  const getAssigneeInitials = (name?: string) => {
    if (!name) return '?'
    return name.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  const isOverdue = task.due_date && isPastDue(task.due_date)

  const getStatusLabel = (status: Status) => {
    switch (status) {
      case 'backlog': return 'Backlog'
      case 'todo': return 'Por Hacer'
      case 'inprogress': return 'En Progreso'
      case 'review': return 'Revisión'
      case 'done': return 'Completado'
      default: return status
    }
  }

  const handleStatusChange = (newStatus: Status) => {
    console.log('TaskCard: Changing status from', task.status, 'to', newStatus)
    if (onStatusChange) {
      onStatusChange(task.id, newStatus)
      alert(`✅ Estado cambiado a: ${getStatusLabel(newStatus)}`)
    } else {
      console.warn('onStatusChange not provided to TaskCard')
      alert('⚠️ Función de cambio de estado no disponible')
    }
  }

  const getPriorityLabel = (priority: Priority) => {
    switch (priority) {
      case 'urgent': return 'Urgente'
      case 'high': return 'Alta'
      case 'med': return 'Media'
      case 'low': return 'Baja'
      default: return priority
    }
  }

  const handlePriorityChange = (newPriority: Priority) => {
    console.log('TaskCard: Changing priority from', task.priority, 'to', newPriority)
    if (onPriorityChange) {
      onPriorityChange(task.id, newPriority)
      alert(`✅ Prioridad cambiada a: ${getPriorityLabel(newPriority)}`)
    } else {
      console.warn('onPriorityChange not provided to TaskCard')
      alert('⚠️ Función de cambio de prioridad no disponible')
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`
        bg-white rounded-lg shadow-sm border p-4 cursor-pointer hover:shadow-md transition-all duration-200
        ${isDragging ? 'opacity-50 rotate-2' : ''}
        ${isOverdue ? 'border-red-200 bg-red-50' : ''}
        ${task.status === 'done' ? 'opacity-75' : ''}
        group
      `}
      onClick={onClick}
    >
      <div className="space-y-3">
        {/* Header with title and actions */}
        <div className="flex items-start justify-between">
          <h4 className="font-medium text-gray-900 text-sm line-clamp-2 flex-1 mr-2">
            {task.title}
          </h4>
          <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
              onClick={(e) => {
                e.stopPropagation()
                onClick?.()
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-6 w-6 p-0"
            >
              <MoreHorizontal className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Description */}
        {(task.description_md || task.description) && (
          <p className="text-xs text-gray-600 line-clamp-2">
            {(task.description_md || task.description || '').replace(/[#*`]/g, '').substring(0, 100)}
          </p>
        )}

        {/* Priority and Status badges */}
        <div className="flex items-center space-x-2">
          <Badge 
            className={`${getPriorityColor(task.priority)} text-xs flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Priority badge clicked!')
              const priorities: Priority[] = ['low', 'med', 'high', 'urgent']
              const currentIndex = priorities.indexOf(task.priority)
              const nextPriority = priorities[(currentIndex + 1) % priorities.length]
              console.log('Changing priority from', task.priority, 'to', nextPriority)
              handlePriorityChange(nextPriority)
            }}
          >
            {getPriorityIcon(task.priority)}
            <span className="capitalize">{task.priority}</span>
          </Badge>
          
          <Badge 
            className={`${getStatusColor(task.status)} text-xs flex items-center space-x-1 cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              console.log('Status badge clicked!')
              const statuses: Status[] = ['backlog', 'todo', 'inprogress', 'review', 'done']
              const currentIndex = statuses.indexOf(task.status)
              const nextStatus = statuses[(currentIndex + 1) % statuses.length]
              console.log('Changing status from', task.status, 'to', nextStatus)
              handleStatusChange(nextStatus)
            }}
          >
            {getStatusIcon(task.status)}
            <span className="capitalize">
              {task.status === 'inprogress' ? 'En Progreso' : 
               task.status === 'todo' ? 'Por Hacer' :
               task.status === 'done' ? 'Completado' :
               task.status === 'review' ? 'Revisión' : 'Backlog'}
            </span>
          </Badge>
        </div>

        {/* Labels */}
        {task.labels_csv && (
          <div className="flex flex-wrap gap-1">
            {task.labels_csv.split(',').slice(0, 3).map((label, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                {label.trim()}
              </Badge>
            ))}
            {task.labels_csv.split(',').length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{task.labels_csv.split(',').length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer with assignee and due date */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {task.assignee_id && (
              <div className="flex items-center space-x-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-800">
                    {getUserInfo(task.assignee_id, users).initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs text-gray-600">
                  {getUserInfo(task.assignee_id, users).name}
                </span>
              </div>
            )}
            {task.estimate_hours && (
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {task.estimate_hours}h
              </span>
            )}
          </div>

          {task.due_date && (
            <span className={`text-xs px-2 py-1 rounded ${
              isOverdue ? 'text-red-600 bg-red-100 font-medium' : 
              'text-gray-500 bg-gray-100'
            }`}>
              {formatDate(task.due_date)}
            </span>
          )}
        </div>

        {/* Quick action button */}
        <div className="flex items-center justify-between">
          <QuickActionButton
            currentStatus={task.status}
            onStatusChange={(newStatus) => {
              console.log('Changing status to:', newStatus)
              handleStatusChange(newStatus)
            }}
          />
          
          {task.status === 'done' && (
            <div className="flex items-center space-x-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs font-medium">Completado</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
})