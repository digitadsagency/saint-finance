'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  CheckCircle, 
  User,
  Plus,
  Edit3,
  Trash2,
  Save
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'
import { toLocalYMD, formatYMDLongEs, parseLocalDateFromYMD } from '@/lib/time'

interface DailyLog {
  id: string
  user_id: string
  date: string
  content: string
  created_at: string
  updated_at: string
  author_name?: string
  author_avatar?: string
}

export default function DailyLogsPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [logs, setLogs] = useState<DailyLog[]>([])
  const [loading, setLoading] = useState(true)
  const [editingLog, setEditingLog] = useState<string | null>(null)
  const [newLogContent, setNewLogContent] = useState('')
  const [editingContent, setEditingContent] = useState('')
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Load daily logs
  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/daily-logs?userId=${user?.id}`)
        if (response.ok) {
          const logsData = await response.json()
          setLogs(logsData)
          console.log('✅ Daily logs loaded:', logsData)
        } else {
          console.error('Error loading logs:', response.statusText)
        }
      } catch (error) {
        console.error('Error loading logs:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadLogs()
    }
  }, [user])

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

  const handleCreateLog = async () => {
    if (!newLogContent.trim()) {
      error('Error', 'El contenido del log no puede estar vacío')
      return
    }

    try {
      const today = toLocalYMD(new Date())
      const response = await fetch('/api/daily-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          date: today,
          content: newLogContent.trim(),
        }),
      })

      if (response.ok) {
        const newLog = await response.json()
        setLogs(prevLogs => [newLog, ...prevLogs])
        setNewLogContent('')
        success('Log creado', 'Tu entrada diaria se ha guardado correctamente')
      } else {
        error('Error', 'No se pudo crear el log')
      }
    } catch (err) {
      console.error('Error creating log:', err)
      error('Error de conexión', 'No se pudo conectar con el servidor')
    }
  }

  const handleUpdateLog = async (logId: string) => {
    if (!editingContent.trim()) {
      error('Error', 'El contenido del log no puede estar vacío')
      return
    }

    try {
      const response = await fetch(`/api/daily-logs/${logId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: editingContent.trim(),
        }),
      })

      if (response.ok) {
        const updatedLog = await response.json()
        setLogs(prevLogs =>
          prevLogs.map(log =>
            log.id === logId ? updatedLog : log
          )
        )
        setEditingLog(null)
        setEditingContent('')
        success('Log actualizado', 'Tu entrada diaria se ha actualizado correctamente')
      } else {
        error('Error', 'No se pudo actualizar el log')
      }
    } catch (err) {
      console.error('Error updating log:', err)
      error('Error de conexión', 'No se pudo conectar con el servidor')
    }
  }

  const handleDeleteLog = async (logId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este log?')) {
      return
    }

    try {
      const response = await fetch(`/api/daily-logs/${logId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setLogs(prevLogs => prevLogs.filter(log => log.id !== logId))
        success('Log eliminado', 'Tu entrada diaria se ha eliminado correctamente')
      } else {
        error('Error', 'No se pudo eliminar el log')
      }
    } catch (err) {
      console.error('Error deleting log:', err)
      error('Error de conexión', 'No se pudo conectar con el servidor')
    }
  }

  const startEditing = (log: DailyLog) => {
    setEditingLog(log.id)
    setEditingContent(log.content)
  }

  const cancelEditing = () => {
    setEditingLog(null)
    setEditingContent('')
  }

  const formatDate = (dateString: string) => {
    return formatYMDLongEs(dateString)
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Group logs by date
  const logsByDate = logs.reduce((acc, log) => {
    if (!acc[log.date]) {
      acc[log.date] = []
    }
    acc[log.date].push(log)
    return acc
  }, {} as Record<string, DailyLog[]>)

  const sortedDates = Object.keys(logsByDate).sort(
    (a, b) => parseLocalDateFromYMD(b).getTime() - parseLocalDateFromYMD(a).getTime()
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
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
                  Logs Diarios
                </h1>
                <p className="text-sm text-gray-600">
                  Registra lo que hiciste cada día
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => router.push(`/workspaces/${params.id}/my-work`)}
              >
                <User className="h-4 w-4 mr-2" />
                Mi Trabajo
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Log Form */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Nueva Entrada para Hoy
            </h2>
            <div className="text-sm text-gray-500">
              {new Date().toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>
          <div className="space-y-4">
            <Textarea
              value={newLogContent}
              onChange={(e) => setNewLogContent(e.target.value)}
              placeholder="¿Qué hiciste hoy? Describe las tareas completadas, logros, desafíos, o cualquier cosa importante que quieras recordar..."
              className="min-h-[120px] resize-none"
            />
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {newLogContent.length} caracteres
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setNewLogContent('')}
                  disabled={!newLogContent.trim()}
                >
                  Limpiar
                </Button>
                <Button
                  onClick={handleCreateLog}
                  disabled={!newLogContent.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Guardar Entrada
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando logs...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No tienes logs diarios aún</p>
            <p className="text-sm text-gray-400">Crea tu primera entrada para comenzar</p>
          </div>
        ) : (
          <div className="space-y-6">
            {sortedDates.map((date) => (
              <div key={date} className="bg-white rounded-lg shadow-sm border">
                <div className="p-4 border-b bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      <h3 className="text-lg font-semibold text-gray-900 capitalize">
                        {formatDate(date)}
                      </h3>
                      <Badge variant="outline" className="text-gray-600">
                        {logsByDate[date].length} entrada{logsByDate[date].length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-200">
                  {logsByDate[date].map((log) => (
                    <div key={log.id} className="p-6 border-l-4 border-blue-200">
                      {editingLog === log.id ? (
                        <div className="space-y-4">
                          <Textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="min-h-[100px] resize-none"
                          />
                          <div className="flex justify-between items-center">
                            <div className="text-sm text-gray-500">
                              {editingContent.length} caracteres
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                variant="outline"
                                onClick={cancelEditing}
                              >
                                Cancelar
                              </Button>
                              <Button
                                onClick={() => handleUpdateLog(log.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <Save className="h-4 w-4 mr-2" />
                                Guardar
                              </Button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Author info for admins */}
                          {log.author_name && (
                            <div className="flex items-center space-x-2 mb-3">
                              <div className="text-sm font-medium text-gray-600">
                                {log.author_avatar} {log.author_name}
                              </div>
                              <div className="text-xs text-gray-400">•</div>
                              <div className="text-xs text-gray-500">
                                {log.user_id === user?.id ? 'Tú' : 'Otro usuario'}
                              </div>
                            </div>
                          )}
                          
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="prose prose-sm max-w-none">
                                <p className="text-gray-900 whitespace-pre-wrap leading-relaxed">
                                  {log.content}
                                </p>
                              </div>
                              <div className="flex items-center space-x-4 mt-4 text-sm text-gray-500">
                                <div className="flex items-center space-x-1">
                                  <Clock className="h-4 w-4" />
                                  <span>Creado: {formatTime(log.created_at)}</span>
                                </div>
                                {log.updated_at !== log.created_at && (
                                  <div className="flex items-center space-x-1">
                                    <Edit3 className="h-4 w-4" />
                                    <span>Editado: {formatTime(log.updated_at)}</span>
                                  </div>
                                )}
                                <div className="flex items-center space-x-1">
                                  <span className="text-gray-400">•</span>
                                  <span>{log.content.length} caracteres</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center space-x-1 ml-4">
                              {/* Solo permitir editar/eliminar logs propios */}
                              {log.user_id === user?.id && (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditing(log)}
                                    className="hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-4 w-4 text-blue-600" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteLog(log.id)}
                                    className="hover:bg-red-50 text-red-600 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
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
