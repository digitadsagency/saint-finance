'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { X, Plus, Calendar, Users, Target } from 'lucide-react'

interface ClientCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onClientCreated: (client: any) => void
  workspaceId?: string
}

export function ClientCreationModal({ isOpen, onClose, onClientCreated, workspaceId }: ClientCreationModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workspace_id: workspaceId || 'demo',
          name: formData.name,
          description: formData.description,
          status: 'active',
          priority: 'medium',
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
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
        const newClient = await response.json()
        console.log('✅ Client created in Google Sheets:', newClient)
        onClientCreated(newClient)
        setFormData({
          name: '',
          description: '',
          monthly_reel_corto: 0,
          monthly_reel_largo: 0,
          monthly_reel: 0,
          monthly_video: 0,
          monthly_diseno_simple: 0,
          monthly_diseno_complejo: 0,
          monthly_diseno: 0,
          monthly_foto_simple: 0,
          monthly_foto_elaborada: 0,
          monthly_foto: 0,
          monthly_recording_sessions: 0
        })
        onClose()
      } else {
        const errorData = await response.json()
        console.error('Error creating client:', errorData)
        alert('❌ Error al crear el cliente. Inténtalo de nuevo.')
      }
    } catch (error) {
      console.error('Error creating client:', error)
      alert('❌ Error de conexión. Inténtalo de nuevo.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Plus className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Agregar Nuevo Cliente</h2>
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
                  <span>Agregando...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Agregar Cliente</span>
                </div>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
