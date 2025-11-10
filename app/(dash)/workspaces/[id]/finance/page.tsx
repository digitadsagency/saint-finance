'use client'

import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '@/lib/useAuth'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useUsers, useProjects } from '@/lib/hooks/useApiCache'

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
  const [worklogForm, setWorklogForm] = useState({ user_id: '', project_id: 'none', type: 'video', hours: '', date: '', notes: '' })

  const [salaries, setSalaries] = useState<any[]>([])
  const [billings, setBillings] = useState<any[]>([])
  const [worklogs, setWorklogs] = useState<any[]>([])
  const [expenses, setExpenses] = useState<any[]>([])

  // Load data
  useEffect(() => {
    const load = async () => {
      try {
        const [sal, bil, wl, exp] = await Promise.all([
          fetch(`/api/finance/salaries?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/client-billing?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/worklogs?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : [])),
          fetch(`/api/finance/expenses?workspaceId=${params.id}`).then(async r => (r.ok ? r.json() : []))
        ])
        setSalaries(Array.isArray(sal) ? sal : [])
        setBillings(Array.isArray(bil) ? bil : [])
        setWorklogs(Array.isArray(wl) ? wl : [])
        setExpenses(Array.isArray(exp) ? exp : [])
      } catch {}
    }
    if (isAdmin) load()
  }, [params.id, isAdmin])

  const currentUserName = (user?.name || '')

  // Handlers
  const submitSalary = async () => {
    const res = await fetch('/api/finance/salaries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_user: currentUserName,
        workspace_id: params.id,
        user_id: salaryForm.user_id,
        monthly_salary: Number(salaryForm.monthly_salary),
        notes: salaryForm.notes
      })
    })
    if (res.ok) {
      const rec = await res.json()
      setSalaries(prev => [rec, ...prev])
      setSalaryForm({ user_id: '', monthly_salary: '', notes: '' })
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al guardar sueldo: ${err.error || res.statusText}`)
    }
  }

  const submitBilling = async () => {
    const res = await fetch('/api/finance/client-billing', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        current_user: currentUserName,
        workspace_id: params.id,
        project_id: billingForm.project_id,
        monthly_amount: Number(billingForm.monthly_amount),
        payment_day: Number(billingForm.payment_day)
      })
    })
    if (res.ok) {
      const rec = await res.json()
      setBillings(prev => [rec, ...prev])
      setBillingForm({ project_id: '', monthly_amount: '', payment_day: '1' })
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al guardar facturación: ${err.error || res.statusText}`)
    }
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
    const res = await fetch('/api/finance/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
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
      setExpenses(prev => [rec, ...prev])
      setExpenseForm({ description: '', amount: '', expense_type: 'fixed', date: '', is_installment: false, installment_months: '', notes: '' })
    } else {
      const err = await res.json().catch(()=>({ error: 'Error desconocido' }))
      alert(`Error al guardar gasto: ${err.error || res.statusText}`)
    }
  }

  // Calculate expenses grouped by month
  const expensesByMonth = useMemo(() => {
    const expensesMap = new Map<string, any[]>()
    
    // Agrupar gastos por mes
    expenses.forEach((e: any) => {
      if (!e.date) return
      
      const expenseDate = new Date(e.date)
      const expenseYear = expenseDate.getFullYear()
      const expenseMonth = expenseDate.getMonth()
      
      // Si es a meses sin intereses, generar pagos mensuales
      if (e.is_installment && e.installment_months && e.monthly_payment) {
        const months = Number(e.installment_months)
        const monthlyPayment = Number(e.monthly_payment)
        
        for (let i = 0; i < months; i++) {
          const paymentDate = new Date(expenseYear, expenseMonth + i, expenseDate.getDate())
          const monthKey = `${paymentDate.getFullYear()}-${String(paymentDate.getMonth() + 1).padStart(2, '0')}`
          
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
      } else {
        // Gastos normales (fijos o variables de una vez)
        const monthKey = `${expenseYear}-${String(expenseMonth + 1).padStart(2, '0')}`
        
        if (!expensesMap.has(monthKey)) {
          expensesMap.set(monthKey, [])
        }
        
        expensesMap.get(monthKey)!.push(e)
      }
    })
    
    // Ordenar meses (más recientes primero)
    const sortedMonths = Array.from(expensesMap.keys()).sort().reverse()
    
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
  }, [expenses])

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
              <Button onClick={submitSalary} disabled={!salaryForm.user_id || !salaryForm.monthly_salary}>Guardar</Button>
            </div>
            <div className="md:col-span-4">
              <label className="block text-sm mb-1">Notas</label>
              <Input value={salaryForm.notes} onChange={e => setSalaryForm(s => ({ ...s, notes: e.target.value }))} placeholder="Opcional" />
            </div>
          </div>

          <div className="mt-6 divide-y">
            {currentSalaries.map((s) => (
              <div key={s.id} className="py-2 text-sm flex justify-between">
                <div>
                  <span className="font-medium">{users.find((u:any)=>u.id===s.user_id)?.name || 'Empleado'}</span>
                  {s.notes && <span className="text-gray-500"> · {s.notes}</span>}
                </div>
                <div className="font-semibold">{s.monthly_salary.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Client billing */}
        <section className="bg-white rounded-lg shadow-sm border p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Facturación de clientes (mensual)</h2>
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
              <Button onClick={submitBilling} disabled={!billingForm.project_id || !billingForm.monthly_amount}>Guardar</Button>
            </div>
          </div>

          <div className="mt-6 divide-y">
            {(Array.isArray(billings) ? billings : []).map((b) => (
              <div key={b.id} className="py-2 text-sm flex justify-between">
                <div>
                  <span className="font-medium">{projects.find((p:any)=>p.id===b.project_id)?.name || 'Proyecto'}</span>
                  <span className="text-gray-500"> · Paga día {b.payment_day}</span>
                </div>
                <div className="font-semibold">${b.monthly_amount}</div>
              </div>
            ))}
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
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Gastos</h2>
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
              <Button onClick={submitExpense} disabled={!expenseForm.description || !expenseForm.amount}>Guardar</Button>
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
                  {monthData.expenses.map((e: any) => (
                    <div key={`${e.id}-${e.payment_month || ''}`} className="py-2 text-sm flex justify-between items-center bg-gray-50 px-3 rounded">
                      <div className="flex-1">
                        <span className="font-medium">{e.description}</span>
                        <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${e.expense_type === 'fixed' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>
                          {e.expense_type === 'fixed' ? 'Fijo' : 'Variable'}
                        </span>
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
                      <div className="font-semibold">{Number(e.amount).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}</div>
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
                  {expenses
                    .filter(e => e.expense_type === 'fixed' && !e.is_installment)
                    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                    .toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
              <div className="bg-orange-50 px-4 py-3 rounded-lg border border-orange-200">
                <div className="text-xs text-gray-600 mb-1">Total Gastos Variables</div>
                <div className="text-lg font-bold text-orange-700">
                  {expenses
                    .filter(e => e.expense_type === 'variable' && !e.is_installment)
                    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0)
                    .toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}


