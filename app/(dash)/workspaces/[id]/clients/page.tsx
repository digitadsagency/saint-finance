'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  FolderOpen,
  Search,
  Plus,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'
import { useAuth } from '@/lib/useAuth'
import { ClientCreationModal } from '@/components/ProjectCreationModal'
import { ProjectEditModal } from '@/components/ProjectEditModal'
import { ToastContainer } from '@/components/Toast'
import { useToast } from '@/lib/useToast'

export default function AllClientsPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [clients, setClients] = useState<any[]>([])
  const [tasks, setTasks] = useState<any[]>([])
  const [billings, setBillings] = useState<any[]>([])
  const [paymentRecords, setPaymentRecords] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<string>('name')
  const [showClientCreation, setShowClientCreation] = useState(false)
  const [showClientEdit, setShowClientEdit] = useState(false)
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const { toasts, removeToast, success, error } = useToast()

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  // Load data from Google Sheets
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        // Load clients
        const clientsResponse = await fetch(`/api/projects?workspaceId=${params.id}`)
        if (clientsResponse.ok) {
          const clientsData = await clientsResponse.json()
          setClients(clientsData)
          console.log('✅ Clients loaded:', clientsData)
        } else {
          console.error('Error loading clients:', clientsResponse.statusText)
        }
        
        // Load tasks
        const tasksResponse = await fetch(`/api/tasks?workspaceId=${params.id}`)
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData)
          console.log('✅ Tasks loaded:', tasksData)
        } else {
          console.error('Error loading tasks:', tasksResponse.statusText)
        }
        
        // Load billing data
        const billingsResponse = await fetch(`/api/finance/client-billing?workspaceId=${params.id}`)
        if (billingsResponse.ok) {
          const billingsData = await billingsResponse.json()
          setBillings(Array.isArray(billingsData) ? billingsData : [])
          console.log('✅ Billings loaded:', billingsData)
        } else {
          console.error('Error loading billings:', billingsResponse.statusText)
        }
        
        // Load payment records (last 12 months for better stats)
        const now = new Date()
        const paymentPromises = []
        for (let i = 0; i < 12; i++) {
          const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const monthStr = `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`
          paymentPromises.push(
            fetch(`/api/finance/payments?workspaceId=${params.id}&month=${monthStr}`)
              .then(res => res.ok ? res.json() : [])
              .catch(() => [])
          )
        }
        const paymentResults = await Promise.all(paymentPromises)
        const allPayments = paymentResults.flat()
        setPaymentRecords(Array.isArray(allPayments) ? allPayments : [])
        console.log('✅ Payment records loaded:', allPayments)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, params.id])

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

  const handleClientCreate = (newClient: any) => {
    setClients(prevClients => [...prevClients, newClient])
    success('Cliente creado', 'El nuevo cliente se ha creado exitosamente')
  }

  const handleClientUpdate = (updatedClient: any) => {
    setClients(prevClients => 
      prevClients.map(c => c.id === updatedClient.id ? updatedClient : c)
    )
    success('Cliente actualizado', 'Los cambios se han guardado exitosamente')
    setShowClientEdit(false)
    setSelectedClient(null)
  }

  // Calculate client metrics for sorting
  const getClientMetrics = (client: any) => {
    // Total videos per month
    const totalVideos = (Number(client.monthly_reel_corto) || 0) +
                       (Number(client.monthly_reel_largo) || 0) +
                       (Number(client.monthly_reel) || 0) +
                       (Number(client.monthly_video) || 0) +
                       (Number(client.monthly_videos) || 0)
    
    // Total designs per month
    const totalDesigns = (Number(client.monthly_diseno_simple) || 0) +
                        (Number(client.monthly_diseno_complejo) || 0) +
                        (Number(client.monthly_diseno) || 0) +
                        (Number(client.monthly_designs) || 0)
    
    // Total photos per month
    const totalPhotos = (Number(client.monthly_foto_simple) || 0) +
                       (Number(client.monthly_foto_elaborada) || 0) +
                       (Number(client.monthly_foto) || 0) +
                       (Number(client.monthly_photos) || 0)
    
    // Monthly amount from billing
    const clientBilling = billings.find(b => b.project_id === client.id)
    const monthlyAmount = clientBilling ? Number(clientBilling.monthly_amount) || 0 : 0
    
    // Payment delay stats
    const clientPayments = paymentRecords.filter(pr => pr.project_id === client.id)
    const delayedPayments = clientPayments.filter(pr => pr.days_delay && pr.days_delay > 0)
    const avgDelay = delayedPayments.length > 0
      ? delayedPayments.reduce((sum, pr) => sum + (Number(pr.days_delay) || 0), 0) / delayedPayments.length
      : 0
    // Total acumulado de días de retraso (suma de todos los días de retraso de todos los pagos)
    const totalDaysDelay = clientPayments.reduce((sum, pr) => sum + (Number(pr.days_delay) || 0), 0)
    // Número de pagos tardíos
    const totalLatePayments = delayedPayments.length
    // Número de pagos a tiempo
    const totalOnTimePayments = clientPayments.filter(pr => pr.is_on_time).length
    // Porcentaje de pagos puntuales
    const punctualityRate = clientPayments.length > 0 
      ? (totalOnTimePayments / clientPayments.length) * 100 
      : 0
    
    // Total tasks
    const clientTasks = tasks.filter(task => task.project_id === client.id)
    const totalTasks = clientTasks.length
    
    return {
      totalVideos,
      totalDesigns,
      totalPhotos,
      monthlyAmount,
      avgDelay,
      totalDaysDelay, // Días totales de retraso acumulado
      totalLatePayments, // Número de pagos tardíos
      totalOnTimePayments, // Número de pagos a tiempo
      punctualityRate, // Porcentaje de puntualidad
      totalTasks,
      totalDeliverables: totalVideos + totalDesigns + totalPhotos
    }
  }

  // Filter and sort clients
  let filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.description && client.description.toLowerCase().includes(searchQuery.toLowerCase()))
  )
  
  // Sort clients based on selected filter
  filteredClients = [...filteredClients].sort((a, b) => {
    const metricsA = getClientMetrics(a)
    const metricsB = getClientMetrics(b)
    
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name)
      case 'highest_payment':
        return metricsB.monthlyAmount - metricsA.monthlyAmount
      case 'lowest_payment':
        return metricsA.monthlyAmount - metricsB.monthlyAmount
      case 'most_delayed':
        return metricsB.avgDelay - metricsA.avgDelay
      case 'least_delayed':
        return metricsA.avgDelay - metricsB.avgDelay
      case 'most_total_delay':
        return metricsB.totalDaysDelay - metricsA.totalDaysDelay
      case 'most_punctual':
        return metricsA.punctualityRate - metricsB.punctualityRate
      case 'most_videos':
        return metricsB.totalVideos - metricsA.totalVideos
      case 'most_designs':
        return metricsB.totalDesigns - metricsA.totalDesigns
      case 'most_photos':
        return metricsB.totalPhotos - metricsA.totalPhotos
      case 'most_deliverables':
        return metricsB.totalDeliverables - metricsA.totalDeliverables
      case 'most_tasks':
        return metricsB.totalTasks - metricsA.totalTasks
      default:
        return 0
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
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
                  Todos los Clientes
                </h1>
                <p className="text-sm text-gray-600">
                  {clients.length} cliente{clients.length !== 1 ? 's' : ''} en total
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => setShowClientCreation(true)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="mb-6 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar clientes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          {/* Filter Selector */}
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
              Ordenar por:
            </label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="name">Nombre (A-Z)</option>
              <option value="highest_payment">Mayor pago mensual</option>
              <option value="lowest_payment">Menor pago mensual</option>
                 <option value="most_delayed">Más retraso promedio en pagos</option>
                 <option value="least_delayed">Menos retraso promedio en pagos</option>
                 <option value="most_total_delay">Más días de retraso acumulado</option>
                 <option value="most_punctual">Más puntual (pagos a tiempo)</option>
              <option value="most_videos">Más videos al mes</option>
              <option value="most_designs">Más diseños al mes</option>
              <option value="most_photos">Más fotos al mes</option>
              <option value="most_deliverables">Más entregables al mes</option>
              <option value="most_tasks">Más tareas totales</option>
            </select>
          </div>
        </div>

        {/* Clients List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Cargando clientes...</span>
          </div>
        ) : filteredClients.length === 0 ? (
          <div className="text-center py-12">
            <FolderOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">
              {searchQuery ? 'No se encontraron clientes' : 'No hay clientes aún'}
            </p>
            <p className="text-sm text-gray-400">
              {searchQuery ? 'Intenta con otro término de búsqueda' : 'Agrega tu primer cliente para comenzar'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map((client) => {
              const clientTasks = tasks.filter(task => task.project_id === client.id)
              const completedTasks = clientTasks.filter(task => task.status === 'done').length
              const inProgressTasks = clientTasks.filter(task => task.status === 'inprogress').length
              const todoTasks = clientTasks.filter(task => task.status === 'todo').length
              const completionRate = clientTasks.length > 0 
                ? Math.round((completedTasks / clientTasks.length) * 100) 
                : 0
              
              // Get client metrics for display
              const metrics = getClientMetrics(client)
              const clientBilling = billings.find(b => b.project_id === client.id)
              const clientPayments = paymentRecords.filter(pr => pr.project_id === client.id)
              const delayedPayments = clientPayments.filter(pr => pr.days_delay && pr.days_delay > 0)

              return (
                <div
                  key={client.id}
                  className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 
                        className="text-lg font-semibold text-gray-900 mb-1 cursor-pointer hover:text-blue-600"
                        onClick={() => router.push(`/workspaces/${params.id}/projects/${client.id}/clickup-list`)}
                      >
                        {client.name}
                      </h3>
                      {client.description && (
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {client.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedClient(client)
                          setShowClientEdit(true)
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </Button>
                      <FolderOpen 
                        className="h-5 w-5 text-gray-400 flex-shrink-0 cursor-pointer hover:text-blue-600"
                        onClick={() => router.push(`/workspaces/${params.id}/projects/${client.id}/clickup-list`)}
                      />
                    </div>
                  </div>

                  {/* Objetivos Mensuales */}
                  {(() => {
                    const hasSpecific = client.monthly_reel_corto || client.monthly_reel_largo || client.monthly_reel || 
                                      client.monthly_video || client.monthly_diseno_simple || client.monthly_diseno_complejo || 
                                      client.monthly_diseno || client.monthly_foto_simple || client.monthly_foto_elaborada || client.monthly_foto ||
                                      client.monthly_recording_sessions
                    const hasGeneral = client.monthly_videos || client.monthly_photos || client.monthly_designs
                    
                    if (hasSpecific || hasGeneral) {
                      return (
                        <div className="mb-4 pt-4 border-t border-gray-200">
                          <h4 className="text-xs font-semibold text-gray-700 mb-2">Objetivos Mensuales</h4>
                          <div className="space-y-2">
                            {/* Audiovisual/Video */}
                            {(client.monthly_reel_corto || client.monthly_reel_largo || client.monthly_reel || client.monthly_video || client.monthly_videos) > 0 && (
                              <div className="bg-blue-50 rounded p-2">
                                <div className="text-xs font-medium text-blue-700 mb-1">Audiovisual/Video</div>
                                <div className="flex flex-wrap gap-1">
                                  {client.monthly_reel_corto > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Reel Corto: {client.monthly_reel_corto}</Badge>
                                  )}
                                  {client.monthly_reel_largo > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Reel Largo: {client.monthly_reel_largo}</Badge>
                                  )}
                                  {client.monthly_reel > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Reel: {client.monthly_reel}</Badge>
                                  )}
                                  {client.monthly_video > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Video: {client.monthly_video}</Badge>
                                  )}
                                  {!hasSpecific && client.monthly_videos > 0 && (
                                    <Badge className="bg-blue-100 text-blue-700 text-xs">Videos: {client.monthly_videos}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Diseño */}
                            {(client.monthly_diseno_simple || client.monthly_diseno_complejo || client.monthly_diseno || client.monthly_designs) > 0 && (
                              <div className="bg-purple-50 rounded p-2">
                                <div className="text-xs font-medium text-purple-700 mb-1">Diseño</div>
                                <div className="flex flex-wrap gap-1">
                                  {client.monthly_diseno_simple > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Simple: {client.monthly_diseno_simple}</Badge>
                                  )}
                                  {client.monthly_diseno_complejo > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Complejo: {client.monthly_diseno_complejo}</Badge>
                                  )}
                                  {client.monthly_diseno > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Diseño: {client.monthly_diseno}</Badge>
                                  )}
                                  {!hasSpecific && client.monthly_designs > 0 && (
                                    <Badge className="bg-purple-100 text-purple-700 text-xs">Diseños: {client.monthly_designs}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Fotos */}
                            {(client.monthly_foto_simple || client.monthly_foto_elaborada || client.monthly_foto || client.monthly_photos) > 0 && (
                              <div className="bg-green-50 rounded p-2">
                                <div className="text-xs font-medium text-green-700 mb-1">Fotos</div>
                                <div className="flex flex-wrap gap-1">
                                  {client.monthly_foto_simple > 0 && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Simple: {client.monthly_foto_simple}</Badge>
                                  )}
                                  {client.monthly_foto_elaborada > 0 && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Elaborada: {client.monthly_foto_elaborada}</Badge>
                                  )}
                                  {client.monthly_foto > 0 && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Foto: {client.monthly_foto}</Badge>
                                  )}
                                  {!hasSpecific && client.monthly_photos > 0 && (
                                    <Badge className="bg-green-100 text-green-700 text-xs">Fotos: {client.monthly_photos}</Badge>
                                  )}
                                </div>
                              </div>
                            )}
                            
                            {/* Sesiones de Grabación */}
                            {client.monthly_recording_sessions > 0 && (
                              <div className="bg-indigo-50 rounded p-2">
                                <div className="text-xs font-medium text-indigo-700 mb-1">Sesiones de Grabación</div>
                                <div className="flex flex-wrap gap-1">
                                  <Badge className="bg-indigo-100 text-indigo-700 text-xs">
                                    Sesiones: {client.monthly_recording_sessions} ({client.monthly_recording_sessions * 3} horas)
                                  </Badge>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    }
                    return null
                  })()}

                  {/* Financial Info */}
                  {clientBilling && (
                    <div className="mb-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-gray-600">Pago mensual</span>
                        <span className="font-semibold text-green-600">
                          {clientBilling.monthly_amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Total de tareas</span>
                      <span className="font-medium text-gray-900">{clientTasks.length}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Completadas</span>
                      <span className="font-medium text-green-600">{completedTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">En progreso</span>
                      <span className="font-medium text-yellow-600">{inProgressTasks}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Por hacer</span>
                      <span className="font-medium text-blue-600">{todoTasks}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-600">Progreso</span>
                      <span className="font-medium text-gray-900">{completionRate}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 transition-all duration-300"
                        style={{ width: `${completionRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Action Button */}
                  <div className="mt-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full"
                      onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/workspaces/${params.id}/projects/${client.id}/clickup-list`)
                      }}
                    >
                      Ver Cliente
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      {/* Client Creation Modal */}
      {showClientCreation && (
        <ClientCreationModal
          isOpen={showClientCreation}
          workspaceId={params.id}
          onClose={() => setShowClientCreation(false)}
          onClientCreated={handleClientCreate}
        />
      )}

      {/* Client Edit Modal */}
      {showClientEdit && selectedClient && (
        <ProjectEditModal
          isOpen={showClientEdit}
          project={selectedClient}
          onClose={() => {
            setShowClientEdit(false)
            setSelectedClient(null)
          }}
          onProjectUpdated={handleClientUpdate}
        />
      )}

      <ToastContainer toasts={toasts} onClose={removeToast} />
    </div>
  )
}
