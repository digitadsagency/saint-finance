'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { X, CheckCircle, Clock, Users, TrendingUp, AlertTriangle } from 'lucide-react'

interface InteractiveModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'project' | 'members' | 'reports' | 'settings'
  title: string
}

export function InteractiveModal({ isOpen, onClose, type, title }: InteractiveModalProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true)
      // Simular carga de datos
      setTimeout(() => {
        setData(generateMockData(type))
        setIsLoading(false)
      }, 1000)
    }
  }, [isOpen, type])

  const generateMockData = (type: string) => {
    switch (type) {
      case 'project':
        return {
          projects: [
            { name: 'Campaña Redes Sociales', tasks: 8, completed: 3, efficiency: 85 },
            { name: 'Rediseño Web', tasks: 12, completed: 5, efficiency: 78 },
            { name: 'Análisis Competencia', tasks: 4, completed: 4, efficiency: 95 }
          ]
        }
      case 'members':
        return {
          members: [
            { name: 'María García', role: 'Owner', tasks: 8, efficiency: 92, avatar: '👩‍💼' },
            { name: 'Carlos López', role: 'Admin', tasks: 6, efficiency: 88, avatar: '👨‍💻' },
            { name: 'Ana Martín', role: 'Member', tasks: 5, efficiency: 85, avatar: '👩‍🎨' },
            { name: 'David Rodríguez', role: 'Member', tasks: 4, efficiency: 90, avatar: '👨‍🔬' },
            { name: 'Laura Sánchez', role: 'Member', tasks: 3, efficiency: 87, avatar: '👩‍💻' },
            { name: 'Juan Pérez', role: 'Member', tasks: 2, efficiency: 83, avatar: '👨‍🎨' },
            { name: 'Sofía González', role: 'Member', tasks: 1, efficiency: 89, avatar: '👩‍🔬' }
          ]
        }
      case 'reports':
        return {
          metrics: {
            totalTasks: 24,
            completedTasks: 8,
            efficiency: 78,
            avgCompletionTime: '2.3 días',
            teamProductivity: 85
          }
        }
      case 'settings':
        return {
          options: [
            'Cambiar nombre del workspace',
            'Gestionar permisos',
            'Configurar notificaciones',
            'Personalizar temas',
            'Exportar datos',
            'Configurar integraciones'
          ]
        }
      default:
        return null
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Cargando datos...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {type === 'project' && data?.projects && (
                <div className="space-y-3">
                  {data.projects.map((project: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">{project.name}</h3>
                          <p className="text-sm text-gray-600">
                            {project.completed}/{project.tasks} tareas completadas
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-600">
                              {project.efficiency}%
                            </span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-green-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${project.efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type === 'members' && data?.members && (
                <div className="space-y-3">
                  {data.members.map((member: any, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">{member.avatar}</span>
                          <div>
                            <h3 className="font-medium text-gray-900">{member.name}</h3>
                            <p className="text-sm text-gray-600">{member.role} • {member.tasks} tareas</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center space-x-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-600">
                              {member.efficiency}%
                            </span>
                          </div>
                          <div className="w-20 bg-gray-200 rounded-full h-2 mt-1">
                            <div 
                              className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                              style={{ width: `${member.efficiency}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {type === 'reports' && data?.metrics && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-5 w-5 text-blue-600" />
                      <span className="font-medium text-blue-900">Tareas Completadas</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-900 mt-2">
                      {data.metrics.completedTasks}/{data.metrics.totalTasks}
                    </p>
                    <p className="text-sm text-blue-700">
                      {Math.round((data.metrics.completedTasks / data.metrics.totalTasks) * 100)}% completado
                    </p>
                  </div>

                  <div className="bg-green-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <span className="font-medium text-green-900">Eficiencia del Equipo</span>
                    </div>
                    <p className="text-2xl font-bold text-green-900 mt-2">
                      {data.metrics.teamProductivity}%
                    </p>
                    <p className="text-sm text-green-700">
                      Tiempo promedio: {data.metrics.avgCompletionTime}
                    </p>
                  </div>

                  <div className="bg-yellow-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-yellow-600" />
                      <span className="font-medium text-yellow-900">Productividad</span>
                    </div>
                    <p className="text-2xl font-bold text-yellow-900 mt-2">
                      {data.metrics.efficiency}%
                    </p>
                    <p className="text-sm text-yellow-700">
                      Rendimiento general
                    </p>
                  </div>

                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-5 w-5 text-purple-600" />
                      <span className="font-medium text-purple-900">Equipo Activo</span>
                    </div>
                    <p className="text-2xl font-bold text-purple-900 mt-2">7</p>
                    <p className="text-sm text-purple-700">
                      Miembros trabajando
                    </p>
                  </div>
                </div>
              )}

              {type === 'settings' && data?.options && (
                <div className="space-y-3">
                  {data.options.map((option: string, index: number) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900">{option}</span>
                        <Button variant="outline" size="sm">
                          Configurar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
