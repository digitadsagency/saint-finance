import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function isValidMonth(m?: string | null) {
  if (!m) return false
  return /^\d{4}-\d{2}$/.test(m)
}

// Helper para determinar si un cliente estaba activo en un mes específico
// Lógica simple: si está pausado desde mes X, NO cuenta desde ese mes en adelante
function isClientActiveInMonth(project: any, monthStr: string): boolean {
  // monthStr en formato "YYYY-MM"
  
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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const startMonth = searchParams.get('startMonth') || `${new Date().getFullYear()}-01`
    const endMonth = searchParams.get('endMonth') || `${new Date().getFullYear()}-12`
    
    const { FinanceService } = await import('@/lib/services/finance')
    const { ProjectsService } = await import('@/lib/services/projects')
    
    // Cargar todos los datos una vez
    const [salaries, billings, expenses, incomes, payments, projects] = await Promise.all([
      FinanceService.listSalaries(workspaceId).catch(() => []),
      FinanceService.listClientBilling(workspaceId).catch(() => []),
      FinanceService.listExpenses(workspaceId).catch(() => []),
      FinanceService.listIncomes(workspaceId).catch(() => []),
      FinanceService.listPaymentRecords(workspaceId, '').catch(() => []), // Todos los pagos
      ProjectsService.getAllProjects(workspaceId).catch(() => [])
    ])
    
    // Calcular costo de nómina (es el mismo para todos los meses)
    const costoNomina = (salaries || []).reduce((sum: number, s: any) => {
      return sum + (Number(s.monthly_salary) || 0)
    }, 0)
    
    // Gastos fijos mensuales (se aplican a todos los meses)
    const gastosFijosMensuales = (expenses || [])
      .filter((e: any) => e.expense_type === 'fixed' && !e.is_installment)
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    
    // Generar datos para cada mes
    const [startYear, startMonthNum] = startMonth.split('-').map(Number)
    const [endYear, endMonthNum] = endMonth.split('-').map(Number)
    
    const monthlyData: any[] = []
    
    for (let year = startYear; year <= endYear; year++) {
      const monthStart = year === startYear ? startMonthNum : 1
      const monthEnd = year === endYear ? endMonthNum : 12
      
      for (let month = monthStart; month <= monthEnd; month++) {
        const monthStr = `${year}-${String(month).padStart(2, '0')}`
        const monthPrefix = monthStr + '-'
        
        // Ingresos esperados POR MES (solo clientes activos en ese mes específico)
        const ingresosEsperados = (billings || []).reduce((sum: number, b: any) => {
          const project = projects.find((p: any) => p.id === b.project_id)
          if (!project || !isClientActiveInMonth(project, monthStr)) return sum
          return sum + (Number(b.monthly_amount) || 0)
        }, 0)
        
        // Ingresos reales (pagos recibidos en este mes)
        const ingresosReales = (payments || [])
          .filter((p: any) => {
            // Usar paid_date (fecha en que se recibió el pago)
            const paymentDateStr = p.paid_date || p.payment_date
            if (!paymentDateStr) return false
            const paymentDate = new Date(paymentDateStr)
            if (isNaN(paymentDate.getTime())) return false
            return paymentDate.getFullYear() === year && paymentDate.getMonth() + 1 === month
          })
          .reduce((sum: number, p: any) => sum + (Number(p.paid_amount) || 0), 0)
        
        // Ingresos variables del mes
        const ingresosVariables = (incomes || [])
          .filter((inc: any) => {
            if (!inc.date) return false
            const incomeDate = new Date(inc.date)
            return incomeDate.getFullYear() === year && incomeDate.getMonth() + 1 === month
          })
          .reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0)
        
        // Ingresos totales
        const ingresosTotales = ingresosReales + ingresosVariables
        
        // Gastos variables del mes
        const gastosVariables = (expenses || [])
          .filter((e: any) => {
            if (!e.date || e.expense_type !== 'variable' || e.is_installment) return false
            const expenseDate = new Date(e.date)
            return expenseDate.getFullYear() === year && expenseDate.getMonth() + 1 === month
          })
          .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
        
        // Gastos MSI del mes (pagos mensuales que caen en este mes)
        const gastosMSI = (expenses || [])
          .filter((e: any) => {
            if (!e.is_installment || !e.date || !e.installment_months) return false
            const expenseDate = new Date(e.date)
            const expenseYear = expenseDate.getFullYear()
            const expenseMonth = expenseDate.getMonth() + 1
            
            for (let i = 0; i < (e.installment_months || 0); i++) {
              const paymentMonth = new Date(expenseYear, expenseMonth - 1 + i, 1)
              if (paymentMonth.getFullYear() === year && paymentMonth.getMonth() + 1 === month) {
                return true
              }
            }
            return false
          })
          .reduce((sum: number, e: any) => sum + (Number(e.monthly_payment) || 0), 0)
        
        const totalGastos = gastosFijosMensuales + gastosVariables + gastosMSI
        const costoTotal = costoNomina + totalGastos
        const utilidad = ingresosTotales - costoTotal
        const utilidadPct = ingresosTotales > 0 ? (utilidad / ingresosTotales * 100) : null
        
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                           'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        
        monthlyData.push({
          month: monthStr,
          monthName: monthNames[month - 1],
          year,
          ingresosEsperados,
          ingresosReales,
          ingresosVariables,
          ingresosTotales,
          costoNomina,
          gastosFijos: gastosFijosMensuales,
          gastosVariables,
          gastosMSI,
          totalGastos,
          costoTotal,
          utilidad,
          utilidadPct
        })
      }
    }
    
    return NextResponse.json({ monthlyData })
  } catch (e: any) {
    console.error('Error calculating monthly utility:', e)
    return NextResponse.json(
      { error: 'Failed to calculate monthly utility', details: e?.message },
      { status: 500 }
    )
  }
}

