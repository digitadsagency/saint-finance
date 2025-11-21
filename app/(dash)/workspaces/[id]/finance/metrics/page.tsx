'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

function formatMXN(value: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(value || 0)
}

function getDefaultMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
}

export default function FinanceMetricsPage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [month, setMonth] = useState<string>(getDefaultMonth())
  const [metrics, setMetrics] = useState<any | null>(null)
  const [loadingMetrics, setLoadingMetrics] = useState(false)
  const [monthlyUtilidad, setMonthlyUtilidad] = useState<any[]>([])
  const [loadingMonthly, setLoadingMonthly] = useState(false)
  const isAdmin = useMemo(() => {
    const name = (user?.name || '').toLowerCase()
    return name === 'miguel' || name === 'raul'
  }, [user])

  useEffect(() => {
    if (!loading && !user) router.push('/sign-in')
  }, [user, loading, router])

  useEffect(() => {
    if (!loading && user && !isAdmin) router.push(`/workspaces/${params.id}/dashboard`)
  }, [loading, user, isAdmin, params.id, router])

  const fetchMetrics = useCallback(async (m: string) => {
    setLoadingMetrics(true)
    try {
      const res = await fetch(`/api/metrics?month=${m}&workspaceId=${params.id}`, { cache: 'no-store' })
      if (!res.ok) {
        const errorText = await res.text()
        console.error('Error response:', errorText)
        throw new Error(`Error al cargar métricas: ${res.status} ${res.statusText}`)
      }
      const data = await res.json()
      console.log('Metrics data received:', data)
      console.log('Totals:', data.totals)
      console.log('Totals breakdown:', {
        ingresos: data.totals?.ingresos,
        ingresosEsperados: data.totals?.ingresosEsperados,
        ingresosReales: data.totals?.ingresosReales,
        ingresosVariables: data.totals?.ingresosVariables,
        costoNomina: data.totals?.costoNomina,
        totalGastos: data.totals?.totalGastos,
        gastosFijos: data.totals?.gastosFijos,
        costoLabor: data.totals?.costoLabor,
        costoTotal: data.totals?.costoTotal,
        utilidad: data.totals?.utilidad
      })
      console.log('Employees count:', data.employees?.length)
      console.log('Clients count:', data.clients?.length)
      setMetrics(data)
    } catch (e) {
      console.error('Error fetching metrics:', e)
      setMetrics(null)
      alert(`No se pudieron cargar las métricas: ${e instanceof Error ? e.message : 'Error desconocido'}`)
    } finally {
      setLoadingMetrics(false)
    }
  }, [params.id])

  useEffect(() => { if (isAdmin) fetchMetrics(month) }, [isAdmin, month, fetchMetrics])

  const fetchMonthlyUtilidad = useCallback(async () => {
    setLoadingMonthly(true)
    try {
      const now = new Date()
      const currentYear = now.getFullYear()
      const startMonth = `${currentYear}-01`
      const endMonth = `${currentYear}-12`
      
      const res = await fetch(`/api/metrics/monthly-utilidad?workspaceId=${params.id}&startMonth=${startMonth}&endMonth=${endMonth}`, { cache: 'no-store' })
      if (!res.ok) throw new Error('Error al cargar utilidad mensual')
      const data = await res.json()
      setMonthlyUtilidad(data.monthlyData || [])
    } catch (e) {
      console.error('Error fetching monthly utility:', e)
    } finally {
      setLoadingMonthly(false)
    }
  }, [params.id])

  useEffect(() => { if (isAdmin) fetchMonthlyUtilidad() }, [isAdmin, fetchMonthlyUtilidad])

  if (!user || !isAdmin) return null

  if (loadingMetrics && !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">Cargando métricas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Métricas Financieras</h1>
              <p className="text-sm text-gray-600">Solo visible para administradores</p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="border rounded px-3 py-2 text-sm"
              />
              <Button onClick={() => fetchMetrics(month)} disabled={loadingMetrics}>
                {loadingMetrics ? 'Actualizando...' : 'Actualizar'}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Resumen Global */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen del Mes</h2>
          {metrics?.totals ? (
            <div className="space-y-6">
              {/* Ingresos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className="text-sm text-gray-600 mb-1">Ingresos Esperados</div>
                  <div className="text-2xl font-bold text-blue-700">{formatMXN(metrics.totals.ingresosEsperados || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Facturación mensual</div>
                </div>
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                  <div className="text-sm text-gray-600 mb-1">Pagos Recibidos</div>
                  <div className="text-2xl font-bold text-green-700">{formatMXN(metrics.totals.ingresosReales || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.totals.ingresosEsperados > 0 
                      ? `${((metrics.totals.ingresosReales || 0) / metrics.totals.ingresosEsperados * 100).toFixed(1)}%` 
                      : '0%'} recibido
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                  <div className="text-sm text-gray-600 mb-1">Ingresos Variables</div>
                  <div className="text-2xl font-bold text-purple-700">{formatMXN(metrics.totals.ingresosVariables || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Sesiones únicas, etc.</div>
                </div>
                <div className="p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50">
                  <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
                  <div className="text-2xl font-bold text-indigo-700">{formatMXN(metrics.totals.ingresos || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Recibidos + Variables</div>
                </div>
              </div>

              {/* Costos */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
                  <div className="text-sm text-gray-600 mb-1">Costo de Nómina</div>
                  <div className="text-2xl font-bold text-red-700">{formatMXN(metrics.totals.costoNomina || 0)}</div>
                </div>
                <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
                  <div className="text-sm text-gray-600 mb-1">Gastos del Mes</div>
                  <div className="text-2xl font-bold text-orange-700">{formatMXN(metrics.totals.totalGastos || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Fijos: {formatMXN(metrics.totals.gastosFijos || 0)} | 
                    Variables: {formatMXN(metrics.totals.gastosVariables || 0)} | 
                    MSI: {formatMXN(metrics.totals.gastosMSI || 0)}
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-pink-200 bg-pink-50">
                  <div className="text-sm text-gray-600 mb-1">Costo Laboral</div>
                  <div className="text-2xl font-bold text-pink-700">{formatMXN(metrics.totals.costoLabor || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Horas trabajadas</div>
                </div>
                <div className="p-4 rounded-lg border-2 border-red-300 bg-red-100">
                  <div className="text-sm text-gray-600 mb-1">Costo Total</div>
                  <div className="text-2xl font-bold text-red-800">{formatMXN(metrics.totals.costoTotal || 0)}</div>
                  <div className="text-xs text-gray-500 mt-1">Nómina + Gastos + Laboral</div>
                </div>
              </div>

              {/* Utilidad */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border-2 border-green-300 bg-green-100">
                  <div className="text-sm text-gray-600 mb-1">Utilidad del Mes</div>
                  <div className={`text-2xl font-bold ${(metrics.totals.utilidad || 0) >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                    {formatMXN(metrics.totals.utilidad || 0)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {metrics.totals.utilidadPct !== null 
                      ? `${(metrics.totals.utilidadPct * 100).toFixed(1)}%` 
                      : 'N/A'} de utilidad
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ingresos reales - Costos totales
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-blue-300 bg-blue-100">
                  <div className="text-sm text-gray-600 mb-1">Margen Esperado</div>
                  <div className="text-2xl font-bold text-blue-800">{formatMXN(metrics.totals.margenAbs || 0)}</div>
                  <div className="text-xs text-gray-600 mt-1">
                    {metrics.totals.margenPct !== null 
                      ? `${(metrics.totals.margenPct * 100).toFixed(1)}%` 
                      : 'N/A'} de margen
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Ingresos esperados - Costo laboral
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-500">Sin datos disponibles</div>
          )}
        </section>

        {/* Utilidad Mensual por Mes */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Utilidad Mensual (Año {new Date().getFullYear()})</h2>
          {loadingMonthly ? (
            <div className="text-sm text-gray-500">Cargando datos mensuales...</div>
          ) : monthlyUtilidad.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-3 pr-4 font-semibold">Mes</th>
                    <th className="py-3 pr-4 font-semibold text-right">Ingresos Esperados</th>
                    <th className="py-3 pr-4 font-semibold text-right">Pagos Recibidos</th>
                    <th className="py-3 pr-4 font-semibold text-right">Ingresos Variables</th>
                    <th className="py-3 pr-4 font-semibold text-right">Ingresos Totales</th>
                    <th className="py-3 pr-4 font-semibold text-right">Costos Totales</th>
                    <th className="py-3 pr-4 font-semibold text-right">Utilidad</th>
                    <th className="py-3 pr-4 font-semibold text-right">% Utilidad</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyUtilidad.map((m: any) => (
                    <tr key={m.month} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{m.monthName} {m.year}</td>
                      <td className="py-3 pr-4 text-right">{formatMXN(m.ingresosEsperados)}</td>
                      <td className={`py-3 pr-4 text-right ${m.ingresosReales < m.ingresosEsperados ? 'text-orange-600 font-medium' : 'text-gray-900'}`}>
                        {formatMXN(m.ingresosReales)}
                        {m.ingresosEsperados > 0 && (
                          <span className="text-xs text-gray-500 block">
                            ({((m.ingresosReales / m.ingresosEsperados) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </td>
                      <td className="py-3 pr-4 text-right">{formatMXN(m.ingresosVariables)}</td>
                      <td className="py-3 pr-4 text-right font-medium">{formatMXN(m.ingresosTotales)}</td>
                      <td className="py-3 pr-4 text-right">{formatMXN(m.costoTotal)}</td>
                      <td className={`py-3 pr-4 text-right font-bold ${m.utilidad >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {formatMXN(m.utilidad)}
                      </td>
                      <td className={`py-3 pr-4 text-right ${m.utilidadPct !== null ? (m.utilidadPct >= 0 ? 'text-green-700' : 'text-red-700') : 'text-gray-500'}`}>
                        {m.utilidadPct !== null ? `${m.utilidadPct.toFixed(1)}%` : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300 font-bold">
                    <td className="py-3 pr-4">Total</td>
                    <td className="py-3 pr-4 text-right">{formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.ingresosEsperados, 0))}</td>
                    <td className="py-3 pr-4 text-right">{formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.ingresosReales, 0))}</td>
                    <td className="py-3 pr-4 text-right">{formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.ingresosVariables, 0))}</td>
                    <td className="py-3 pr-4 text-right">{formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.ingresosTotales, 0))}</td>
                    <td className="py-3 pr-4 text-right">{formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.costoTotal, 0))}</td>
                    <td className={`py-3 pr-4 text-right ${monthlyUtilidad.reduce((sum: number, m: any) => sum + m.utilidad, 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatMXN(monthlyUtilidad.reduce((sum: number, m: any) => sum + m.utilidad, 0))}
                    </td>
                    <td className="py-3 pr-4 text-right text-gray-500">-</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No hay datos mensuales disponibles</div>
          )}
        </section>

        {/* Empleados */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Empleados</h2>
          {metrics?.employees && metrics.employees.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-600 border-b">
                    <th className="py-3 pr-4 font-semibold">Empleado</th>
                    <th className="py-3 pr-4 font-semibold">Sueldo Mensual</th>
                    <th className="py-3 pr-4 font-semibold">Horas Trabajadas</th>
                    <th className="py-3 pr-4 font-semibold">Costo por Hora</th>
                    <th className="py-3 pr-4 font-semibold">Utilización</th>
                  </tr>
                </thead>
                <tbody>
                  {metrics.employees.map((e: any) => (
                    <tr key={e.employeeId} className="border-b hover:bg-gray-50">
                      <td className="py-3 pr-4 font-medium">{e.name}</td>
                      <td className="py-3 pr-4">{formatMXN(e.sueldoMensual)}</td>
                      <td className="py-3 pr-4">{e.horasMes.toFixed(1)} h</td>
                      <td className="py-3 pr-4 font-medium">{formatMXN(Math.round(e.costoHoraReal))}</td>
                      <td className="py-3 pr-4">
                        <Badge 
                          className={
                            e.utilizacion >= 0.8 
                              ? 'bg-green-100 text-green-700 border-green-300' 
                              : e.utilizacion >= 0.6 
                              ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              : 'bg-red-100 text-red-700 border-red-300'
                          }
                        >
                          {(e.utilizacion * 100).toFixed(0)}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500">No hay empleados con datos en este mes</div>
          )}
        </section>

        {/* Análisis de Capacidad del Equipo */}
        {metrics?.capacityAnalysis && (
          <section className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Capacidad del Equipo vs Demanda</h2>
            <div className="space-y-4">
              {/* Resumen Principal */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                  <div className="text-xs text-gray-600 mb-1">Total de Clientes</div>
                  <div className="text-2xl font-bold text-blue-700">{metrics.capacityAnalysis.totalClientes}</div>
                </div>
                <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                  <div className="text-xs text-gray-600 mb-1">Capacidad Total del Equipo</div>
                  <div className="text-2xl font-bold text-green-700">{metrics.capacityAnalysis.totalCapacidadEquipo.toFixed(0)} h/mes</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.employees?.length || 0} empleado{metrics.employees?.length !== 1 ? 's' : ''} × 6h/día × 5 días/semana × 4 semanas = {metrics.employees?.length || 0} × 120 h/mes = {metrics.capacityAnalysis.totalCapacidadEquipo.toFixed(0)} h/mes
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-purple-200 bg-purple-50">
                  <div className="text-xs text-gray-600 mb-1">Horas Requeridas (Clientes)</div>
                  <div className="text-2xl font-bold text-purple-700">{metrics.capacityAnalysis.totalHorasRequeridas.toFixed(1)} h/mes</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {(metrics.capacityAnalysis.utilizacionCapacidad * 100).toFixed(1)}% de capacidad utilizada
                  </div>
                </div>
                <div className="p-4 rounded-lg border-2 border-orange-200 bg-orange-50">
                  <div className="text-xs text-gray-600 mb-1">Horas Disponibles</div>
                  <div className="text-2xl font-bold text-orange-700">{metrics.capacityAnalysis.horasDisponibles.toFixed(0)} h/mes</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {metrics.capacityAnalysis.clientesAdicionalesDisponibles} cliente{metrics.capacityAnalysis.clientesAdicionalesDisponibles !== 1 ? 's' : ''} adicional{metrics.capacityAnalysis.clientesAdicionalesDisponibles !== 1 ? 'es' : ''} posible{metrics.capacityAnalysis.clientesAdicionalesDisponibles !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>

              {/* Capacidad vs Demanda */}
              <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Capacidad del Equipo</span>
                  <span className="text-sm font-bold text-gray-900">
                    {metrics.capacityAnalysis.maxClientesCapacidad} cliente{metrics.capacityAnalysis.maxClientesCapacidad !== 1 ? 's' : ''} máximo
                  </span>
                </div>
                <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, (metrics.capacityAnalysis.utilizacionCapacidad * 100))}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>0%</span>
                  <span>{((metrics.capacityAnalysis.utilizacionCapacidad * 100).toFixed(1))}% utilizada</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Horas por Categoría */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3">Horas Requeridas por Categoría</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="text-xs text-gray-600 mb-1">Video/Reels</div>
                    <div className="text-lg font-bold text-blue-700">
                      {metrics.capacityAnalysis.horasPorCategoria.video.toFixed(1)} h
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metrics.capacityAnalysis.totalClientes > 0 
                        ? (metrics.capacityAnalysis.horasPorCategoria.video / metrics.capacityAnalysis.totalClientes).toFixed(1)
                        : 0} h por cliente promedio
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-purple-200 bg-purple-50">
                    <div className="text-xs text-gray-600 mb-1">Diseño</div>
                    <div className="text-lg font-bold text-purple-700">
                      {metrics.capacityAnalysis.horasPorCategoria.diseño.toFixed(1)} h
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metrics.capacityAnalysis.totalClientes > 0 
                        ? (metrics.capacityAnalysis.horasPorCategoria.diseño / metrics.capacityAnalysis.totalClientes).toFixed(1)
                        : 0} h por cliente promedio
                    </div>
                  </div>
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                    <div className="text-xs text-gray-600 mb-1">Fotos</div>
                    <div className="text-lg font-bold text-green-700">
                      {metrics.capacityAnalysis.horasPorCategoria.foto.toFixed(1)} h
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {metrics.capacityAnalysis.totalClientes > 0 
                        ? (metrics.capacityAnalysis.horasPorCategoria.foto / metrics.capacityAnalysis.totalClientes).toFixed(1)
                        : 0} h por cliente promedio
                    </div>
                  </div>
                </div>
              </div>

              {/* Detalle por Tipo Específico */}
              {metrics.capacityAnalysis.horasPorTipo && metrics.capacityAnalysis.horasPorTipo.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Detalle por Tipo de Trabajo</h3>
                  <div className="space-y-2">
                    {metrics.capacityAnalysis.horasPorTipo.map((ht: any, idx: number) => {
                      const typeLabels: Record<string, string> = {
                        reel_corto: 'Reel Corto',
                        reel_largo: 'Reel Largo',
                        reel: 'Reel',
                        video: 'Video',
                        diseno_simple: 'Diseño Simple',
                        diseno_complejo: 'Diseño Complejo',
                        diseno: 'Diseño',
                        foto_simple: 'Foto Simple',
                        foto_elaborada: 'Foto Elaborada',
                        foto: 'Foto'
                      }
                      const typeLabel = typeLabels[ht.tipo] || ht.tipo
                      return (
                        <div key={idx} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                          <span className="text-gray-700 font-medium">{typeLabel}</span>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">{ht.totalHoras.toFixed(1)} h</span>
                            <span className="text-xs text-gray-500 ml-2">
                              ({ht.clientes} cliente{ht.clientes !== 1 ? 's' : ''}, {ht.promedioPorCliente.toFixed(1)} h/cliente)
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Resumen de Capacidad */}
              <div className="mt-4 p-4 rounded-lg border-2 border-indigo-200 bg-indigo-50">
                <div className="text-sm font-semibold text-indigo-900 mb-2">Resumen de Capacidad</div>
                <div className="space-y-1 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Promedio de horas por cliente:</span>
                    <span className="font-semibold">{metrics.capacityAnalysis.promedioHorasPorCliente.toFixed(1)} h</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Capacidad máxima de clientes:</span>
                    <span className="font-semibold">{metrics.capacityAnalysis.maxClientesCapacidad} cliente{metrics.capacityAnalysis.maxClientesCapacidad !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Clientes actuales:</span>
                    <span className="font-semibold">{metrics.capacityAnalysis.totalClientes} cliente{metrics.capacityAnalysis.totalClientes !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t border-indigo-200">
                    <span className="font-semibold">Clientes adicionales disponibles:</span>
                    <span className="font-bold text-indigo-700">
                      {metrics.capacityAnalysis.clientesAdicionalesDisponibles} cliente{metrics.capacityAnalysis.clientesAdicionalesDisponibles !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Clientes */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Clientes</h2>
          {metrics?.clients && metrics.clients.length > 0 ? (
            <div className="space-y-4">
              {metrics.clients
                .filter((c: any) => c.clientId !== null && c.clientId !== 'none')
                .map((c: any) => {
                  const horasEstimadas = (c.requiredHours ?? c.horas ?? 0) as number

                  return (
                    <div key={c.clientId ?? 'none'} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-semibold text-gray-900 text-lg">{c.clientName}</h3>
                          {(() => {
                            const hasSpecific = c.objectives?.reel_corto || c.objectives?.reel_largo || c.objectives?.reel || 
                                               c.objectives?.video || c.objectives?.diseno_simple || c.objectives?.diseno_complejo || 
                                               c.objectives?.diseno || c.objectives?.foto_simple || c.objectives?.foto_elaborada || c.objectives?.foto
                            const hasGeneral = c.objectives?.videos || c.objectives?.photos || c.objectives?.designs
                            
                            if (hasSpecific) {
                              const videoParts = []
                              if (c.objectives.reel_corto) videoParts.push(`${c.objectives.reel_corto} reel corto`)
                              if (c.objectives.reel_largo) videoParts.push(`${c.objectives.reel_largo} reel largo`)
                              if (c.objectives.reel) videoParts.push(`${c.objectives.reel} reel`)
                              if (c.objectives.video) videoParts.push(`${c.objectives.video} video`)
                              
                              const disenoParts = []
                              if (c.objectives.diseno_simple) disenoParts.push(`${c.objectives.diseno_simple} diseño simple`)
                              if (c.objectives.diseno_complejo) disenoParts.push(`${c.objectives.diseno_complejo} diseño complejo`)
                              if (c.objectives.diseno) disenoParts.push(`${c.objectives.diseno} diseño`)
                              
                              const fotoParts = []
                              if (c.objectives.foto_simple) fotoParts.push(`${c.objectives.foto_simple} foto simple`)
                              if (c.objectives.foto_elaborada) fotoParts.push(`${c.objectives.foto_elaborada} foto elaborada`)
                              if (c.objectives.foto) fotoParts.push(`${c.objectives.foto} foto`)
                              
                              const allParts = [...videoParts, ...disenoParts, ...fotoParts]
                              if (allParts.length > 0) {
                                return (
                                  <p className="text-xs text-gray-500 mt-1">
                                    Objetivos: {allParts.join(' · ')}
                                  </p>
                                )
                              }
                            }
                            
                            if (hasGeneral) {
                              return (
                                <p className="text-xs text-gray-500 mt-1">
                                  Objetivos: {c.objectives.videos || 0} videos · {c.objectives.photos || 0} fotos · {c.objectives.designs || 0} diseños
                                </p>
                              )
                            }
                            
                            return null
                          })()}
                        </div>
                        <div className="text-right">
                          {c.margenPct !== null && c.margenPct < 0.40 && (
                            <Badge className="bg-red-100 text-red-700 border-red-300 mb-2">Margen Bajo</Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="p-3 bg-blue-50 rounded border border-blue-200">
                          <div className="text-xs text-gray-600 mb-1">Pagos del Cliente</div>
                          <div className="text-lg font-bold text-blue-700">{formatMXN(c.revenue || 0)}</div>
                        </div>
                        <div className="p-3 bg-purple-50 rounded border border-purple-200">
                          <div className="text-xs text-gray-600 mb-1">Horas Estimadas</div>
                          <div className="text-lg font-bold text-purple-700">{horasEstimadas.toFixed(1)} h</div>
                        </div>
                        <div className="p-3 bg-orange-50 rounded border border-orange-200">
                          <div className="text-xs text-gray-600 mb-1">Costo Laboral Estimado</div>
                          <div className="text-lg font-bold text-orange-700">{formatMXN(c.costoLabor || 0)}</div>
                        </div>
                        <div className="p-3 bg-green-50 rounded border border-green-200">
                          <div className="text-xs text-gray-600 mb-1">Ganancia</div>
                          <div className="text-lg font-bold text-green-700">{formatMXN(c.margenAbs || 0)}</div>
                          {c.margenPct !== null && (
                            <div className="text-xs text-gray-500 mt-1">
                              {((c.margenPct * 100).toFixed(1))}% de margen
                            </div>
                          )}
                        </div>
                      </div>

                      {Array.isArray(c.horasByType) && c.horasByType.length > 0 && (
                        <div className="mt-3 pt-3 border-t text-sm text-gray-700">
                          <div className="font-medium mb-2 text-gray-900">Cálculo de Horas Estimadas</div>
                          <div className="space-y-2">
                            {c.horasByType.map((ht: any, idx: number) => {
                              const typeLabels: Record<string, string> = {
                                reel_corto: 'Reel Corto',
                                reel_largo: 'Reel Largo',
                                reel: 'Reel',
                                video: 'Video',
                                diseno_simple: 'Diseño Simple',
                                diseno_complejo: 'Diseño Complejo',
                                diseno: 'Diseño',
                                foto_simple: 'Foto Simple',
                                foto_elaborada: 'Foto Elaborada',
                                foto: 'Foto'
                              }
                              const typeLabel = typeLabels[ht.type] || ht.type
                              return (
                                <div key={idx} className="flex items-center justify-between py-1.5 px-2 bg-gray-50 rounded text-xs">
                                  <span className="text-gray-700">
                                    {ht.units} × {typeLabel}
                                  </span>
                                  <span className="text-gray-600">
                                    (promedio: {ht.avgHours.toFixed(2)}h) = 
                                  </span>
                                  <span className="font-semibold text-purple-700">
                                    {ht.totalHoras.toFixed(1)}h
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                          <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500">
                            <span className="font-medium">Total:</span> {horasEstimadas.toFixed(1)} horas estimadas
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
            </div>
          ) : (
            <div className="text-sm text-gray-500">No hay clientes con datos en este mes</div>
          )}
        </section>
      </main>
    </div>
  )
}
