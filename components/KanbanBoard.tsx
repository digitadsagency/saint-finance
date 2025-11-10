'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { TaskCard } from './TaskCard'
import { TaskDrawer } from './TaskDrawer'
import { TaskFormDialog } from './TaskFormDialog'
import { DebugPanel } from './DebugPanel'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Plus, MoreHorizontal, Bug } from 'lucide-react'
import { Task, Status } from '@/lib/validation'

// Componente para columnas droppables
function DroppableColumn({ 
  status, 
  label, 
  color, 
  children 
}: { 
  status: Status
  label: string
  color: string
  children: React.ReactNode
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: status,
  })

  console.log(`🎯 DroppableColumn ${status}:`, { isOver })

  return (
    <div 
      ref={setNodeRef} 
      className={`flex-shrink-0 w-80 ${isOver ? 'ring-2 ring-blue-500' : ''}`}
    >
      <div className={`${color} rounded-lg p-4`}>
        {children}
      </div>
    </div>
  )
}

interface KanbanBoardProps {
  tasks: Task[]
  projectId: string
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onTaskCreate: (task: Task) => void
}

const statusColumns: { status: Status; label: string; color: string }[] = [
  { status: 'backlog', label: 'Backlog', color: 'bg-gray-100' },
  { status: 'todo', label: 'Por Hacer', color: 'bg-blue-100' },
  { status: 'inprogress', label: 'En Progreso', color: 'bg-yellow-100' },
  { status: 'review', label: 'Revisión', color: 'bg-purple-100' },
  { status: 'done', label: 'Completado', color: 'bg-green-100' },
]

export function KanbanBoard({ tasks, projectId, onTaskUpdate, onTaskCreate }: KanbanBoardProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [showDebug, setShowDebug] = useState(false)
  const [users, setUsers] = useState<any[]>([]) // Add users state

  // Load users from Google Sheets
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const response = await fetch('/api/users')
        if (response.ok) {
          const usersData = await response.json()
          setUsers(usersData)
          console.log('✅ Users loaded in KanbanBoard:', usersData)
        } else {
          console.error('Error loading users:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading users:', error)
      }
    }

    loadUsers()
  }, [])

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id)
    setDraggedTask(task || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    setDraggedTask(null)

    if (!over) {
      console.log('No drop target found')
      return
    }

    const taskId = active.id as string
    const newStatus = over.id as Status

    console.log('Drag end:', { taskId, newStatus, overId: over.id })

    // Validar que el nuevo estado sea válido
    const validStatuses = statusColumns.map(col => col.status)
    if (!validStatuses.includes(newStatus)) {
      console.log('Invalid status:', newStatus)
      return
    }

    const task = tasks.find(t => t.id === taskId)
    if (task && task.status !== newStatus) {
      console.log('Updating task status:', taskId, 'from', task.status, 'to', newStatus)
      onTaskUpdate(taskId, { status: newStatus })
    }
  }

  const getTasksByStatus = (status: Status) => {
    return tasks.filter(task => task.status === status)
  }

  const getStatusColor = (status: Status) => {
    const column = statusColumns.find(col => col.status === status)
    return column?.color || 'bg-gray-100'
  }

  return (
    <div className="flex-1 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Vista Kanban</h2>
            <p className="text-sm text-gray-600 mt-1">
              Arrastra las tareas entre columnas para cambiar su estado
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
            >
              <Bug className="h-4 w-4 mr-1" />
              Debug
            </Button>
            <TaskFormDialog 
              projectId={projectId}
              onTaskCreated={onTaskCreate}
            />
          </div>
        </div>

      <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex space-x-6 overflow-x-auto pb-6">
          {statusColumns.map((column) => {
            const columnTasks = getTasksByStatus(column.status)
            
            return (
              <DroppableColumn
                key={column.status}
                status={column.status}
                label={column.label}
                color={column.color}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-900">{column.label}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {columnTasks.length}
                    </Badge>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      console.log('Column options for:', column.label)
                      // TODO: Show column options menu
                    }}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3 min-h-[200px]">
                  <SortableContext
                    items={columnTasks.map(task => task.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        users={users}
                        onClick={() => {
                          console.log('TaskCard clicked, opening drawer for task:', task.id)
                          setSelectedTask(task)
                        }}
                        onStatusChange={(taskId, newStatus) => {
                          console.log('KanbanBoard: Status change requested for task', taskId, 'to', newStatus)
                          onTaskUpdate(taskId, { status: newStatus })
                        }}
                        onPriorityChange={(taskId, newPriority) => {
                          console.log('KanbanBoard: Priority change requested for task', taskId, 'to', newPriority)
                          onTaskUpdate(taskId, { priority: newPriority })
                        }}
                      />
                    ))}
                    
                    {columnTasks.length === 0 && (
                      <div className="text-center py-8 text-gray-500">
                        <p className="text-sm">No hay tareas</p>
                      </div>
                    )}
                  </SortableContext>
                </div>
              </DroppableColumn>
            )
          })}
        </div>

        <DragOverlay>
          {draggedTask ? (
            <div className="opacity-50">
              <TaskCard task={draggedTask} users={users} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdate={(updates) => {
            onTaskUpdate(selectedTask.id, updates)
            setSelectedTask({ ...selectedTask, ...updates })
          }}
        />
      )}

      {/* Debug Panel */}
      <DebugPanel 
        isOpen={showDebug} 
        onClose={() => setShowDebug(false)} 
      />

      {/* Button Test Panel */}
    </div>
  )
}
