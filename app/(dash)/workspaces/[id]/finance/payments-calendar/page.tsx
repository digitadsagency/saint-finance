'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/useAuth'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, DollarSign, Calendar as CalendarIcon, CheckCircle, AlertCircle, Plus, Edit, Trash2, RefreshCw } from 'lucide-react'
import { PaymentRecordDialog } from '@/components/PaymentRecordDialog'
import { toLocalYMD } from '@/lib/time'

function formatMXN(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0)
}

// Generar lista de meses para filtro
function getMonthOptions() {
  const options: { value: string; label: string }[] = []
  const now = new Date()
  // 12 meses atrás hasta 6 meses adelante
  for (let i = -12; i <= 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() + i, 1)
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
    const label = date.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
    options.push({ value, label: label.charAt(0).toUpperCase() + label.slice(1) })
  }
  return options
}

// Helper para determinar si un cliente estaba activo en un mes específico
// Lógica simple: si está pausado desde mes X, NO cuenta desde ese mes en adelante
function isClientActiveInMonth(project: any, monthStr: string): boolean {
  if (!project) return false
  
  // Si el cliente está completado, no está activo
  if (project.status === 'completed') return false
  
  // Si el cliente está activo, cuenta siempre
  if (project.status === 'active') return true
  
  // Cliente pausado - verificar desde qué mes está pausado
  if (project.status === 'paused') {
    const pausedAt = project.paused_at // YYYY-MM-DD
    
    // Si no tiene fecha de pausa específica, no cuenta
    if (!pausedAt) return false
    
    // Extraer el mes de pausa (YYYY-MM)
    const pausedMonth = pausedAt.substring(0, 7) // "2025-02-01" -> "2025-02"
    
    // Si el mes consultado es ANTERIOR al mes de pausa, el cliente estaba activo
    // Si el mes es IGUAL o POSTERIOR al mes de pausa, ya no está activo
    return monthStr < pausedMonth
  }
  
  return false
}

export default function PaymentsCalendarPage({ params }: { params: { id: string } }) {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [billings, setBillings] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [paymentRecords, setPaymentRecords] = useState<any[]>([])
  const [allPaymentRecords, setAllPaymentRecords] = useState<any[]>([]) // Todos los pagos históricos para estadísticas
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const [selectedDayForPayment, setSelectedDayForPayment] = useState<string | null>(null)
  const [selectedBillingForPayment, setSelectedBillingForPayment] = useState<string | null>(null)
  const [editingPayment, setEditingPayment] = useState<any | null>(null)
  const [summaryMonthFilter, setSummaryMonthFilter] = useState<string>(() => {
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  const [summaryStatusFilter, setSummaryStatusFilter] = useState<string>('all') // 'all', 'paid', 'pending', 'partial'
  const [isRefreshing, setIsRefreshing] = useState(false)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        
        const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
        
        // Cargar todos los pagos históricos (no solo del mes actual) para estadísticas completas
        const [billingsRes, projectsRes, paymentsResMonth, allPaymentsRes] = await Promise.all([
          fetch(`/api/finance/client-billing?workspaceId=${params.id}`).catch(() => null),
          fetch(`/api/projects?workspaceId=${params.id}`).catch(() => null),
          fetch(`/api/finance/payments?workspaceId=${params.id}&month=${monthStr}`).catch(() => null),
          fetch(`/api/finance/payments?workspaceId=${params.id}`).catch(() => null) // Todos los pagos históricos
        ])

        if (billingsRes?.ok) {
          const data = await billingsRes.json()
          setBillings(Array.isArray(data) ? data : [])
        }
        
        if (projectsRes?.ok) {
          const data = await projectsRes.json()
          setProjects(Array.isArray(data) ? data : [])
        }
        
        if (paymentsResMonth?.ok) {
          const data = await paymentsResMonth.json()
          setPaymentRecords(Array.isArray(data) ? data : [])
        }
        
        // Guardar todos los pagos históricos para estadísticas completas
        if (allPaymentsRes?.ok) {
          const allData = await allPaymentsRes.json()
          setAllPaymentRecords(Array.isArray(allData) ? allData : [])
        }
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    if (user) {
      loadData()
    }
  }, [user, params.id, selectedDate])

  // Calcular estadísticas - DEBE ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  const paymentStats = useMemo(() => {
    const onTime = paymentRecords.filter(pr => pr.is_on_time).length
    const late = paymentRecords.filter(pr => !pr.is_on_time).length
    const totalPaid = paymentRecords.reduce((sum, pr) => sum + Number(pr.paid_amount || 0), 0)
    const delayedPayments = paymentRecords.filter(pr => pr.days_delay && pr.days_delay > 0)
    const avgDaysDelay = delayedPayments.length > 0
      ? delayedPayments.reduce((sum, pr) => sum + (pr.days_delay || 0), 0) / delayedPayments.length
      : 0
    const totalDaysDelay = paymentRecords.reduce((sum, pr) => sum + (Number(pr.days_delay) || 0), 0)
    
    return { onTime, late, totalPaid, avgDaysDelay, totalDaysDelay }
  }, [paymentRecords])

  // Calcular estadísticas por cliente (usando TODOS los pagos históricos, no solo del mes actual)
  const clientPaymentStats = useMemo(() => {
    const statsByClient = new Map<string, {
      clientName: string
      totalPayments: number
      onTimePayments: number
      latePayments: number
      totalDaysDelay: number
      avgDaysDelay: number
      punctualityRate: number
    }>()

    // Usar todos los pagos históricos para estadísticas completas
    allPaymentRecords.forEach(pr => {
      const projectId = pr.project_id || pr.projectId
      const project = projects.find(p => p.id === projectId)
      const clientName = project?.name || 'Cliente desconocido'
      
      if (!statsByClient.has(projectId)) {
        statsByClient.set(projectId, {
          clientName,
          totalPayments: 0,
          onTimePayments: 0,
          latePayments: 0,
          totalDaysDelay: 0,
          avgDaysDelay: 0,
          punctualityRate: 0
        })
      }

      const stats = statsByClient.get(projectId)!
      stats.totalPayments += 1
      if (pr.is_on_time) {
        stats.onTimePayments += 1
      } else {
        stats.latePayments += 1
      }
      stats.totalDaysDelay += Number(pr.days_delay || 0)
    })

    // Calcular promedios y porcentajes
    statsByClient.forEach((stats, projectId) => {
      stats.avgDaysDelay = stats.latePayments > 0 
        ? stats.totalDaysDelay / stats.latePayments 
        : 0
      stats.punctualityRate = stats.totalPayments > 0
        ? (stats.onTimePayments / stats.totalPayments) * 100
        : 0
    })

    return Array.from(statsByClient.values())
      .sort((a, b) => b.totalDaysDelay - a.totalDaysDelay) // Ordenar por días de retraso acumulado
  }, [allPaymentRecords, projects])

  // Calcular totales del mes - DEBE ESTAR ANTES DE CUALQUIER RETURN CONDICIONAL
  // Solo incluir clientes activos EN EL MES SELECCIONADO
  const currentMonthStr = useMemo(() => {
    return `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
  }, [selectedDate])

  const totalMonthPayments = useMemo(() => {
    return billings.reduce((sum, b) => {
      const project = projects.find(p => p.id === (b.project_id || b.projectId))
      if (!isClientActiveInMonth(project, currentMonthStr)) return sum
      return sum + Number(b.monthly_amount || b.monthlyAmountMXN || 0)
    }, 0)
  }, [billings, projects, currentMonthStr])

  const uniqueClients = useMemo(() => {
    // Solo contar clientes activos en el mes actual
    return new Set(billings
      .filter(b => {
        const project = projects.find(p => p.id === (b.project_id || b.projectId))
        return isClientActiveInMonth(project, currentMonthStr)
      })
      .map(b => b.project_id || b.projectId)
    ).size
  }, [billings, projects, currentMonthStr])

  // Tabla de resumen de pagos del mes (solo clientes activos EN ESE MES) - con filtro independiente
  const monthlyPaymentSummary = useMemo(() => {
    if (!summaryMonthFilter) return []
    const [filterYear, filterMonth] = summaryMonthFilter.split('-').map(Number)
    
    const summary = billings
      .filter(b => {
        const project = projects.find(p => p.id === (b.project_id || b.projectId))
        return isClientActiveInMonth(project, summaryMonthFilter)
      })
      .map(b => {
        const project = projects.find(p => p.id === (b.project_id || b.projectId))
        const expectedAmount = Number(b.monthly_amount || b.monthlyAmountMXN || 0)
        const paymentDay = Number(b.payment_day || b.paymentDay || 0)
        const expectedDate = new Date(filterYear, filterMonth - 1, paymentDay)
        const expectedDateStr = toLocalYMD(expectedDate)
        
        // Buscar pagos de este cliente en este mes (más flexible)
        const paymentsForClient = allPaymentRecords.filter(pr => {
          const prProjectId = pr.project_id || pr.projectId
          const billingProjectId = b.project_id || b.projectId
          
          // Verificar si el pago corresponde a este billing o proyecto
          const matchesBilling = pr.billing_id === b.id
          const matchesProject = prProjectId === billingProjectId
          
          // Verificar si el pago es de este mes
          if (!pr.paid_date) return false
          const paidDate = new Date(pr.paid_date)
          const paidYear = paidDate.getFullYear()
          const paidMonth = paidDate.getMonth() + 1
          const isInMonth = paidYear === filterYear && paidMonth === filterMonth
          
          return isInMonth && (matchesBilling || matchesProject)
        })
        
        // Sumar todos los pagos del cliente en este mes
        const totalPaidAmount = paymentsForClient.reduce((sum, pr) => sum + Number(pr.paid_amount || 0), 0)
        const isPaid = totalPaidAmount > 0
        const isComplete = isPaid && totalPaidAmount >= expectedAmount
        const isPartial = isPaid && !isComplete
        
        // Usar el primer pago para determinar si fue a tiempo
        const mainPayment = paymentsForClient[0]
        const isOnTime = mainPayment ? mainPayment.is_on_time : false
        const daysDelay = mainPayment?.days_delay || 0
        
        return {
          clientName: project?.name || 'Cliente',
          projectId: b.project_id || b.projectId,
          expectedDate: expectedDateStr,
          expectedAmount,
          paidAmount: totalPaidAmount,
          isPaid,
          isComplete,
          isPartial,
          isOnTime,
          daysDelay,
          paymentId: mainPayment?.id,
          paymentsCount: paymentsForClient.length
        }
      })
      // Filtrar por estado
      .filter(item => {
        if (summaryStatusFilter === 'all') return true
        if (summaryStatusFilter === 'paid') return item.isComplete
        if (summaryStatusFilter === 'pending') return !item.isPaid
        if (summaryStatusFilter === 'partial') return item.isPartial
        return true
      })
      // Ordenar por fecha esperada (cronológico ascendente - antes primero)
      .sort((a, b) => new Date(a.expectedDate).getTime() - new Date(b.expectedDate).getTime())
    
    return summary
  }, [billings, projects, allPaymentRecords, summaryMonthFilter, summaryStatusFilter])

  // Función para refrescar datos
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
      
      const [billingsRes, projectsRes, paymentsResMonth, allPaymentsRes] = await Promise.all([
        fetch(`/api/finance/client-billing?workspaceId=${params.id}`),
        fetch(`/api/projects?workspaceId=${params.id}`),
        fetch(`/api/finance/payments?workspaceId=${params.id}&month=${monthStr}`),
        fetch(`/api/finance/payments?workspaceId=${params.id}`)
      ])

      if (billingsRes?.ok) {
        const data = await billingsRes.json()
        setBillings(Array.isArray(data) ? data : [])
      }
      
      if (projectsRes?.ok) {
        const data = await projectsRes.json()
        setProjects(Array.isArray(data) ? data : [])
      }
      
      if (paymentsResMonth?.ok) {
        const data = await paymentsResMonth.json()
        setPaymentRecords(Array.isArray(data) ? data : [])
      }
      
      if (allPaymentsRes?.ok) {
        const allData = await allPaymentsRes.json()
        setAllPaymentRecords(Array.isArray(allData) ? allData : [])
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Ahora sí, los returns condicionales DESPUÉS de todos los hooks
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!user) return null

  // Obtener pagos esperados por día del mes (solo clientes ACTIVOS EN EL MES ACTUAL)
  const getExpectedPaymentsForDay = (day: number) => {
    return billings.filter(b => {
      const paymentDay = Number(b.payment_day || b.paymentDay || 0)
      if (paymentDay !== day) return false
      // Solo incluir clientes activos en este mes
      const project = projects.find(p => p.id === (b.project_id || b.projectId))
      return isClientActiveInMonth(project, currentMonthStr)
    }).map(b => {
      const project = projects.find(p => p.id === (b.project_id || b.projectId))
      return {
        ...b,
        projectName: project?.name || 'Cliente',
        amount: Number(b.monthly_amount || b.monthlyAmountMXN || 0),
        isExpected: true
      }
    })
  }


  // Obtener pagos realizados por día del mes
  const getPaidPaymentsForDay = (date: Date) => {
    const dateStr = toLocalYMD(date)
    return paymentRecords
      .filter(pr => pr.paid_date === dateStr)
      .map(pr => {
        const billing = billings.find(b => b.id === pr.billing_id)
        const project = projects.find(p => p.id === (pr.project_id || billing?.project_id))
        return {
          ...pr,
          projectName: project?.name || 'Cliente',
          amount: Number(pr.paid_amount || 0),
          isExpected: false,
          isPaid: true,
          isOnTime: pr.is_on_time,
          daysDelay: pr.days_delay
        }
      })
  }

  const handleRegisterPayment = (date: Date, billingId?: string) => {
    const dateStr = toLocalYMD(date)
    setSelectedDayForPayment(dateStr)
    setSelectedBillingForPayment(billingId || null)
    setShowPaymentDialog(true)
  }

  const handleSubmitPayment = async (data: any) => {
    const currentUserName = (user?.name || '').toLowerCase()
    const isEditing = !!data.id
    
    const res = await fetch(isEditing ? '/api/finance/payments' : '/api/finance/payments', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_user: currentUserName,
        workspace_id: params.id,
        ...data
      })
    })
    if (res.ok) {
      const record = await res.json()
      if (isEditing) {
        setPaymentRecords(prev => prev.map(p => p.id === data.id ? record : p))
      } else {
        setPaymentRecords(prev => [...prev, record])
      }
      // Reload data
      const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
      const paymentsRes = await fetch(`/api/finance/payments?workspaceId=${params.id}&month=${monthStr}`)
      if (paymentsRes.ok) {
        const records = await paymentsRes.json()
        setPaymentRecords(Array.isArray(records) ? records : [])
      }
      // Also reload all payments for stats
      const allPaymentsRes = await fetch(`/api/finance/payments?workspaceId=${params.id}`)
      if (allPaymentsRes.ok) {
        const allData = await allPaymentsRes.json()
        setAllPaymentRecords(Array.isArray(allData) ? allData : [])
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(`Error al ${isEditing ? 'actualizar' : 'registrar'} pago: ${err.error || res.statusText}`)
      throw new Error(err.error || res.statusText)
    }
  }

  const handleEditPayment = (payment: any) => {
    setEditingPayment(payment)
    setSelectedDayForPayment(payment.paid_date)
    setSelectedBillingForPayment(payment.billing_id)
    setShowPaymentDialog(true)
  }

  const handleDeletePayment = async (paymentId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pago?')) {
      return
    }
    
    const currentUserName = (user?.name || '').toLowerCase()
    const res = await fetch(`/api/finance/payments?id=${paymentId}&current_user=${encodeURIComponent(currentUserName)}`, {
      method: 'DELETE'
    })
    
    if (res.ok) {
      setPaymentRecords(prev => prev.filter(p => p.id !== paymentId))
      setAllPaymentRecords(prev => prev.filter(p => p.id !== paymentId))
      // Reload data
      const monthStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}`
      const paymentsRes = await fetch(`/api/finance/payments?workspaceId=${params.id}&month=${monthStr}`)
      if (paymentsRes.ok) {
        const records = await paymentsRes.json()
        setPaymentRecords(Array.isArray(records) ? records : [])
      }
      const allPaymentsRes = await fetch(`/api/finance/payments?workspaceId=${params.id}`)
      if (allPaymentsRes.ok) {
        const allData = await allPaymentsRes.json()
        setAllPaymentRecords(Array.isArray(allData) ? allData : [])
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(`Error al eliminar pago: ${err.error || res.statusText}`)
    }
  }

  // Generar días del calendario
  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
  
  const year = selectedDate.getFullYear()
  const month = selectedDate.getMonth()
  
  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const daysInMonth = lastDayOfMonth.getDate()
  const startingDayOfWeek = firstDayOfMonth.getDay()

  const calendarDays: (Date | null)[] = []
  
  // Días del mes anterior
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Días del mes actual
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(new Date(year, month, day))
  }

  const isToday = (date: Date | null) => {
    if (!date) return false
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  }

  const isCurrentMonth = (date: Date | null) => {
    if (!date) return false
    return date.getMonth() === month
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => router.push(`/workspaces/${params.id}/finance`)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Volver
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Calendario de Pagos</h1>
                <p className="text-sm text-gray-600">Gestión de pagos de clientes</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={isRefreshing}
                size="sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? 'Actualizando...' : 'Actualizar'}
              </Button>
              <div className="text-right">
                <div className="text-xs text-gray-500">Total del mes</div>
                <div className="text-lg font-bold text-green-600">{formatMXN(totalMonthPayments)}</div>
              </div>
              <div className="text-right">
                <div className="text-xs text-gray-500">Clientes</div>
                <div className="text-lg font-bold text-blue-600">{uniqueClients}</div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Calendar Header */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold text-gray-900">
                {monthNames[month]} {year}
              </h2>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(year, month - 1, 1))}
                >
                  ←
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date())}
                >
                  Hoy
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedDate(new Date(year, month + 1, 1))}
                >
                  →
                </Button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="p-6">
            <div className="grid grid-cols-7 gap-1 mb-4">
              {dayNames.map((day) => (
                <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                  {day}
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((date, index) => {
                if (!date) {
                  return <div key={`empty-${index}`} className="min-h-[100px] p-1.5 bg-gray-50 rounded-lg" />
                }

                const expectedPayments = getExpectedPaymentsForDay(date.getDate())
                const paidPayments = getPaidPaymentsForDay(date)
                const isTodayDate = isToday(date)
                const isCurrentMonthDay = isCurrentMonth(date)
                const hasPayments = expectedPayments.length > 0 || paidPayments.length > 0

                return (
                  <div
                    key={index}
                    className={`
                      min-h-[100px] p-1.5 border border-gray-200 rounded-lg overflow-hidden
                      ${isCurrentMonthDay ? 'bg-white' : 'bg-gray-50'}
                      ${isTodayDate ? 'ring-2 ring-blue-500' : ''}
                      ${hasPayments ? 'bg-green-50/50 border-green-200' : ''}
                    `}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`
                        text-xs font-medium
                        ${isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'}
                        ${isTodayDate ? 'text-blue-600 font-bold' : ''}
                      `}>
                        {date.getDate()}
                      </span>
                      <div className="flex items-center gap-0.5">
                        {expectedPayments.length > 0 && (
                          <Badge className="bg-blue-100 text-blue-700 border-blue-300 text-[10px] px-1 py-0">
                            {expectedPayments.length}
                          </Badge>
                        )}
                        {paidPayments.length > 0 && (
                          <Badge className="bg-green-100 text-green-700 border-green-300 text-[10px] px-1 py-0">
                            ✓{paidPayments.length}
                          </Badge>
                        )}
                        {isCurrentMonthDay && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0"
                            onClick={() => handleRegisterPayment(date)}
                            title="Registrar pago"
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-0.5 max-h-[80px] overflow-y-auto">
                      {/* Pagos esperados - formato compacto */}
                      {expectedPayments.map((payment) => {
                        const hasPaid = paidPayments.some(pp => pp.billing_id === payment.id)
                        const paymentId = payment.id || payment.project_id || payment.projectId
                        return (
                          <div
                            key={`expected-${paymentId}`}
                            className={`px-1 py-0.5 rounded text-[10px] ${
                              hasPaid 
                                ? 'bg-green-200/50 text-green-800' 
                                : 'bg-yellow-100 text-yellow-800'
                            }`}
                            title={`${payment.projectName}: ${formatMXN(payment.amount)}`}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium truncate max-w-[60px]">
                                {payment.projectName}
                              </span>
                              <span className="font-semibold text-[9px] whitespace-nowrap">
                                {formatMXN(payment.amount).replace('MXN', '').replace('$', '$')}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                      
                      {/* Pagos realizados - formato compacto */}
                      {paidPayments.map((payment) => {
                        const paymentId = payment.id
                        return (
                          <div
                            key={`paid-${paymentId}`}
                            className={`px-1 py-0.5 rounded text-[10px] group cursor-pointer ${
                              payment.isOnTime 
                                ? 'bg-green-200 text-green-900' 
                                : 'bg-red-200 text-red-900'
                            }`}
                            title={`${payment.projectName}: ${formatMXN(payment.amount)}${!payment.isOnTime ? ` (${payment.daysDelay} días tarde)` : ''}`}
                            onClick={() => handleEditPayment(payment)}
                          >
                            <div className="flex items-center justify-between gap-1">
                              <div className="flex items-center gap-0.5 min-w-0">
                                {payment.isOnTime ? (
                                  <CheckCircle className="h-2.5 w-2.5 text-green-700 flex-shrink-0" />
                                ) : (
                                  <AlertCircle className="h-2.5 w-2.5 text-red-700 flex-shrink-0" />
                                )}
                                <span className="font-medium truncate max-w-[50px]">
                                  {payment.projectName}
                                </span>
                                {!payment.isOnTime && payment.daysDelay > 0 && (
                                  <span className="text-[8px] text-red-700">({payment.daysDelay}d)</span>
                                )}
                              </div>
                              <span className="font-semibold text-[9px] whitespace-nowrap">
                                {formatMXN(payment.amount).replace('MXN', '').replace('$', '$')}
                              </span>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Estadísticas de Puntualidad por Cliente - DESPUÉS del calendario */}
        {clientPaymentStats.length > 0 && (
          <section className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Estadísticas de Puntualidad por Cliente</h2>
              <p className="text-sm text-gray-600">Análisis histórico completo de todos los pagos registrados</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-3 pr-4 font-semibold">Cliente</th>
                    <th className="py-3 pr-4 font-semibold">Total Pagos</th>
                    <th className="py-3 pr-4 font-semibold">A Tiempo</th>
                    <th className="py-3 pr-4 font-semibold">Tardíos</th>
                    <th className="py-3 pr-4 font-semibold">Días Retraso Acumulado</th>
                    <th className="py-3 pr-4 font-semibold">Retraso Promedio</th>
                    <th className="py-3 pr-4 font-semibold">Puntualidad</th>
                  </tr>
                </thead>
                <tbody>
                  {clientPaymentStats.map((stats, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{stats.clientName}</td>
                      <td className="py-3 pr-4">{stats.totalPayments}</td>
                      <td className="py-3 pr-4">
                        <Badge className="bg-green-100 text-green-700 border-green-300">
                          {stats.onTimePayments}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <Badge className="bg-red-100 text-red-700 border-red-300">
                          {stats.latePayments}
                        </Badge>
                      </td>
                      <td className="py-3 pr-4">
                        <span className={`font-semibold ${stats.totalDaysDelay > 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {stats.totalDaysDelay} días
                        </span>
                      </td>
                      <td className="py-3 pr-4">
                        {stats.avgDaysDelay > 0 ? (
                          <span className="text-red-600">{stats.avgDaysDelay.toFixed(1)} días</span>
                        ) : (
                          <span className="text-green-600">0 días</span>
                        )}
                      </td>
                      <td className="py-3 pr-4">
                        <Badge 
                          className={
                            stats.punctualityRate >= 80 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : stats.punctualityRate >= 60 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }
                        >
                          {stats.punctualityRate.toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* Summary */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Mes</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
              <div className="text-sm text-gray-600 mb-1">Total a recibir</div>
              <div className="text-2xl font-bold text-green-700">{formatMXN(totalMonthPayments)}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
              <div className="text-sm text-gray-600 mb-1">Clientes activos</div>
              <div className="text-2xl font-bold text-blue-700">{uniqueClients}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
              <div className="text-sm text-gray-600 mb-1">Total recibido</div>
              <div className="text-2xl font-bold text-purple-700">{formatMXN(paymentStats.totalPaid)}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-green-300 bg-green-100">
              <div className="text-sm text-gray-600 mb-1">Pagos a tiempo</div>
              <div className="text-2xl font-bold text-green-800">{paymentStats.onTime}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-red-300 bg-red-100">
              <div className="text-sm text-gray-600 mb-1">Pagos atrasados</div>
              <div className="text-2xl font-bold text-red-800">{paymentStats.late}</div>
            </div>
            <div className="p-4 rounded-lg border-2 border-yellow-300 bg-yellow-100">
              <div className="text-sm text-gray-600 mb-1">Promedio días retraso</div>
              <div className="text-2xl font-bold text-yellow-800">
                {paymentStats.avgDaysDelay > 0 ? paymentStats.avgDaysDelay.toFixed(1) : '0'} días
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Total acumulado: {paymentStats.totalDaysDelay} días
              </div>
            </div>
          </div>
        </div>

        {/* Tabla de resumen de pagos del mes */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Resumen de Pagos del Mes</h3>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Mes:</label>
                <Select value={summaryMonthFilter} onValueChange={setSummaryMonthFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {getMonthOptions().map(opt => (
                      <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Estado:</label>
                <Select value={summaryStatusFilter} onValueChange={setSummaryStatusFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="paid">Pagados</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="partial">Parciales</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          {/* Resumen de totales */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
              <div className="text-xs text-gray-600">Total Esperado</div>
              <div className="text-lg font-bold text-blue-700">
                {formatMXN(monthlyPaymentSummary.reduce((sum, item) => sum + item.expectedAmount, 0))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-green-50 border border-green-200">
              <div className="text-xs text-gray-600">Total Recibido</div>
              <div className="text-lg font-bold text-green-700">
                {formatMXN(monthlyPaymentSummary.reduce((sum, item) => sum + item.paidAmount, 0))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
              <div className="text-xs text-gray-600">Pendiente</div>
              <div className="text-lg font-bold text-yellow-700">
                {formatMXN(monthlyPaymentSummary.reduce((sum, item) => sum + (item.expectedAmount - item.paidAmount), 0))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
              <div className="text-xs text-gray-600">% Cobrado</div>
              <div className="text-lg font-bold text-purple-700">
                {(() => {
                  const totalExpected = monthlyPaymentSummary.reduce((sum, item) => sum + item.expectedAmount, 0)
                  const totalPaid = monthlyPaymentSummary.reduce((sum, item) => sum + item.paidAmount, 0)
                  return totalExpected > 0 ? `${((totalPaid / totalExpected) * 100).toFixed(1)}%` : '0%'
                })()}
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Cliente</th>
                  <th className="text-left py-2 px-3 font-semibold text-gray-700">Fecha Esperada</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Monto Esperado</th>
                  <th className="text-right py-2 px-3 font-semibold text-gray-700">Monto Pagado</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Estado</th>
                  <th className="text-center py-2 px-3 font-semibold text-gray-700">Completo</th>
                </tr>
              </thead>
              <tbody>
                {monthlyPaymentSummary.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-4 text-gray-500">
                      No hay clientes activos con pagos programados este mes
                    </td>
                  </tr>
                ) : (
                  monthlyPaymentSummary.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-3 font-medium">{item.clientName}</td>
                      <td className="py-2 px-3 text-gray-600">
                        {new Date(item.expectedDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 px-3 text-right font-semibold">{formatMXN(item.expectedAmount)}</td>
                      <td className={`py-2 px-3 text-right ${item.isPaid ? 'font-semibold text-green-600' : 'text-gray-400'}`}>
                        {item.isPaid ? formatMXN(item.paidAmount) : '-'}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.isPaid ? (
                          <Badge className={item.isOnTime ? 'bg-green-100 text-green-700 border-green-300' : 'bg-red-100 text-red-700 border-red-300'}>
                            {item.isOnTime ? 'A tiempo' : `${item.daysDelay} días atraso`}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-300">Pendiente</Badge>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {item.isPaid ? (
                          <Badge className={item.isComplete ? 'bg-green-100 text-green-700 border-green-300' : 'bg-yellow-100 text-yellow-700 border-yellow-300'}>
                            {item.isComplete ? 'Completo' : 'Parcial'}
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-600 border-gray-300">-</Badge>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Payment Record Dialog */}
      <PaymentRecordDialog
        open={showPaymentDialog}
        onClose={() => {
          setShowPaymentDialog(false)
          setSelectedDayForPayment(null)
          setSelectedBillingForPayment(null)
          setEditingPayment(null)
        }}
        onSubmit={handleSubmitPayment}
        billings={billings}
        projects={projects}
        defaultDate={selectedDayForPayment || undefined}
        defaultBillingId={selectedBillingForPayment || undefined}
        editingPayment={editingPayment}
      />
    </div>
  )
}

