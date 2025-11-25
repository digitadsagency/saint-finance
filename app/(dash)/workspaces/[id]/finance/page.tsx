'use client'

import { useEffect, useMemo, useState, useCallback } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { useUsers, useProjects } from '@/lib/hooks/useApiCache'
import { Edit, Trash2 } from 'lucide-react'

export default function FinancePage({ params }: { params: { id: string } }) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { data: usersData } = useUsers()
  const { data: projectsData } = useProjects(params.id)

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

  const users = usersData ?? []
  const projects = projectsData ?? []

  // Forms state
  const [salaryForm, setSalaryForm] = useState({ user_id: '', monthly_salary: '', notes: '' })
  const [expenseForm, setExpenseForm] = useState({ 
    description: '', 
    amount: '', 
    expense_type: 'fixed', 
    date: '', 
    is_installment: false,
    installment_months: '',
    notes: '' 
  })
  const [billingForm, setBillingForm] = useState({ project_id: '', monthly_amount: '', payment_day: '1' })
  const [billingStatusFilter, setBillingStatusFilter] = useState<string>('all') // 'all', 'active', 'paused', 'completed'
  const [worklogForm, setWorklogForm] = useState({ user_id: '', project_id: 'none', type: 'video', hours: '', date: '', notes: '' })
  const [incomeForm, setIncomeForm] = useState({ description: '', amount: '', date: '', project_id: 'none', notes: '' })

  const [salaries, setSalaries] = useState<any[]>([])
  const [billings, setBillings] = useState<any[]>([])
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])
  const [incomes, setIncomes] = useState<any[]>([])
  const [editingSalary, setEditingSalary] = useState<any | null>(null)
  const [editingExpense, setEditingExpense] = useState<any | null>(null)
  const [editingIncome, setEditingIncome] = useState<any | null>(null)
  const [editingBilling, setEditingBilling] = useState<any | null>(null)
  
  // Filtro de fechas para gastos - con selects de año y mes
  const now = new Date()
  const currentYear = now.getFullYear()
  const currentMonthNum = now.getMonth() + 1
  
  const [expenseFilterStartYear, setExpenseFilterStartYear] = useState<number>(() => {
    const threeMonthsAgo = new Date(currentYear, currentMonthNum - 4, 1)
    return threeMonthsAgo.getFullYear()
  })
  const [expenseFilterStartMonth, setExpenseFilterStartMonth] = useState<number>(() => {
    const threeMonthsAgo = new Date(currentYear, currentMonthNum - 4, 1)
    return threeMonthsAgo.getMonth() + 1
  })
  const [expenseFilterEndYear, setExpenseFilterEndYear] = useState<number>(() => {
    const threeMonthsAhead = new Date(currentYear, currentMonthNum + 2, 1)
    return threeMonthsAhead.getFullYear()
  })
  const [expenseFilterEndMonth, setExpenseFilterEndMonth] = useState<number>(() => {
    const threeMonthsAhead = new Date(currentYear, currentMonthNum + 2, 1)
    return threeMonthsAhead.getMonth() + 1
  })
  
  // Convertir a formato YYYY-MM para usar en el cálculo
  const expenseFilterStartMonthStr = `${expenseFilterStartYear}-${String(expenseFilterStartMonth).padStart(2, '0')}`
  const expenseFilterEndMonthStr = `${expenseFilterEndYear}-${String(expenseFilterEndMonth).padStart(2, '0')}`

  // Calculate financial summary
  const financialSummary = useMemo(() => {
    const now = new Date()
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const monthPrefix = currentMonth + '-'
    
    // Validar que los arrays existan
    const safeBillings = Array.isArray(billings) ? billings : []
    const safeIncomes = Array.isArray(incomes) ? incomes : []
    const safeExpenses = Array.isArray(expenses) ? expenses : []
    const safeSalaries = Array.isArray(salaries) ? salaries : []
    
    // Ingresos esperados (facturación mensual de clientes ACTIVOS solamente)
    const ingresosEsperados = safeBillings.reduce((sum: number, b: any) => {
      const project = projects.find((p: any) => p.id === b.project_id)
      if (project?.status !== 'active') return sum
      return sum + (Number(b.monthly_amount) || 0)
    }, 0)
    
    // Ingresos reales (pagos recibidos en el mes)
    const ingresosReales = safeBillings.reduce((sum: number, b: any) => {
      return sum + (Number(b.monthly_amount) || 0)
    }, 0)
    
    // Ingresos variables del mes
    const ingresosVariables = safeIncomes
      .filter((inc: any) => inc && (inc.date || '').startsWith(monthPrefix))
      .reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0)
    
    // Ingresos totales
    const ingresosTotales = ingresosReales + ingresosVariables
    
    // Gastos del mes
    const gastosFijos = safeExpenses
      .filter((e: any) => e && e.expense_type === 'fixed' && !e.is_installment && (e.date || '').startsWith(monthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    
    const gastosVariables = safeExpenses
      .filter((e: any) => e && e.expense_type === 'variable' && !e.is_installment && (e.date || '').startsWith(monthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    
    // Gastos MSI del mes
    const gastosMSI = safeExpenses
      .filter((e: any) => {
        if (!e || !e.is_installment || !e.date) return false
        try {
          const expenseDate = new Date(e.date)
          if (isNaN(expenseDate.getTime())) return false
          const expenseYear = expenseDate.getFullYear()
          const expenseMonth = expenseDate.getMonth()
          const [year, month] = currentMonth.split('-').map(Number)
          
          for (let i = 0; i < (e.installment_months || 0); i++) {
            const paymentMonth = new Date(expenseYear, expenseMonth + i, 1)
            if (paymentMonth.getFullYear() === year && paymentMonth.getMonth() + 1 === month) {
              return true
            }
          }
        } catch (err) {
          return false
        }
        return false
      })
      .reduce((sum: number, e: any) => sum + (Number(e.monthly_payment) || 0), 0)
    
    const totalGastos = gastosFijos + gastosVariables + gastosMSI
    
    // Costo de nómina
    const costoNomina = safeSalaries.reduce((sum: number, s: any) => sum + (Number(s.monthly_salary) || 0), 0)
    
    // Costo total
    const costoTotal = costoNomina + totalGastos
    
    // Utilidad
    const utilidad = ingresosTotales - costoTotal
    const utilidadPct = ingresosTotales > 0 ? (utilidad / ingresosTotales * 100) : 0
    
    return {
      ingresosEsperados,
      ingresosReales,
      ingresosVariables,
      ingresosTotales,
      gastosFijos,
      gastosVariables,
      gastosMSI,
      totalGastos,
      costoNomina,
      costoTotal,
      utilidad,
      utilidadPct
    }
  }, [billings, incomes, expenses, salaries])

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [sal, bil, wl, exp, inc] = await Promise.all([
          fetch(`/api/finance/salaries?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/client-billing?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/worklogs?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/expenses?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/incomes?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : []))
        ])
        setSalaries(Array.isArray(sal) ? sal : [])
        setBillings(Array.isArray(bil) ? bil : [])
        setWorklogs(Array.isArray(wl) ? wl : [])
        setExpenses(Array.isArray(exp) ? exp : [])
        setIncomes(Array.isArray(inc) ? inc : [])
      } catch {}
    }
    if (isAdmin) load()
  }, [params.id, isAdmin])

  const currentUserName = (user?.name || '')

  // Handlers
  const submitSalary = async () => {
    const isEditing = !!editingSalary
    const res = await fetch('/api/finance/salaries', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingSalary?.id,
        current_user: currentUserName,
        workspace_id: params.id,
        user_id: salaryForm.user_id,
        monthly_salary: Number(salaryForm.monthly_salary),
        notes: salaryForm.notes
      })
    })
    if (res.ok) {
      const rec = await res.json()
      if (isEditing) {
        setSalaries(prev => prev.map(s => s.id === editingSalary.id ? rec : s))
        setEditingSalary(null)
      } else {
        setSalaries(prev => [rec, ...prev])
      }
      setSalaryForm({ user_id: '', monthly_salary: '', notes: '' })
      // Reload
      const salRes = await fetch(`/api/finance/salaries?workspaceId=${params.id}`)
      if (salRes.ok) {
        const salData = await salRes.json()
        setSalaries(Array.isArray(salData) ? salData : [])
      }
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al ${isEditing ? 'actualizar' : 'guardar'} sueldo: ${err.error || res.statusText}`)
    }
  }

  const handleEditSalary = (salary: any) => {
    setEditingSalary(salary)
    setSalaryForm({
      user_id: salary.user_id,
      monthly_salary: salary.monthly_salary.toString(),
      notes: salary.notes || ''
    })
  }

  const handleDeleteSalary = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este sueldo?')) return
    const res = await fetch(`/api/finance/salaries?id=${id}&current_user=${encodeURIComponent(currentUserName)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      setSalaries(prev => prev.filter(s => s.id !== id))
      const salRes = await fetch(`/api/finance/salaries?workspaceId=${params.id}`)
      if (salRes.ok) {
        const salData = await salRes.json()
        setSalaries(Array.isArray(salData) ? salData : [])
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(`Error al eliminar sueldo: ${err.error || res.statusText}`)
    }
  }

  const submitBilling = async () => {
    const isEditing = !!editingBilling
    const res = await fetch('/api/finance/client-billing', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingBilling?.id,
        current_user: currentUserName,
        workspace_id: params.id,
        project_id: billingForm.project_id,
        monthly_amount: Number(billingForm.monthly_amount),
        payment_day: Number(billingForm.payment_day)
      })
    })
    if (res.ok) {
      const rec = await res.json()
      if (isEditing) {
        setBillings(prev => prev.map(b => b.id === editingBilling.id ? rec : b))
        setEditingBilling(null)
      } else {
        setBillings(prev => [rec, ...prev])
      }
      setBillingForm({ project_id: '', monthly_amount: '', payment_day: '1' })
      // Reload
      const billRes = await fetch(`/api/finance/client-billing?workspaceId=${params.id}`)
      if (billRes.ok) {
        const billData = await billRes.json()
        setBillings(Array.isArray(billData) ? billData : [])
      }
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al ${isEditing ? 'actualizar' : 'guardar'} facturación: ${err.error || res.statusText}`)
    }
  }

  const handleEditBilling = (billing: any) => {
    setEditingBilling(billing)
    setBillingForm({
      project_id: billing.project_id,
      monthly_amount: billing.monthly_amount.toString(),
      payment_day: billing.payment_day.toString()
    })
  }

  const submitWorklog = async () => {
    const res = await fetch('/api/finance/worklogs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_user: currentUserName,
        workspace_id: params.id,
        user_id: worklogForm.user_id,
        project_id: worklogForm.project_id === 'none' ? undefined : worklogForm.project_id,
        type: worklogForm.type,
        hours: Number(worklogForm.hours),
        date: worklogForm.date,
        notes: worklogForm.notes
      })
    })
    if (res.ok) {
      const rec = await res.json()
      setWorklogs(prev => [rec, ...prev])
      setWorklogForm({ user_id: '', project_id: '', type: 'video', hours: '', date: '', notes: '' })
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al guardar tiempo: ${err.error || res.statusText}`)
    }
  }

  const submitExpense = async () => {
    const isEditing = !!editingExpense
    const res = await fetch('/api/finance/expenses', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingExpense?.id,
        current_user: currentUserName,
        workspace_id: params.id,
        description: expenseForm.description,
        amount: Number(expenseForm.amount),
        expense_type: expenseForm.expense_type,
        date: expenseForm.date || new Date().toISOString().split('T')[0],
        is_installment: expenseForm.is_installment,
        installment_months: expenseForm.is_installment && expenseForm.installment_months ? Number(expenseForm.installment_months) : undefined,
        notes: expenseForm.notes
      })
    })
    if (res.ok) {
      const rec = await res.json()
      // Recargar todos los gastos para asegurar que se muestren correctamente
      const expRes = await fetch(`/api/finance/expenses?workspaceId=${params.id}`)
      if (expRes.ok) {
        const expensesData = await expRes.json()
        setExpenses(Array.isArray(expensesData) ? expensesData : [])
      }
      setExpenseForm({ description: '', amount: '', expense_type: 'fixed', date: '', is_installment: false, installment_months: '', notes: '' })
      setEditingExpense(null)
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al ${isEditing ? 'actualizar' : 'guardar'} gasto: ${err.error || res.statusText}`)
    }
  }

  const handleEditExpense = (expense: any) => {
    setEditingExpense(expense)
    setExpenseForm({
      description: expense.description,
      amount: expense.amount.toString(),
      expense_type: expense.expense_type,
      date: expense.date,
      is_installment: expense.is_installment || false,
      installment_months: expense.installment_months?.toString() || '',
      notes: expense.notes || ''
    })
  }

  const handleDeleteExpense = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este gasto?')) return
    const res = await fetch(`/api/finance/expenses?id=${id}&current_user=${encodeURIComponent(currentUserName)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      setExpenses(prev => prev.filter(e => e.id !== id))
      const expRes = await fetch(`/api/finance/expenses?workspaceId=${params.id}`)
      if (expRes.ok) {
        const expensesData = await expRes.json()
        setExpenses(Array.isArray(expensesData) ? expensesData : [])
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(`Error al eliminar gasto: ${err.error || res.statusText}`)
    }
  }

  const submitIncome = async () => {
    const isEditing = !!editingIncome
    const res = await fetch('/api/finance/incomes', {
      method: isEditing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: editingIncome?.id,
        current_user: currentUserName,
        workspace_id: params.id,
        description: incomeForm.description,
        amount: Number(incomeForm.amount),
        date: incomeForm.date || new Date().toISOString().split('T')[0],
        project_id: incomeForm.project_id && incomeForm.project_id !== 'none' ? incomeForm.project_id : undefined,
        notes: incomeForm.notes
      })
    })
    if (res.ok) {
      const rec = await res.json()
      if (isEditing) {
        setIncomes(prev => prev.map(i => i.id === editingIncome.id ? rec : i))
        setEditingIncome(null)
      } else {
        setIncomes(prev => [rec, ...prev])
      }
      setIncomeForm({ description: '', amount: '', date: '', project_id: 'none', notes: '' })
      // Reload
      const incRes = await fetch(`/api/finance/incomes?workspaceId=${params.id}`)
      if (incRes.ok) {
        const incomesData = await incRes.json()
        setIncomes(Array.isArray(incomesData) ? incomesData : [])
      }
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al ${isEditing ? 'actualizar' : 'guardar'} ingreso: ${err.error || res.statusText}`)
    }
  }

  const handleEditIncome = (income: any) => {
    setEditingIncome(income)
    setIncomeForm({
      description: income.description,
      amount: income.amount.toString(),
      date: income.date,
      project_id: income.project_id || 'none',
      notes: income.notes || ''
    })
  }

  const handleDeleteIncome = async (id: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este ingreso?')) return
    const res = await fetch(`/api/finance/incomes?id=${id}&current_user=${encodeURIComponent(currentUserName)}`, {
      method: 'DELETE'
    })
    if (res.ok) {
      setIncomes(prev => prev.filter(i => i.id !== id))
      const incRes = await fetch(`/api/finance/incomes?workspaceId=${params.id}`)
      if (incRes.ok) {
        const incomesData = await incRes.json()
        setIncomes(Array.isArray(incomesData) ? incomesData : [])
      }
    } else {
      const err = await res.json().catch(() => ({ error: 'Error desconocido' }))
      alert(`Error al eliminar ingreso: ${err.error || res.statusText}`)
    }
  }

  // Calculate expenses grouped by month
  const expensesByMonth = useMemo(() => {
    const expensesMap = new Map<string, any[]>()
    
    // Parsear fechas del filtro
    const [startYear, startMonth] = expenseFilterStartMonthStr.split('-').map(Number)
    const [endYear, endMonth] = expenseFilterEndMonthStr.split('-').map(Number)
    const filterStartDate = new Date(startYear, startMonth - 1, 1)
    const filterEndDate = new Date(endYear, endMonth, 0) // Último día del mes final
    
    // Obtener todos los meses en el rango del filtro
    const monthsInRange: string[] = []
    const current = new Date(filterStartDate)
    while (current <= filterEndDate) {
      const monthKey = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`
      monthsInRange.push(monthKey)
      current.setMonth(current.getMonth() + 1)
    }
    
    // Agrupar gastos por mes
    expenses.forEach((e: any) => {
      if (!e.date) {
        console.warn('Expense without date:', e)
        return
      }
      
      // Intentar parsear la fecha de diferentes formas
      let expenseDate: Date
      if (typeof e.date === 'string') {
        // Si es string YYYY-MM-DD, parsear localmente
        if (e.date.match(/^\d{4}-\d{2}-\d{2}$/)) {
          const [y, m, d] = e.date.split('-').map(Number)
          expenseDate = new Date(y, (m || 1) - 1, d || 1)
        } else {
          expenseDate = new Date(e.date)
        }
      } else {
        expenseDate = new Date(e.date)
      }
      
      // Validar que la fecha sea válida
      if (isNaN(expenseDate.getTime())) {
        console.warn('Invalid date for expense:', e.date, e)
        return
      }
      
      const expenseYear = expenseDate.getFullYear()
      const expenseMonth = expenseDate.getMonth()
      const expenseDay = expenseDate.getDate()
      
      // Si es a meses sin intereses, generar pagos mensuales
      if (e.is_installment && e.installment_months && e.monthly_payment) {
        const months = Number(e.installment_months)
        const monthlyPayment = Number(e.monthly_payment)
        
        for (let i = 0; i < months; i++) {
          const paymentDate = new Date(expenseYear, expenseMonth + i, expenseDay)
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          
          // Solo agregar si está en el rango del filtro
          if (monthsInRange.includes(monthKey)) {
            if (!expensesMap.has(monthKey)) {
              expensesMap.set(monthKey, [])
            }
            
            expensesMap.get(monthKey)!.push({
              ...e,
              amount: monthlyPayment,
              payment_month: i + 1,
              total_months: months,
              is_installment_payment: true
            })
          }
        }
      } else if (e.expense_type === 'fixed') {
        // GASTOS FIJOS: Replicar en todos los meses desde la fecha de inicio hasta el final del filtro
        const startMonthKey = `${expenseYear}-${String(expenseMonth + 1).padStart(2, '0')}`
        
        // Encontrar el índice del mes de inicio en el rango
        const startIndex = monthsInRange.indexOf(startMonthKey)
        if (startIndex === -1) {
          // Si el mes de inicio está antes del filtro, empezar desde el inicio del filtro
          monthsInRange.forEach(monthKey => {
            if (!expensesMap.has(monthKey)) {
              expensesMap.set(monthKey, [])
            }
            expensesMap.get(monthKey)!.push({
              ...e,
              is_replicated: true,
              original_date: e.date
            })
          })
        } else {
          // Replicar desde el mes de inicio hasta el final del filtro
          for (let i = startIndex; i < monthsInRange.length; i++) {
            const monthKey = monthsInRange[i]
            if (!expensesMap.has(monthKey)) {
              expensesMap.set(monthKey, [])
            }
            // Solo marcar como replicado si NO es el mes original
            const isReplicated = i > startIndex
            expensesMap.get(monthKey)!.push({
              ...e,
              is_replicated: isReplicated,
              original_date: isReplicated ? e.date : undefined
            })
          }
        }
      } else {
        // GASTOS VARIABLES: Solo en el mes específico
        const monthKey = `${expenseYear}-${String(expenseMonth + 1).padStart(2, '0')}`
        
        // Solo agregar si está en el rango del filtro
        if (monthsInRange.includes(monthKey)) {
          if (!expensesMap.has(monthKey)) {
            expensesMap.set(monthKey, [])
          }
          
          expensesMap.get(monthKey)!.push(e)
        }
      }
    })
    
    // Ordenar meses (más recientes primero) y filtrar solo los que tienen gastos o están en el rango
    const sortedMonths = Array.from(expensesMap.keys())
      .filter(monthKey => monthsInRange.includes(monthKey))
      .sort()
      .reverse()
    
    return sortedMonths.map(monthKey => {
      const monthExpenses = expensesMap.get(monthKey) || []
      const [year, month] = monthKey.split('-')
      const monthDate = new Date(Number(year), Number(month) - 1, 1)
      const monthName = monthDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      
      const fixedTotal = monthExpenses
        .filter((e: any) => e.expense_type === 'fixed')
        .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
      
      const variableTotal = monthExpenses
        .filter((e: any) => e.expense_type === 'variable')
        .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
      
      return {
        monthKey,
        monthName,
        expenses: monthExpenses,
        fixedTotal,
        variableTotal,
        total: fixedTotal + variableTotal
      }
    })
  }, [expenses, expenseFilterStartMonthStr, expenseFilterEndMonthStr])

  // Calculate current salaries (most recent per user) and total payroll
  const currentSalaries = useMemo(() => {
    const salaryMap = new Map<string, any>()
    salaries.forEach(s => {
      const existing = salaryMap.get(s.user_id)
      if (!existing || new Date(s.created_at) > new Date(existing.created_at)) {
        salaryMap.set(s.user_id, s)
      }
    })
    return Array.from(salaryMap.values())
  }, [salaries])

  const totalMonthlyPayroll = useMemo(() => {
    return currentSalaries.reduce((sum, s) => sum + (Number(s.monthly_salary) || 0), 0)
  }, [currentSalaries])

  if (!user || !isAdmin) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Finanzas (solo admins)</h1>
              <p className="text-sm text-gray-600">Gestión de sueldos, facturación de clientes y tiempos</p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                onClick={() => router.push(`/workspaces/${params.id}/finance/metrics`)}
              >
                Ver Métricas
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Salaries */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Sueldos por empleado</h2>
            <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
              <div className="text-xs text-gray-600 mb-1">Gasto de Nómina Mensual Total</div>
              <div className="text-xl font-bold text-green-700">
                {totalMonthlyPayroll.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Empleado</label>
              <Select value={salaryForm.user_id} onValueChange={(v) => setSalaryForm(s => ({ ...s, user_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona empleado" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u: any) => (
                    <SelectItem key={u.id} value={u.id}>{u.name || 'Usuario'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Sueldo mensual (MXN)</label>
              <Input value={salaryForm.monthly_salary} onChange={e => setSalaryForm(s => ({ ...s, monthly_salary: e.target.value }))} type="number" min="0" step="0.01" />
            </div>
            <div>
              <Button onClick={submitSalary} disabled={!salaryForm.user_id || !salaryForm.monthly_salary}>{editingSalary ? 'Actualizar' : 'Guardar'}</Button>
              {editingSalary && (
                <Button variant="outline" className="ml-2" onClick={() => { setEditingSalary(null); setSalaryForm({ user_id: '', monthly_salary: '', notes: '' }) }}>Cancelar</Button>
              )}
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm mb-1">Notas</label>
              <Input value={salaryForm.notes} onChange={e => setSalaryForm(s => ({ ...s, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          <div className="mt-6 divide-y">
            {currentSalaries.map((s) => (
              <div key={s.id} className="py-2 text-sm flex justify-between items-center group">
                <div>
                  <span className="font-medium">{users.find((u:any)=>u.id===s.user_id)?.name || 'Empleado'}</span>
                  {s.notes && <span className="text-gray-500"> · {s.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold">{s.monthly_salary.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditSalary(s)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700" onClick={() => handleDeleteSalary(s.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Client billing */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Facturación de clientes (mensual)</h2>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Filtrar por estado:
              </label>
              <Select value={billingStatusFilter} onValueChange={setBillingStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activos</SelectItem>
                  <SelectItem value="paused">Pausados</SelectItem>
                  <SelectItem value="completed">Completados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Cliente/Proyecto</label>
              <Select value={billingForm.project_id} onValueChange={(v) => setBillingForm(s => ({ ...s, project_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona proyecto" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Pago mensual (MXN)</label>
              <Input value={billingForm.monthly_amount} onChange={e => setBillingForm(s => ({ ...s, monthly_amount: e.target.value }))} type="number" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm mb-1">Día de pago</label>
              <Input value={billingForm.payment_day} onChange={e => setBillingForm(s => ({ ...s, payment_day: e.target.value }))} type="number" min="1" max="31" />
            </div>
            <div>
              <Button onClick={submitBilling} disabled={!billingForm.project_id || !billingForm.monthly_amount}>
                {editingBilling ? 'Actualizar' : 'Guardar'}
              </Button>
              {editingBilling && (
                <Button variant="outline" className="ml-2" onClick={() => { setEditingBilling(null); setBillingForm({ project_id: '', monthly_amount: '', payment_day: '1' }) }}>
                  Cancelar
                </Button>
              )}
            </div>
          </div>

          <div className="mt-6 divide-y">
            {(Array.isArray(billings) ? billings : [])
              .filter((b) => {
                if (billingStatusFilter === 'all') return true
                const project = projects.find((p:any) => p.id === b.project_id)
                return project?.status === billingStatusFilter
              })
              .map((b) => {
                const project = projects.find((p:any)=>p.id===b.project_id)
                return (
                  <div key={b.id} className="py-2 text-sm flex justify-between items-center group">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{project?.name || 'Proyecto'}</span>
                      <Badge 
                        className={
                          project?.status === 'active' 
                            ? 'bg-green-100 text-green-700 border-green-300' 
                            : project?.status === 'paused'
                            ? 'bg-yellow-100 text-yellow-700 border-yellow-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'
                        }
                      >
                        {project?.status === 'active' ? 'Activo' : project?.status === 'paused' ? 'Pausado' : 'Completado'}
                      </Badge>
                      <span className="text-gray-500"> · Paga día {b.payment_day}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="font-semibold">${b.monthly_amount}</div>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditBilling(b)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )
              })}
          </div>
        </section>

        {/* Worklogs by type */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Tiempos por tipo de trabajo</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div>
              <label className="block text-sm mb-1">Empleado</label>
              <Select value={worklogForm.user_id} onValueChange={(v) => setWorklogForm(s => ({ ...s, user_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((u:any)=>(<SelectItem key={u.id} value={u.id}>{u.name || 'Usuario'}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Proyecto (opcional)</label>
              <Select value={worklogForm.project_id} onValueChange={(v) => setWorklogForm(s => ({ ...s, project_id: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Proyecto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin proyecto</SelectItem>
                  {projects.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Tipo de trabajo</label>
              <Select value={worklogForm.type} onValueChange={(v) => setWorklogForm(s => ({ ...s, type: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo" />
                </SelectTrigger>
                <SelectContent>
                  {/* Audiovisual/Video */}
                  <SelectItem value="reel_corto">🎬 Reel corto</SelectItem>
                  <SelectItem value="reel_largo">🎬 Reel largo</SelectItem>
                  <SelectItem value="reel">🎬 Reel (genérico)</SelectItem>
                  <SelectItem value="video">🎥 Video</SelectItem>
                  {/* Diseño */}
                  <SelectItem value="diseno_simple">🎨 Diseño simple</SelectItem>
                  <SelectItem value="diseno_complejo">🎨 Diseño complejo</SelectItem>
                  <SelectItem value="diseno">🎨 Diseño (genérico)</SelectItem>
                  {/* Fotos */}
                  <SelectItem value="foto_simple">📸 Foto simple</SelectItem>
                  <SelectItem value="foto_elaborada">📸 Foto elaborada</SelectItem>
                  <SelectItem value="foto">📸 Foto (genérico)</SelectItem>
                  {/* Otros */}
                  <SelectItem value="guion">✍️ Guion</SelectItem>
                  <SelectItem value="sesion">📹 Sesión/Grabación</SelectItem>
                  <SelectItem value="edicion">✂️ Edición</SelectItem>
                  <SelectItem value="color">🎨 Color/Grading</SelectItem>
                  <SelectItem value="brief">📋 Brief</SelectItem>
                  <SelectItem value="revision">👁️ Revisión</SelectItem>
                  <SelectItem value="upload">☁️ Upload/Publicar</SelectItem>
                  <SelectItem value="other">⚙️ Otro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Horas</label>
              <Input value={worklogForm.hours} onChange={e => setWorklogForm(s => ({ ...s, hours: e.target.value }))} type="number" min="0" step="0.25" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fecha</label>
              <Input value={worklogForm.date} onChange={e => setWorklogForm(s => ({ ...s, date: e.target.value }))} type="date" />
            </div>
            <div>
              <Button onClick={submitWorklog} disabled={!worklogForm.user_id || !worklogForm.hours || !worklogForm.date}>Guardar</Button>
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm mb-1">Notas</label>
              <Input value={worklogForm.notes} onChange={e => setWorklogForm(s => ({ ...s, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          <div className="mt-6 divide-y">
            {(Array.isArray(worklogs) ? worklogs : []).map((w) => (
              <div key={w.id} className="py-2 text-sm flex justify-between">
                <div>
                  <span className="font-medium">{users.find((u:any)=>u.id===w.user_id)?.name || 'Empleado'}</span>
                  <span className="text-gray-500"> · {w.date} · {w.type}</span>
                </div>
                <div className="font-semibold">{w.hours} h</div>
              </div>
            ))}
          </div>
        </section>

        {/* Expenses */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Gastos</h2>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Desde:</label>
                <Select
                  value={expenseFilterStartYear.toString()}
                  onValueChange={(v) => setExpenseFilterStartYear(Number(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={expenseFilterStartMonth.toString()}
                  onValueChange={(v) => setExpenseFilterStartMonth(Number(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700 whitespace-nowrap">Hasta:</label>
                <Select
                  value={expenseFilterEndYear.toString()}
                  onValueChange={(v) => setExpenseFilterEndYear(Number(v))}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(year => (
                      <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={expenseFilterEndMonth.toString()}
                  onValueChange={(v) => setExpenseFilterEndMonth(Number(v))}
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'].map((month, idx) => (
                      <SelectItem key={idx + 1} value={(idx + 1).toString()}>{month}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Descripción</label>
              <Input value={expenseForm.description} onChange={e => setExpenseForm(s => ({ ...s, description: e.target.value }))} placeholder="Ej: Renta oficina, Software, etc." />
            </div>
            <div>
              <label className="block text-sm mb-1">Monto (MXN)</label>
              <Input value={expenseForm.amount} onChange={e => setExpenseForm(s => ({ ...s, amount: e.target.value }))} type="number" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm mb-1">Tipo</label>
              <Select value={expenseForm.expense_type} onValueChange={(v) => setExpenseForm(s => ({ ...s, expense_type: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fixed">Fijo (Mensual)</SelectItem>
                  <SelectItem value="variable">Variable (Una vez)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm mb-1">Fecha</label>
              <Input value={expenseForm.date} onChange={e => setExpenseForm(s => ({ ...s, date: e.target.value }))} type="date" />
            </div>
            <div>
              <Button onClick={submitExpense} disabled={!expenseForm.description || !expenseForm.amount}>{editingExpense ? 'Actualizar' : 'Guardar'}</Button>
              {editingExpense && (
                <Button variant="outline" className="ml-2" onClick={() => { setEditingExpense(null); setExpenseForm({ description: '', amount: '', expense_type: 'fixed', date: '', is_installment: false, installment_months: '', notes: '' }) }}>Cancelar</Button>
              )}
            </div>
            <div className="md:col-span-6 flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input 
                  type="checkbox" 
                  checked={expenseForm.is_installment} 
                  onChange={e => setExpenseForm(s => ({ ...s, is_installment: e.target.checked, installment_months: e.target.checked ? s.installment_months : '' }))}
                  className="w-4 h-4"
                />
                <label className="text-sm">A meses sin intereses</label>
              </div>
              {expenseForm.is_installment && (
                <div className="flex items-center gap-2">
                  <label className="text-sm">Meses:</label>
                  <Input 
                    value={expenseForm.installment_months} 
                    onChange={e => setExpenseForm(s => ({ ...s, installment_months: e.target.value }))} 
                    type="number" 
                    min="1" 
                    max="24"
                    className="w-20"
                    placeholder="12"
                  />
                  {expenseForm.amount && expenseForm.installment_months && (
                    <span className="text-xs text-gray-500">
                      Pago mensual: ${(Number(expenseForm.amount) / Number(expenseForm.installment_months)).toFixed(2)}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm mb-1">Notas</label>
              <Input value={expenseForm.notes} onChange={e => setExpenseForm(s => ({ ...s, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          {/* Expenses grouped by month */}
          <div className="mt-6">
            {expensesByMonth.map((monthData) => (
              <div key={monthData.monthKey} className="mb-6 pb-6 border-b border-gray-200 last:border-b-0">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-md font-semibold text-gray-900 capitalize">{monthData.monthName}</h3>
                  <div className="flex gap-4 text-sm">
                    <span className="text-blue-600">Fijos: {monthData.fixedTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                    <span className="text-orange-600">Variables: {monthData.variableTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                    <span className="font-bold">Total: {monthData.total.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  {monthData.expenses.map((e: any, idx: number) => (
                    <div key={`${e.id}-${e.payment_month || ''}-${monthData.monthKey}-${idx}`} className="py-2 text-sm flex justify-between items-center bg-gray-50 px-3 rounded group">
                      <div className="flex-1">
                        <span className="font-medium">{e.description}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${e.expense_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {e.expense_type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
                        {e.is_replicated && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-700">
                            Replicado
                          </span>
                        )}
                        {e.is_installment_payment && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                            Mes {e.payment_month}/{e.total_months} (MSI)
                          </span>
                        )}
                        {e.is_installment && !e.is_installment_payment && (
                          <span className="ml-2 px-2 py-0.5 text-xs rounded-full bg-purple-100 text-purple-700">
                            {e.installment_months} meses sin intereses
                          </span>
                        )}
                        {e.date && <span className="text-gray-500 ml-2"> · {new Date(e.date).toLocaleDateString('es-ES')}</span>}
                        {e.notes && <span className="text-gray-500 ml-2"> · {e.notes}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="font-semibold">{Number(e.amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                        {!e.is_installment_payment && (
                          <>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditExpense(e)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700" onClick={() => handleDeleteExpense(e.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        {e.is_replicated && (
                          <span className="text-xs text-gray-500 ml-2">(Editar afecta todos los meses)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-blue-50 px-4 py-3 rounded-lg border border-blue-200">
                <div className="text-xs text-gray-600 mb-1">Total Gastos Fijos (Mensual)</div>
                <div className="text-lg font-bold text-blue-700">
                  {expensesByMonth.reduce((sum, month) => sum + month.fixedTotal, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Suma de todos los meses visibles
                </div>
              </div>
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="text-xs text-gray-600 mb-1">Total Gastos Variables</div>
                <div className="text-lg font-bold text-orange-700">
                  {expensesByMonth.reduce((sum, month) => sum + month.variableTotal, 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Suma de todos los meses visibles
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Variable Incomes */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Ingresos Variables</h2>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Descripción</label>
              <Input value={incomeForm.description} onChange={e => setIncomeForm(s => ({ ...s, description: e.target.value }))} placeholder="Ej: Sesión única, Proyecto especial, etc." />
            </div>
            <div>
              <label className="block text-sm mb-1">Monto (MXN)</label>
              <Input value={incomeForm.amount} onChange={e => setIncomeForm(s => ({ ...s, amount: e.target.value }))} type="number" min="0" step="0.01" />
            </div>
            <div>
              <label className="block text-sm mb-1">Fecha</label>
              <Input value={incomeForm.date} onChange={e => setIncomeForm(s => ({ ...s, date: e.target.value }))} type="date" />
            </div>
            <div>
              <label className="block text-sm mb-1">Cliente (opcional)</label>
              <Select value={incomeForm.project_id || 'none'} onValueChange={(v) => setIncomeForm(s => ({ ...s, project_id: v === 'none' ? '' : v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Sin cliente" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin cliente</SelectItem>
                  {projects.map((p:any)=>(<SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Button onClick={submitIncome} disabled={!incomeForm.description || !incomeForm.amount}>{editingIncome ? 'Actualizar' : 'Guardar'}</Button>
              {editingIncome && (
                <Button variant="outline" className="ml-2" onClick={() => { setEditingIncome(null); setIncomeForm({ description: '', amount: '', date: '', project_id: 'none', notes: '' }) }}>Cancelar</Button>
              )}
            </div>
            <div className="md:col-span-6">
              <label className="block text-sm mb-1">Notas</label>
              <Input value={incomeForm.notes} onChange={e => setIncomeForm(s => ({ ...s, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          <div className="mt-6 divide-y">
            {(Array.isArray(incomes) ? incomes : []).map((inc: any) => (
              <div key={inc.id} className="py-2 text-sm flex justify-between items-center group">
                <div>
                  <span className="font-medium">{inc.description}</span>
                  {inc.project_id && (
                    <span className="text-gray-500"> · {projects.find((p:any)=>p.id===inc.project_id)?.name || 'Cliente'}</span>
                  )}
                  {inc.date && <span className="text-gray-500 ml-2"> · {new Date(inc.date).toLocaleDateString('es-ES')}</span>}
                  {inc.notes && <span className="text-gray-500 ml-2"> · {inc.notes}</span>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-green-700">{Number(inc.amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleEditIncome(inc)}>
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700" onClick={() => handleDeleteIncome(inc.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Financial Summary / Utilidad */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Resumen Financiero del Mes</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="p-4 rounded-lg border-2 border-blue-200 bg-blue-50">
                <div className="text-sm text-gray-600 mb-1">Ingresos Esperados</div>
                <div className="text-2xl font-bold text-blue-700">
                  {financialSummary.ingresosEsperados.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div className="p-4 rounded-lg border-2 border-green-200 bg-green-50">
                <div className="text-sm text-gray-600 mb-1">Ingresos Totales</div>
                <div className="text-2xl font-bold text-green-700">
                  {financialSummary.ingresosTotales.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Recibidos: {financialSummary.ingresosReales.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} + 
                  Variables: {financialSummary.ingresosVariables.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div className="p-4 rounded-lg border-2 border-red-200 bg-red-50">
                <div className="text-sm text-gray-600 mb-1">Costos Totales</div>
                <div className="text-2xl font-bold text-red-700">
                  {financialSummary.costoTotal.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Nómina: {financialSummary.costoNomina.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })} + 
                  Gastos: {financialSummary.totalGastos.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div className={`p-4 rounded-lg border-2 ${financialSummary.utilidad >= 0 ? 'border-green-300 bg-green-100' : 'border-red-300 bg-red-100'}`}>
                <div className="text-sm text-gray-600 mb-1">Utilidad del Mes</div>
                <div className={`text-2xl font-bold ${financialSummary.utilidad >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                  {financialSummary.utilidad.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
                <div className="text-xs text-gray-600 mt-1">
                  {financialSummary.utilidadPct.toFixed(1)}% de utilidad
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


