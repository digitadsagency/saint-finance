import { PrismaClient } from '@prisma/client'
import { financeConfig } from '@/src/lib/financeConfig'

export type FinanceMetrics = {
  month: string
  employees: Array<{
    employeeId: string
    name: string
    sueldoMensual: number
    horasMes: number
    costoHoraReal: number
    capacidadHoras: number
    utilizacion: number
  }>
  clients: Array<{
    clientId: string | null
    clientName: string
    revenue: number
    horas: number
    costoLabor: number
    margenAbs: number
    margenPct: number | null
    alertas: string[]
    projects: Array<{
      projectId: string | null
      projectName: string
      revenue: number
      horas: number
      costoLabor: number
      margenAbs: number
      margenPct: number | null
      alertas: string[]
    }>
  }>
  totals: {
    ingresos: number
    costoLabor: number
    margenAbs: number
    margenPct: number | null
    utilizacionPromedioEquipo: number
  }
}

const prisma = new PrismaClient()

function startEndOfMonth(month: string) {
  const [y, m] = month.split('-').map(Number)
  const start = new Date(y, m - 1, 1)
  const end = new Date(y, m, 0) // last day prev month boundary
  const endIso = new Date(end.getFullYear(), end.getMonth(), end.getDate(), 23, 59, 59, 999)
  return { start, end: endIso }
}

export async function getFinanceMetrics(month: string): Promise<FinanceMetrics> {
  const { HORAS_CAPACIDAD_MES } = financeConfig
  const { start, end } = startEndOfMonth(month)

  // Base entities
  const [employees, projects, clients] = await Promise.all([
    prisma.employee.findMany({ select: { id: true, name: true } }),
    prisma.project.findMany({ select: { id: true, name: true, clientId: true } }),
    prisma.client.findMany({ select: { id: true, name: true } }),
  ])

  const clientById = new Map(clients.map((c: any) => [c.id, c]))
  const projectById = new Map(projects.map((p: any) => [p.id, p]))

  // Salaries: effective <= month; choose latest by effectiveMonth then createdAt
  const salariesAll = await prisma.employeeSalary.findMany({
    where: { effectiveMonth: { lte: month } },
    orderBy: [{ effectiveMonth: 'desc' }, { createdAt: 'desc' }],
  })
  const salaryByEmployee = new Map<string, typeof salariesAll[number]>()
  for (const s of salariesAll) {
    if (!salaryByEmployee.has(s.employeeId)) salaryByEmployee.set(s.employeeId, s)
  }

  // Time entries in month
  const timeEntries = await prisma.timeEntry.findMany({
    where: { date: { gte: start, lte: end } },
    select: { id: true, employeeId: true, projectId: true, type: true, hours: true, date: true },
  })

  // Hours by employee and by project+employee
  const horasByEmployee = new Map<string, number>()
  const horasByProjectEmployee = new Map<string, number>() // key: `${projectId||'none'}|${employeeId}`
  for (const t of timeEntries) {
    horasByEmployee.set(t.employeeId, (horasByEmployee.get(t.employeeId) || 0) + (t.hours || 0))
    const pid = t.projectId ?? 'none'
    const key = `${pid}|${t.employeeId}`
    horasByProjectEmployee.set(key, (horasByProjectEmployee.get(key) || 0) + (t.hours || 0))
  }

  // Employee KPIs
  const employeesKPIs = employees.map((e: any) => {
    const sueldoMensual = salaryByEmployee.get(e.id)?.amountMonthlyMXN || 0
    const horasMes = horasByEmployee.get(e.id) || 0
    const costoHoraByHours = horasMes > 0 ? (sueldoMensual / horasMes) : (sueldoMensual / HORAS_CAPACIDAD_MES)
    const costoHoraReal = costoHoraByHours
    const capacidadHoras = HORAS_CAPACIDAD_MES
    const utilizacion = capacidadHoras > 0 ? (horasMes / capacidadHoras) : 0
    return {
      employeeId: e.id,
      name: e.name,
      sueldoMensual,
      horasMes,
      costoHoraReal,
      capacidadHoras,
      utilizacion,
    }
  })

  // Billing: fetch latest records (assumed monthly recurring)
  const clientBilling = await prisma.clientBilling.findMany({
    // no validity window; pick latest per entity
    orderBy: [{ createdAt: 'desc' }],
  })
  // Choose last record per project or client
  const billingPerProject = new Map<string, number>()
  const billingPerClient = new Map<string, number>()
  for (const b of clientBilling) {
    if (b.projectId) {
      if (!billingPerProject.has(b.projectId)) billingPerProject.set(b.projectId, b.monthlyAmountMXN || 0)
    } else if (b.clientId) {
      if (!billingPerClient.has(b.clientId)) billingPerClient.set(b.clientId, b.monthlyAmountMXN || 0)
    }
  }

  // Revenue allocation to projects
  const revenueProject = new Map<string, number>()
  for (const [pid, amount] of Array.from(billingPerProject.entries())) revenueProject.set(pid, amount)
  for (const [cid, amount] of Array.from(billingPerClient.entries())) {
    const projs = projects.filter(p => p.clientId === cid)
    if (projs.length === 0) {
      // keep at client level only; handled below
      continue
    }
    const share = amount / projs.length
    for (const p of projs) revenueProject.set(p.id, (revenueProject.get(p.id) || 0) + share)
  }

  // Project metrics and roll up to clients, include "No asignado"
  const employeeCostHour = new Map<string, number>(employeesKPIs.map((e: any) => [e.employeeId, e.costoHoraReal]))

  type ProjectAgg = { revenue: number; horas: number; costoLabor: number }
  const projectAgg = new Map<string, ProjectAgg>()

  // Hours and labor cost by project
  for (const [key, horas] of Array.from(horasByProjectEmployee.entries())) {
    const [pid, eid] = key.split('|')
    const costHour = employeeCostHour.get(eid) || 0
    const costoLabor = costHour * horas
    const agg = projectAgg.get(pid) || { revenue: 0, horas: 0, costoLabor: 0 }
    agg.horas += horas
    agg.costoLabor += costoLabor
    projectAgg.set(pid, agg)
  }
  // Add revenue to projectAgg
  for (const [pid, rev] of Array.from(revenueProject.entries())) {
    const agg = projectAgg.get(pid) || { revenue: 0, horas: 0, costoLabor: 0 }
    agg.revenue += rev
    projectAgg.set(pid, agg)
  }

  // Build clients array including No asignado (pid 'none')
  const clientProjects = new Map<string|null, Array<{projectId: string|null, projectName: string, revenue: number, horas: number, costoLabor: number}>>()
  // init
  for (const p of projects) {
    if (!clientProjects.has(p.clientId)) clientProjects.set(p.clientId, [])
  }
  clientProjects.set(null, [])

  for (const [pid, agg] of Array.from(projectAgg.entries())) {
    if (pid === 'none') {
      const arr = clientProjects.get(null)!
      arr.push({ projectId: null, projectName: 'Interno/No asignado', revenue: 0 + agg.revenue, horas: agg.horas, costoLabor: agg.costoLabor })
      continue
    }
    const p = projectById.get(pid)
    if (!p) continue
    const arr = clientProjects.get(p.clientId) || []
    arr.push({ projectId: p.id, projectName: p.name, revenue: agg.revenue, horas: agg.horas, costoLabor: agg.costoLabor })
    clientProjects.set(p.clientId, arr)
  }

  // Also include projects with revenue but no hours
  for (const [pid, rev] of Array.from(revenueProject.entries())) {
    const agg = projectAgg.get(pid) || { revenue: rev, horas: 0, costoLabor: 0 }
    if (!projectAgg.has(pid)) {
      const p = projectById.get(pid)
      if (!p) continue
      const arr = clientProjects.get(p.clientId) || []
      arr.push({ projectId: p.id, projectName: p.name, revenue: rev, horas: 0, costoLabor: 0 })
      clientProjects.set(p.clientId, arr)
    }
  }

  // Compose client metrics
  const clientsMetrics: FinanceMetrics['clients'] = []
  for (const [cid, projs] of Array.from(clientProjects.entries())) {
    if (!projs || projs.length === 0) continue
    const clientName = cid ? (clientById.get(cid)?.name || 'Cliente') : 'No asignado'
    const revenue = projs.reduce((s, p) => s + (p.revenue || 0), 0)
    const horas = projs.reduce((s, p) => s + (p.horas || 0), 0)
    const costoLabor = projs.reduce((s, p) => s + (p.costoLabor || 0), 0)
    const margenAbs = revenue - costoLabor
    const margenPct = revenue > 0 ? +(margenAbs / revenue).toFixed(2) : null
    const alertas: string[] = []
    if (margenPct !== null && margenPct < 0.40) alertas.push('ALERTA_MARGEN_BAJO')
    const projectsOut = projs.map((p: any) => {
      const pmargenAbs = p.revenue - p.costoLabor
      const pmargenPct = p.revenue > 0 ? +(pmargenAbs / p.revenue).toFixed(2) : null
      const palertas: string[] = []
      if (pmargenPct !== null && pmargenPct < 0.40) palertas.push('ALERTA_MARGEN_BAJO')
      return { ...p, margenAbs: pmargenAbs, margenPct: pmargenPct, alertas: palertas }
    })
    clientsMetrics.push({
      clientId: cid,
      clientName,
      revenue,
      horas,
      costoLabor,
      margenAbs,
      margenPct,
      alertas,
      projects: projectsOut,
    })
  }

  const ingresos = clientsMetrics.reduce((s,c)=> s + (c.revenue||0), 0)
  const costoLabor = clientsMetrics.reduce((s,c)=> s + (c.costoLabor||0), 0)
  const margenAbs = ingresos - costoLabor
  const margenPct = ingresos > 0 ? +(margenAbs/ingresos).toFixed(2) : null
  const utilizacionPromedioEquipo = employeesKPIs.length > 0 ? (employeesKPIs.reduce((s,e)=> s + e.utilizacion, 0) / employeesKPIs.length) : 0

  return {
    month,
    employees: employeesKPIs,
    clients: clientsMetrics,
    totals: { ingresos, costoLabor, margenAbs, margenPct, utilizacionPromedioEquipo },
  }
}


