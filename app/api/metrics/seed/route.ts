import { NextRequest, NextResponse } from 'next/server'
import { ProjectsService } from '@/lib/services/projects'
import { FinanceService } from '@/lib/services/finance'

function ymd(month: string, day: number) {
  const d = String(Math.max(1, Math.min(28, day))).padStart(2, '0')
  return `${month}-${d}`
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const month = searchParams.get('month') || (() => {
      const now = new Date()
      return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    })()

    // 1) Crear 2 clientes/proyectos con objetivos
    const projA = await ProjectsService.createProject(workspaceId, {
      name: 'Cliente X (Audiovisual)',
      description: 'Videos mensuales para X',
      priority: 'medium',
      deadline: ymd(month, 28),
      monthly_videos: 6,
      monthly_photos: 0,
      monthly_designs: 2,
    } as any)

    const projB = await ProjectsService.createProject(workspaceId, {
      name: 'Cliente Y (Diseño)',
      description: 'Calendario y posts diseño',
      priority: 'medium',
      deadline: ymd(month, 28),
      monthly_videos: 0,
      monthly_photos: 10,
      monthly_designs: 12,
    } as any)

    // 2) Billing mensual por proyecto
    await FinanceService.createClientBilling({
      workspace_id: workspaceId,
      project_id: projA.id,
      monthly_amount: 12000,
      payment_day: 15,
    } as any)
    await FinanceService.createClientBilling({
      workspace_id: workspaceId,
      project_id: projB.id,
      monthly_amount: 9000,
      payment_day: 10,
    } as any)

    // 3) Sueldos (Pablo y Sandra, ids de datos demo)
    await FinanceService.createSalary({
      workspace_id: workspaceId,
      user_id: 'user-1', // Pablo
      monthly_salary: 12000,
      effective_month: month,
      notes: 'Ejemplo demo'
    } as any)
    await FinanceService.createSalary({
      workspace_id: workspaceId,
      user_id: 'user-3', // Sandra (diseño)
      monthly_salary: 11000,
      effective_month: month,
      notes: 'Ejemplo demo'
    } as any)

    // 4) Worklogs por etapas y tipos
    const wl: Array<Parameters<typeof FinanceService.createWorklog>[0]> = [
      // Pablo audiovisual (Cliente X)
      { workspace_id: workspaceId, user_id: 'user-1', project_id: projA.id, type: 'guion', hours: 3, date: ymd(month, 3), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-1', project_id: projA.id, type: 'sesion', hours: 4, date: ymd(month, 5), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-1', project_id: projA.id, type: 'edicion', hours: 6, date: ymd(month, 7), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-1', project_id: projA.id, type: 'color', hours: 2, date: ymd(month, 8), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-1', project_id: projA.id, type: 'upload', hours: 1, date: ymd(month, 9), notes: '' },

      // Sandra diseño (Cliente Y)
      { workspace_id: workspaceId, user_id: 'user-3', project_id: projB.id, type: 'brief', hours: 2, date: ymd(month, 4), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-3', project_id: projB.id, type: 'diseño', hours: 8, date: ymd(month, 6), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-3', project_id: projB.id, type: 'revision', hours: 3, date: ymd(month, 10), notes: '' },
      { workspace_id: workspaceId, user_id: 'user-3', project_id: projB.id, type: 'publish', hours: 1, date: ymd(month, 12), notes: '' },

      // Interno/No asignado
      { workspace_id: workspaceId, user_id: 'user-1', project_id: undefined, type: 'reunion interna', hours: 2, date: ymd(month, 2), notes: '' },
    ]
    for (const w of wl) { await FinanceService.createWorklog(w as any) }

    return NextResponse.json({ ok: true, projects: [projA, projB], seeded: wl.length + 4 }, { status: 201 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || 'seed failed' }, { status: 500 })
  }
}


