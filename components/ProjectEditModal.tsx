'use client'

import { useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X, Save, Calendar, Users, Target } from 'lucide-react'

interface ProjectEditModalProps {
  isOpen: boolean
  onClose: () => void
  onProjectUpdated: (project: any) => void
  project: any | null
}

export function ProjectEditModal({ isOpen, onClose, onProjectUpdated, project }: ProjectEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'active' as 'active' | 'paused' | 'completed',
    // Audiovisual/Video
    monthly_reel_corto: 0,
    monthly_reel_largo: 0,
    monthly_reel: 0,
    monthly_video: 0,
    // Diseño
    monthly_diseno_simple: 0,
    monthly_diseno_complejo: 0,
    monthly_diseno: 0,
    // Fotos
    monthly_foto_simple: 0,
    monthly_foto_elaborada: 0,
    monthly_foto: 0,
    monthly_recording_sessions: 0
  })
  const [isLoading, setIsLoading] = useState(false)

  // Cargar datos del proyecto cuando se abre el modal
  useEffect(() => {
    if (isOpen && project) {
      setFormData({
        name: project.name || '',
        description: project.description || '',
        status: project.status || 'active',
        monthly_reel_corto: project.monthly_reel_corto || 0,
        monthly_reel_largo: project.monthly_reel_largo || 0,
        monthly_reel: project.monthly_reel || 0,
        monthly_video: project.monthly_video || 0,
        monthly_diseno_simple: project.monthly_diseno_simple || 0,
        monthly_diseno_complejo: project.monthly_diseno_complejo || 0,
        monthly_diseno: project.monthly_diseno || 0,
        monthly_foto_simple: project.monthly_foto_simple || 0,
        monthly_foto_elaborada: project.monthly_foto_elaborada || 0,
        monthly_foto: project.monthly_foto || 0,
        monthly_recording_sessions: project.monthly_recording_sessions || 0
      })
    }
  }, [isOpen, project])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!project?.id) return
    
    setIsLoading(true)

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          status: formData.status,
          priority: project.priority || 'medium',
          deadline: project.deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          // Audiovisual/Video
          monthly_reel_corto: formData.monthly_reel_corto,
          monthly_reel_largo: formData.monthly_reel_largo,
          monthly_reel: formData.monthly_reel,
          monthly_video: formData.monthly_video,
          // Diseño
          monthly_diseno_simple: formData.monthly_diseno_simple,
          monthly_diseno_complejo: formData.monthly_diseno_complejo,
          monthly_diseno: formData.monthly_diseno,
          // Fotos
          monthly_foto_simple: formData.monthly_foto_simple,
          monthly_foto_elaborada: formData.monthly_foto_elaborada,
          monthly_foto: formData.monthly_foto,
          monthly_recording_sessions: formData.monthly_recording_sessions
        }),
      })

      if (response.ok) {
        const updatedProject = await response.json()
        console.log('✅ Client updated in Google Sheets:', updatedProject)
        onProjectUpdated(updatedProject)
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Error updating client:', errorData)
        alert('❌ Error al actualizar el cliente. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error updating client:', error)
      alert('❌ Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen || !project) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Save className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Editar Cliente</h2>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del Cliente
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ej: Empresa ABC, Restaurante XYZ"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Información adicional sobre el cliente..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as 'active' | 'paused' | 'completed' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Activo</option>
              <option value="paused">Pausado</option>
              <option value="completed">Completado</option>
            </select>
          </div>

          {/* Audiovisual/Video */}
          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-blue-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                Audiovisual/Video (por mes)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reel Corto
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_reel_corto}
                    onChange={(e) => setFormData({ ...formData, monthly_reel_corto: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reel Largo
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_reel_largo}
                    onChange={(e) => setFormData({ ...formData, monthly_reel_largo: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Reel (genérico)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_reel}
                    onChange={(e) => setFormData({ ...formData, monthly_reel: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Video
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_video}
                    onChange={(e) => setFormData({ ...formData, monthly_video: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Diseño */}
            <div className="border rounded-lg p-4 bg-purple-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Target className="h-4 w-4 mr-2 text-purple-600" />
                Diseño (por mes)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Diseño Simple
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_diseno_simple}
                    onChange={(e) => setFormData({ ...formData, monthly_diseno_simple: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Diseño Complejo
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_diseno_complejo}
                    onChange={(e) => setFormData({ ...formData, monthly_diseno_complejo: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Diseño (genérico)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_diseno}
                    onChange={(e) => setFormData({ ...formData, monthly_diseno: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Fotos */}
            <div className="border rounded-lg p-4 bg-green-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Users className="h-4 w-4 mr-2 text-green-600" />
                Fotos (por mes)
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foto Simple
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_foto_simple}
                    onChange={(e) => setFormData({ ...formData, monthly_foto_simple: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foto Elaborada
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_foto_elaborada}
                    onChange={(e) => setFormData({ ...formData, monthly_foto_elaborada: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Foto (genérico)
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_foto}
                    onChange={(e) => setFormData({ ...formData, monthly_foto: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                </div>
              </div>
            </div>

            {/* Sesiones de Grabación */}
            <div className="border rounded-lg p-4 bg-indigo-50">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-indigo-600" />
                Sesiones de Grabación (por mes)
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Sesiones de Grabación
                  </label>
                  <Input
                    type="number"
                    value={formData.monthly_recording_sessions}
                    onChange={(e) => setFormData({ ...formData, monthly_recording_sessions: parseInt(e.target.value) || 0 })}
                    placeholder="0"
                    min="0"
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500 mt-1">Cada sesión cuenta como 3 horas de trabajo</p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name}
              className="flex-1 bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Guardando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Save className="h-4 w-4" />
                  <span>Guardar Cambios</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

