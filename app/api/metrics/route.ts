import { NextRequest, NextResponse } from 'next/server'

function isValidMonth(m?: string | null) {
  if (!m) return false
  return /^\d{4}-\d{2}$/.test(m)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const month = searchParams.get('month')
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const m = isValidMonth(month) ? month! : defaultMonth

    // Google Sheets only
    const { FinanceService } = await import('@/lib/services/finance')
    const { ProjectsService } = await import('@/lib/services/projects')
    const { UsersService } = await import('@/lib/services/users')
    const { TasksService } = await import('@/lib/services/tasks')

    const [salaries, worklogs, billings, projects, users, tasks, expenses, incomes, payments] = await Promise.all([
      FinanceService.listSalaries(workspaceId),
      FinanceService.listWorklogs(workspaceId),
      FinanceService.listClientBilling(workspaceId),
      ProjectsService.getAllProjects(workspaceId),
      UsersService.getAllUsers().catch(() => []),
      TasksService.getAllTasks(workspaceId).catch(() => []),
      FinanceService.listExpenses(workspaceId).catch(() => []),
      FinanceService.listIncomes(workspaceId).catch(() => []),
      FinanceService.listPaymentRecords(workspaceId, m).catch(() => [])
    ])
    
    // Debug: Log data counts
    console.log(`[Metrics] Month: ${m}, Workspace: ${workspaceId}`)
    console.log(`[Metrics] Data counts: salaries=${salaries?.length || 0}, billings=${billings?.length || 0}, projects=${projects?.length || 0}, expenses=${expenses?.length || 0}, incomes=${incomes?.length || 0}, payments=${payments?.length || 0}`)

    // Mapear nombres de empleados
    const userNameById = new Map<string, string>()
    for (const u of users) {
      const uid = u.id || u.user_id
      const name = u.name || u.username || ''
      if (uid && name) userNameById.set(uid, name)
    }

    const monthPrefix = m + '-'
    // Normaliza tipos específicos a tipos generales y específicos
    const normalizeType = (raw: any): { general: string, specific: string } => {
      const t = String(raw || '').toLowerCase().trim()
      if (!t) return { general: 'otro', specific: 'otro' }
      
      // Reels (audiovisual/video)
      if (['reel_corto','reel corto','reel-corto','reel simple','reel rápido'].includes(t)) {
        return { general: 'video', specific: 'reel_corto' }
      }
      if (['reel_largo','reel largo','reel-largo','reel elaborado','reel completo'].includes(t)) {
        return { general: 'video', specific: 'reel_largo' }
      }
      if (['reel','reels'].includes(t)) {
        return { general: 'video', specific: 'reel' }
      }
      if (['video','videos','audiovisual','audio/visual','av'].includes(t)) {
        return { general: 'video', specific: 'video' }
      }
      
      // Diseño
      if (['diseno_simple','diseño simple','diseño-simple','diseño básico','diseño basico'].includes(t)) {
        return { general: 'diseno', specific: 'diseno_simple' }
      }
      if (['diseno_complejo','diseño complejo','diseño-complejo','diseño avanzado','diseño elaborado'].includes(t)) {
        return { general: 'diseno', specific: 'diseno_complejo' }
      }
      if (['diseno','diseño','design'].includes(t)) {
        return { general: 'diseno', specific: 'diseno' }
      }
      
      // Fotos
      if (['foto_simple','foto simple','foto-simple','foto básica','foto basica'].includes(t)) {
        return { general: 'foto', specific: 'foto_simple' }
      }
      if (['foto_elaborada','foto elaborada','foto-elaborada','foto compleja','foto avanzada'].includes(t)) {
        return { general: 'foto', specific: 'foto_elaborada' }
      }
      if (['foto','fotos','photo','photos','fotografia','fotografía'].includes(t)) {
        return { general: 'foto', specific: 'foto' }
      }
      
      // Otros tipos
      if (['guion','script'].includes(t)) return { general: 'otro', specific: 'guion' }
      if (['sesion','sesión','shoot','grabacion','grabación','record'].includes(t)) return { general: 'otro', specific: 'sesion' }
      if (['edicion','edición','edit'].includes(t)) return { general: 'otro', specific: 'edicion' }
      if (['color','colorizacion','colorización','colorize','grading'].includes(t)) return { general: 'otro', specific: 'color' }
      if (['upload','subir','drive','publicar','publish'].includes(t)) return { general: 'otro', specific: 'upload' }
      if (['brief','briefing'].includes(t)) return { general: 'otro', specific: 'brief' }
      if (['revision','revisión','review'].includes(t)) return { general: 'otro', specific: 'revision' }
      
      return { general: 'otro', specific: t }
    }
    const monthWorklogs = worklogs
      .filter((w:any)=> (w.date || '').startsWith(monthPrefix))
      .map((w:any)=> {
        const norm = normalizeType(w.type)
        return {...w, _typeNorm: norm.general, _typeSpecific: norm.specific}
      })
    // Para promedios globales por tipo usamos TODOS los registros (independiente de proyecto/mes/empleado)
    const allWorklogsNorm = worklogs.map((w:any)=> {
      const norm = normalizeType(w.type)
      return {...w, _typeNorm: norm.general, _typeSpecific: norm.specific}
    })

    const groupedSal = new Map<string, any[]>()
    for (const s of salaries) {
      const uid = s.user_id
      const arr = groupedSal.get(uid) || []
      arr.push(s)
      groupedSal.set(uid, arr)
    }
    const latestSal = new Map<string, number>()
    for (const [uid, arr] of Array.from(groupedSal.entries())) {
      const elig = arr.filter((x:any)=> ((x.effective_month||'')||'').slice(0,7) <= m)
      elig.sort((a:any,b:any)=> ((a.effective_month||'') > (b.effective_month||'') ? -1 : 1))
      const chosen = elig[0]
      latestSal.set(uid, Number(chosen?.monthly_salary || 0))
    }

    // Calcular horas trabajadas basadas en tareas asignadas y completadas del mes
    // Filtrar tareas del mes actual (basadas en created_at o updated_at)
    const monthTasks = (tasks || []).filter((t: any) => {
      if (!t.created_at && !t.updated_at) return false
      const taskDate = t.updated_at || t.created_at
      return taskDate.startsWith(monthPrefix)
    })

    // Calcular horas por empleado basadas en tareas asignadas y completadas
    const horasByEmp = new Map<string, number>()
    const horasByProjEmp = new Map<string, number>()
    
    // Sumar horas de worklogs del mes (para compatibilidad)
    for (const w of monthWorklogs) {
      const uid = w.user_id
      const pid = w.project_id || 'none'
      const h = Number(w.hours || 0)
      horasByEmp.set(uid, (horasByEmp.get(uid) || 0) + h)
      const key = pid + '|' + uid
      horasByProjEmp.set(key, (horasByProjEmp.get(key) || 0) + h)
    }
    
    // Sumar horas estimadas de tareas asignadas y completadas
    for (const task of monthTasks) {
      const uid = task.assignee_id
      if (!uid) continue
      
      const estimateHours = Number(task.estimate_hours || 0)
      if (estimateHours <= 0) continue
      
      // Solo contar horas de tareas completadas o en progreso
      const status = task.status || 'todo'
      if (status === 'done' || status === 'inprogress' || status === 'review') {
        horasByEmp.set(uid, (horasByEmp.get(uid) || 0) + estimateHours)
        
        const pid = task.project_id || 'none'
        const key = pid + '|' + uid
        horasByProjEmp.set(key, (horasByProjEmp.get(key) || 0) + estimateHours)
      }
    }

    // Base de 6 horas diarias por empleado, 5 días a la semana
    // 6 horas/día × 5 días/semana = 30 horas/semana por empleado
    // 30 horas/semana × 4 semanas/mes = 120 horas/mes por empleado
    const HORAS_DIARIAS = 6
    const DIAS_SEMANA = 5
    const SEMANAS_MES = 4
    const HORAS_SEMANA_POR_EMPLEADO = HORAS_DIARIAS * DIAS_SEMANA // 30 horas/semana
    const HORAS_CAPACIDAD_MES = HORAS_SEMANA_POR_EMPLEADO * SEMANAS_MES // 120 horas/mes por empleado
    const employeesIds = Array.from(new Set([...Array.from(latestSal.keys()), ...Array.from(horasByEmp.keys())]))
    const employees = employeesIds
      .filter(uid => latestSal.get(uid) || horasByEmp.get(uid))
      .map(uid => {
        const sueldoMensual = latestSal.get(uid) || 0
        const horasMes = horasByEmp.get(uid) || 0
        // Calcular costo por hora usando base de 6 horas diarias (120 horas/mes)
        const costoHoraReal = sueldoMensual / HORAS_CAPACIDAD_MES
        const utilizacion = HORAS_CAPACIDAD_MES > 0 ? (horasMes / HORAS_CAPACIDAD_MES) : 0
        return { employeeId: uid, name: userNameById.get(uid) || `Empleado ${uid.slice(0, 8)}`, sueldoMensual, horasMes, costoHoraReal, capacidadHoras: HORAS_CAPACIDAD_MES, utilizacion }
      })
      .sort((a, b) => a.name.localeCompare(b.name))

    const costHourByEmp = new Map(employees.map(e => [e.employeeId, e.costoHoraReal]))
    const revenueProject = new Map<string, number>()
    for (const b of billings) {
      if (b.project_id) {
        const pid = b.project_id
        revenueProject.set(pid, (revenueProject.get(pid) || 0) + Number(b.monthly_amount || 0))
      }
    }

    type Agg = { revenue: number; horas: number; costoLabor: number }
    const aggByProject = new Map<string, Agg>()
    for (const [key, h] of Array.from(horasByProjEmp.entries())) {
      const [pid, uid] = key.split('|')
      const costHour = costHourByEmp.get(uid) || 0
      const agg = aggByProject.get(pid) || { revenue: 0, horas: 0, costoLabor: 0 }
      agg.horas += h
      agg.costoLabor += h * costHour
      aggByProject.set(pid, agg)
    }
    for (const [pid, rev] of Array.from(revenueProject.entries())) {
      const agg = aggByProject.get(pid) || { revenue: 0, horas: 0, costoLabor: 0 }
      agg.revenue += rev
      aggByProject.set(pid, agg)
    }

    // Promedios globales por área/tipo (independiente de empleado/proyecto/mes)
    // IMPORTANTE: Los promedios se calculan sumando TODAS las horas de TODOS los empleados
    // por cada tipo de trabajo, y luego dividiendo entre el total de registros
    // Ejemplo: Si Pablo tarda 2h en reel largo y Dani tarda 2h en otro reel largo:
    //          Promedio = (2 + 2) / 2 = 2 horas por reel largo (sin importar quién lo hizo)
    
    // 1. Promedios por tipo específico (reel_corto, reel_largo, diseño_simple, etc.)
    // Sumamos todas las horas de todos los empleados por cada tipo específico
    const specificTypeAgg = new Map<string, { totalHours: number, totalCount: number }>() // key: specificType
    for (const w of allWorklogsNorm) {
      const tSpecific = w._typeSpecific || w._typeNorm
      const h = Number(w.hours || 0)
      if (h > 0) { // Solo contar registros con horas válidas
        const agg = specificTypeAgg.get(tSpecific) || { totalHours: 0, totalCount: 0 }
        agg.totalHours += h  // Sumar horas de TODOS los empleados
        agg.totalCount += 1  // Contar registro (sin importar empleado)
        specificTypeAgg.set(tSpecific, agg)
      }
    }
    
    // Calcular promedio: total de horas / total de registros (por área/tipo, no por empleado)
    const specificTypeAvgHours = new Map<string, number>() // key: specificType -> avgHours
    for (const [type, agg] of Array.from(specificTypeAgg.entries())) {
      // Promedio global = Suma de todas las horas / Total de registros (sin importar empleado)
      specificTypeAvgHours.set(type, agg.totalCount > 0 ? agg.totalHours / agg.totalCount : 0)
    }
    
    // 2. Promedios por tipo general/área (video, foto, diseno)
    // Sumamos TODAS las horas de todos los empleados de todos los tipos específicos en cada área
    const generalTypeAgg = new Map<string, { totalHours: number, totalCount: number }>()
    
    for (const w of allWorklogsNorm) {
      const tGeneral = w._typeNorm
      if (['video', 'foto', 'diseno'].includes(tGeneral)) {
        const h = Number(w.hours || 0)
        if (h > 0) {
          const agg = generalTypeAgg.get(tGeneral) || { totalHours: 0, totalCount: 0 }
          agg.totalHours += h  // Sumar horas de TODOS los empleados
          agg.totalCount += 1  // Contar registro (sin importar empleado)
          generalTypeAgg.set(tGeneral, agg)
        }
      }
    }
    
    // Calcular promedio por área: total de horas / total de registros (sin importar empleado)
    const generalTypeAvg = new Map<string, number>() // key: generalType (video/foto/diseno) -> avgHours
    for (const [type, agg] of Array.from(generalTypeAgg.entries())) {
      // Promedio global del área = Suma de todas las horas / Total de registros (sin importar empleado)
      generalTypeAvg.set(type, agg.totalCount > 0 ? agg.totalHours / agg.totalCount : 0)
    }

    const projectsById = new Map(projects.map((p:any)=> [p.id, p]))
    const clients: any[] = []
    // Construir métricas por cliente basadas en objetivos (monthly_*) y promedios bestEmpForType
    for (const p of projects) {
      const pid = p.id
      const revenue = revenueProject.get(pid) || 0
      // Objetivos específicos por tipo de trabajo
      const specificObjectives = {
        // Audiovisual/Video
        reel_corto: Number(p.monthly_reel_corto || 0),
        reel_largo: Number(p.monthly_reel_largo || 0),
        reel: Number(p.monthly_reel || 0),
        video: Number(p.monthly_video || 0),
        // Diseño
        diseno_simple: Number(p.monthly_diseno_simple || 0),
        diseno_complejo: Number(p.monthly_diseno_complejo || 0),
        diseno: Number(p.monthly_diseno || 0),
        // Fotos
        foto_simple: Number(p.monthly_foto_simple || 0),
        foto_elaborada: Number(p.monthly_foto_elaborada || 0),
        foto: Number(p.monthly_foto || 0),
        // Sesiones de grabación (3 horas por sesión)
        recording_session: Number(p.monthly_recording_sessions || 0),
      }
      
      // Objetivos generales (para compatibilidad con proyectos antiguos)
      const generalObjectives = {
        videos: Number(p.monthly_videos || 0),
        photos: Number(p.monthly_photos || 0),
        designs: Number(p.monthly_designs || 0),
      }
      
      // asignación de horas estimadas usando promedios específicos por tipo
      const allocByEmp = new Map<string, number>()
      
      const addAllocSpecific = (specificType: string, units: number) => {
        if (units <= 0) return
        
        // Usar el promedio específico del tipo (ej: reel_corto, reel_largo, etc.)
        const avgHours = specificTypeAvgHours.get(specificType) || 0
        
        if (avgHours <= 0) return
        
        // Calcular total de horas: cantidad de entregables × promedio específico por tipo
        const totalHours = units * avgHours
        
        // Distribuir horas entre empleados según su costo/hora (empleado más económico primero)
        const empList = [...employees]
          .filter(e => costHourByEmp.get(e.employeeId) || 0 > 0)
          .sort((a, b) => (costHourByEmp.get(a.employeeId) || 0) - (costHourByEmp.get(b.employeeId) || 0))
        
        if (empList.length > 0) {
          // Asignar al empleado más económico
          const emp = empList[0]
          allocByEmp.set(emp.employeeId, (allocByEmp.get(emp.employeeId) || 0) + totalHours)
        }
      }
      
      const addAllocGeneral = (generalType: string, units: number) => {
        if (units <= 0) return
        
        // Usar el promedio general del tipo (para compatibilidad con proyectos antiguos)
        const avgHours = generalTypeAvg.get(generalType) || 0
        
        if (avgHours <= 0) return
        
        const totalHours = units * avgHours
        
        const empList = [...employees]
          .filter(e => costHourByEmp.get(e.employeeId) || 0 > 0)
          .sort((a, b) => (costHourByEmp.get(a.employeeId) || 0) - (costHourByEmp.get(b.employeeId) || 0))
        
        if (empList.length > 0) {
          const emp = empList[0]
          allocByEmp.set(emp.employeeId, (allocByEmp.get(emp.employeeId) || 0) + totalHours)
        }
      }
      
      // Usar tipos específicos primero (si están definidos)
      addAllocSpecific('reel_corto', specificObjectives.reel_corto)
      addAllocSpecific('reel_largo', specificObjectives.reel_largo)
      addAllocSpecific('reel', specificObjectives.reel)
      addAllocSpecific('video', specificObjectives.video)
      addAllocSpecific('diseno_simple', specificObjectives.diseno_simple)
      addAllocSpecific('diseno_complejo', specificObjectives.diseno_complejo)
      addAllocSpecific('diseno', specificObjectives.diseno)
      addAllocSpecific('foto_simple', specificObjectives.foto_simple)
      addAllocSpecific('foto_elaborada', specificObjectives.foto_elaborada)
      addAllocSpecific('foto', specificObjectives.foto)
      
      // Sesiones de grabación: cada sesión = 3 horas
      if (specificObjectives.recording_session > 0) {
        const recordingHours = specificObjectives.recording_session * 3
        const empList = [...employees]
          .filter(e => costHourByEmp.get(e.employeeId) || 0 > 0)
          .sort((a, b) => (costHourByEmp.get(a.employeeId) || 0) - (costHourByEmp.get(b.employeeId) || 0))
        
        if (empList.length > 0) {
          const emp = empList[0]
          allocByEmp.set(emp.employeeId, (allocByEmp.get(emp.employeeId) || 0) + recordingHours)
        }
      }
      
      // Si no hay tipos específicos pero hay objetivos generales (compatibilidad)
      const hasSpecificTypes = Object.values(specificObjectives).some(v => v > 0)
      if (!hasSpecificTypes) {
        addAllocGeneral('video', generalObjectives.videos)
        addAllocGeneral('foto', generalObjectives.photos)
        addAllocGeneral('diseno', generalObjectives.designs)
      }

      const requiredHours = Array.from(allocByEmp.values()).reduce((s,h)=> s+h, 0)
      const costoLaborEstimado = Array.from(allocByEmp.entries()).reduce((s,[uid, hrs])=> s + hrs * (costHourByEmp.get(uid) || 0), 0)
      const margenAbs = revenue - costoLaborEstimado
      const margenPct = revenue > 0 ? +(margenAbs / revenue).toFixed(2) : null
      const alertas: string[] = []
      if (margenPct !== null && margenPct < 0.40) alertas.push('ALERTA_MARGEN_BAJO')

      // Calcular desglose de horas por tipo específico (para mostrar en UI)
      const horasByType: any[] = []
      const addHorasByType = (specificType: string, units: number) => {
        if (units <= 0) return
        const avgHours = specificTypeAvgHours.get(specificType) || 0
        if (avgHours > 0) {
          const totalHoras = units * avgHours
          horasByType.push({ type: specificType, units, avgHours, totalHoras })
        }
      }
      
      // Calcular horas por cada tipo específico que tiene el cliente
      addHorasByType('reel_corto', specificObjectives.reel_corto)
      addHorasByType('reel_largo', specificObjectives.reel_largo)
      addHorasByType('reel', specificObjectives.reel)
      addHorasByType('video', specificObjectives.video)
      addHorasByType('diseno_simple', specificObjectives.diseno_simple)
      addHorasByType('diseno_complejo', specificObjectives.diseno_complejo)
      addHorasByType('diseno', specificObjectives.diseno)
      addHorasByType('foto_simple', specificObjectives.foto_simple)
      addHorasByType('foto_elaborada', specificObjectives.foto_elaborada)
      addHorasByType('foto', specificObjectives.foto)
      
      // Si no hay tipos específicos, usar generales
      if (horasByType.length === 0) {
        const addHorasGeneral = (generalType: string, units: number) => {
          if (units <= 0) return
          const avgHours = generalTypeAvg.get(generalType) || 0
          if (avgHours > 0) {
            const totalHoras = units * avgHours
            horasByType.push({ type: generalType, units, avgHours, totalHoras })
          }
        }
        addHorasGeneral('video', generalObjectives.videos)
        addHorasGeneral('foto', generalObjectives.photos)
        addHorasGeneral('diseno', generalObjectives.designs)
      }

      clients.push({
        clientId: pid,
        clientName: projectsById.get(pid)?.name || 'Proyecto',
        revenue,
        horas: requiredHours, // ahora horas ESTIMADAS
        costoLabor: Math.round(costoLaborEstimado),
        margenAbs: Math.round(margenAbs),
        margenPct,
        alertas,
        objectives: {
          // Específicos
          reel_corto: specificObjectives.reel_corto,
          reel_largo: specificObjectives.reel_largo,
          reel: specificObjectives.reel,
          video: specificObjectives.video,
          diseno_simple: specificObjectives.diseno_simple,
          diseno_complejo: specificObjectives.diseno_complejo,
          diseno: specificObjectives.diseno,
          foto_simple: specificObjectives.foto_simple,
          foto_elaborada: specificObjectives.foto_elaborada,
          foto: specificObjectives.foto,
          // Generales (para compatibilidad)
          videos: generalObjectives.videos,
          photos: generalObjectives.photos,
          designs: generalObjectives.designs
        },
        requiredHours,
        horasByType, // Desglose de horas por tipo específico con promedios
        projects: [{ projectId: pid, projectName: projectsById.get(pid)?.name || 'Proyecto', revenue, horas: requiredHours, costoLabor: Math.round(costoLaborEstimado), margenAbs: Math.round(margenAbs), margenPct, alertas }]
      })
    }

    // Calcular ingresos esperados (de facturación mensual de clientes)
    // Los ingresos esperados vienen de la facturación mensual (billings)
    const ingresosEsperados = (billings || []).reduce((sum: number, b: any) => {
      const amount = Number(b.monthly_amount) || 0
      return sum + amount
    }, 0)
    
    // También sumar los ingresos esperados de los clientes calculados (revenue)
    const ingresosEsperadosClientes = clients.reduce((s: number, c: any) => {
      const revenue = Number(c.revenue) || 0
      return s + revenue
    }, 0)
    
    // Usar el mayor entre billings y revenue de clientes
    const ingresosEsperadosTotal = Math.max(ingresosEsperados, ingresosEsperadosClientes)
    
    console.log(`[Metrics] Ingresos esperados: billings=${ingresosEsperados}, clients=${ingresosEsperadosClientes}, total=${ingresosEsperadosTotal}`)
    
    // Calcular ingresos reales (pagos recibidos en el mes)
    const ingresosReales = (payments || []).reduce((sum: number, p: any) => sum + (Number(p.paid_amount) || 0), 0)
    
    // Calcular ingresos variables del mes
    const ingresosVariables = (incomes || [])
      .filter((inc: any) => (inc.date || '').startsWith(monthPrefix))
      .reduce((sum: number, inc: any) => sum + (Number(inc.amount) || 0), 0)
    
    // Ingresos totales = pagos recibidos + ingresos variables
    const ingresos = ingresosReales + ingresosVariables
    
    // Calcular gastos del mes
    const gastosFijos = (expenses || [])
      .filter((e: any) => e.expense_type === 'fixed' && !e.is_installment && (e.date || '').startsWith(monthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    
    const gastosVariables = (expenses || [])
      .filter((e: any) => e.expense_type === 'variable' && !e.is_installment && (e.date || '').startsWith(monthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.amount) || 0), 0)
    
    // Gastos a meses sin intereses (solo el pago mensual del mes actual)
    const gastosMSI = (expenses || [])
      .filter((e: any) => e.is_installment && (e.date || '').startsWith(monthPrefix))
      .reduce((sum: number, e: any) => sum + (Number(e.monthly_payment) || 0), 0)
    
    // También incluir pagos mensuales de MSI de meses anteriores que caen en este mes
    const gastosMSIMesActual = (expenses || [])
      .filter((e: any) => {
        if (!e.is_installment || !e.date || !e.installment_months) return false
        const expenseDate = new Date(e.date)
        const expenseYear = expenseDate.getFullYear()
        const expenseMonth = expenseDate.getMonth()
        const [year, month] = m.split('-').map(Number)
        
        // Verificar si este mes corresponde a algún pago de la serie de MSI
        for (let i = 0; i < (e.installment_months || 0); i++) {
          const paymentMonth = new Date(expenseYear, expenseMonth + i, 1)
          if (paymentMonth.getFullYear() === year && paymentMonth.getMonth() + 1 === month) {
            return true
          }
        }
        return false
      })
      .reduce((sum: number, e: any) => sum + (Number(e.monthly_payment) || 0), 0)
    
    const totalGastos = gastosFijos + gastosVariables + gastosMSIMesActual
    
    // Costo de nómina (sueldos mensuales)
    const costoNomina = (salaries || []).reduce((sum: number, s: any) => {
      const salary = Number(s.monthly_salary) || 0
      return sum + salary
    }, 0)
    
    // Costo laboral (horas trabajadas)
    const costoLabor = clients.reduce((s,c)=> s+(c.costoLabor||0),0)
    
    // Costo total = nómina + gastos + costo laboral
    const costoTotal = costoNomina + totalGastos + costoLabor
    
    // Utilidad = ingresos reales - costos totales
    const utilidad = ingresos - costoTotal
    const utilidadPct = ingresos > 0 ? +(utilidad / ingresos).toFixed(2) : null
    
    // Margen (usando ingresos esperados para comparación)
    const margenAbs = ingresosEsperadosTotal - costoLabor
    const margenPct = ingresosEsperadosTotal>0 ? +(margenAbs/ingresosEsperadosTotal).toFixed(2) : null
    const utilizacionPromedioEquipo = employees.length>0 ? (employees.reduce((s,e)=> s+e.utilizacion,0)/employees.length) : 0

    // Métricas por tipo específico (reel_corto, reel_largo, diseno_simple, etc.)
    const tipoSpecificAgg = new Map<string, { horas: number, count: number }>()
    for (const w of monthWorklogs) {
      const t = w._typeSpecific || w._typeNorm // Usar tipo específico primero
      const a = tipoSpecificAgg.get(t) || { horas: 0, count: 0 }
      a.horas += Number(w.hours || 0)
      a.count += 1
      tipoSpecificAgg.set(t, a)
    }
    
    // También agregar por tipo general para compatibilidad
    const tipoGeneralAgg = new Map<string, { horas: number, count: number }>()
    for (const w of monthWorklogs) {
      const t = w._typeNorm
      const a = tipoGeneralAgg.get(t) || { horas: 0, count: 0 }
      a.horas += Number(w.hours || 0)
      a.count += 1
      tipoGeneralAgg.set(t, a)
    }
    
    const totalCapHorasEquipo = employees.length * HORAS_CAPACIDAD_MES
    const totalCostoLabor = employees.reduce((s, e) => s + (e.horasMes * e.costoHoraReal), 0)
    
    // Tipos específicos (prioridad)
    const typesSpecific = Array.from(tipoSpecificAgg.entries())
      .filter(([type]) => {
        // Solo mostrar tipos específicos relevantes (reel_corto, diseno_simple, etc.)
        const relevantTypes = ['reel_corto', 'reel_largo', 'reel', 'video', 'diseno_simple', 'diseno_complejo', 'diseno', 'foto_simple', 'foto_elaborada', 'foto']
        return relevantTypes.includes(type)
      })
      .map(([type, a]) => {
        const avgHours = a.count > 0 ? a.horas / a.count : 0
        // Usar promedio global del tipo específico si está disponible
        const globalAvgHours = specificTypeAvgHours.get(type) || avgHours
        const capacityEstimated = globalAvgHours > 0 ? Math.floor(totalCapHorasEquipo / globalAvgHours) : 0
        // Calcular costo unitario promedio basado en el costo/hora promedio de los empleados
        const avgCostPerHour = employees.length > 0 ? employees.reduce((s, e) => s + e.costoHoraReal, 0) / employees.length : 0
        const unitCostAvgMXN = globalAvgHours > 0 ? Math.round(globalAvgHours * avgCostPerHour) : 0
        return { type, totalHours: a.horas, avgHours: globalAvgHours, capacityEstimated, unitCostAvgMXN, count: a.count }
      })
      .sort((a, b) => {
        // Ordenar por categoría: video primero, luego diseño, luego foto
        const order: Record<string, number> = {
          'reel_corto': 1, 'reel_largo': 2, 'reel': 3, 'video': 4,
          'diseno_simple': 5, 'diseno_complejo': 6, 'diseno': 7,
          'foto_simple': 8, 'foto_elaborada': 9, 'foto': 10
        }
        return (order[a.type] || 99) - (order[b.type] || 99)
      })
    
    // Tipos generales (para compatibilidad)
    const typesGeneral = Array.from(tipoGeneralAgg.entries())
      .filter(([type]) => ['video', 'foto', 'diseno'].includes(type))
      .map(([type, a]) => {
        const avgHours = a.count > 0 ? a.horas / a.count : 0
        const globalAvgHours = generalTypeAvg.get(type) || avgHours
        const capacityEstimated = globalAvgHours > 0 ? Math.floor(totalCapHorasEquipo / globalAvgHours) : 0
        const avgCostPerHour = employees.length > 0 ? employees.reduce((s, e) => s + e.costoHoraReal, 0) / employees.length : 0
        const unitCostAvgMXN = globalAvgHours > 0 ? Math.round(globalAvgHours * avgCostPerHour) : 0
        return { type, totalHours: a.horas, avgHours: globalAvgHours, capacityEstimated, unitCostAvgMXN, count: a.count }
      })
    
    // Combinar tipos específicos y generales (priorizar específicos)
    const types = [...typesSpecific, ...typesGeneral.filter(t => !typesSpecific.some(ts => ts.type === t.type))]

    // Costo por tipo específico y empleado (usar tipos específicos en lugar de generales)
    const stageEmpAgg = new Map<string, { hours: number, cost: number }>() // key: specificType|employeeId
    for (const w of monthWorklogs) {
      const uid = w.user_id
      const stage = w._typeSpecific || w._typeNorm // Usar tipo específico primero
      const h = Number(w.hours || 0)
      const ch = costHourByEmp.get(uid) || 0
      const key = stage + '|' + uid
      const a = stageEmpAgg.get(key) || { hours: 0, cost: 0 }
      a.hours += h
      a.cost += h * ch
      stageEmpAgg.set(key, a)
    }
    const stagesByEmployee = Array.from(stageEmpAgg.entries()).map(([key, a]) => {
      const [stage, employeeId] = key.split('|')
      const emp = employees.find(e => e.employeeId === employeeId)
      return { employeeId, name: emp?.name || employeeId, stage, hours: a.hours, costMXN: Math.round(a.cost) }
    })
    // Ordenar por tipo específico (reel_corto, reel_largo, etc.)
    stagesByEmployee.sort((a, b) => {
      const order: Record<string, number> = {
        'reel_corto': 1, 'reel_largo': 2, 'reel': 3, 'video': 4,
        'diseno_simple': 5, 'diseno_complejo': 6, 'diseno': 7,
        'foto_simple': 8, 'foto_elaborada': 9, 'foto': 10
      }
      return (order[a.stage] || 99) - (order[b.stage] || 99)
    })

    // Objetivos por cliente (usando monthly_* específicos del proyecto)
    // Usar promedios específicos (specificTypeAvgHours) en lugar de generales
    const getAvgSpecific = (specificType: string): number => {
      return specificTypeAvgHours.get(specificType) || 0
    }
    const getAvgGeneral = (generalType: string): number => {
      return generalTypeAvg.get(generalType) || 0
    }
    
    const clientsWithObjectives = clients.map(c => {
      // Buscar info del proyecto si clientId es un projectId
      const proj = projects.find((p:any)=> p.id === c.clientId)
      
      // Objetivos específicos (prioridad)
      const specificObjectives = {
        reel_corto: Number(proj?.monthly_reel_corto || 0),
        reel_largo: Number(proj?.monthly_reel_largo || 0),
        reel: Number(proj?.monthly_reel || 0),
        video: Number(proj?.monthly_video || 0),
        diseno_simple: Number(proj?.monthly_diseno_simple || 0),
        diseno_complejo: Number(proj?.monthly_diseno_complejo || 0),
        diseno: Number(proj?.monthly_diseno || 0),
        foto_simple: Number(proj?.monthly_foto_simple || 0),
        foto_elaborada: Number(proj?.monthly_foto_elaborada || 0),
        foto: Number(proj?.monthly_foto || 0),
        recording_session: Number(proj?.monthly_recording_sessions || 0),
      }
      
      // Objetivos generales (para compatibilidad)
      const generalObjectives = {
        videos: Number(proj?.monthly_videos || 0),
        photos: Number(proj?.monthly_photos || 0),
        designs: Number(proj?.monthly_designs || 0),
      }
      
      // Calcular requiredHours usando tipos específicos primero
      // NOTA: c.requiredHours ya fue calculado usando tipos específicos en la sección anterior (líneas 314-357)
      // Aquí solo recalculamos si es necesario para perType, pero usamos el valor de c.requiredHours
      let requiredHours = c.requiredHours || 0
      
      // Si no hay requiredHours calculado, calcularlo usando tipos específicos
      if (requiredHours === 0) {
        const hasSpecificTypes = Object.values(specificObjectives).some(v => v > 0)
        
        if (hasSpecificTypes) {
          // Usar tipos específicos
          requiredHours = 
            specificObjectives.reel_corto * getAvgSpecific('reel_corto') +
            specificObjectives.reel_largo * getAvgSpecific('reel_largo') +
            specificObjectives.reel * getAvgSpecific('reel') +
            specificObjectives.video * getAvgSpecific('video') +
            specificObjectives.diseno_simple * getAvgSpecific('diseno_simple') +
            specificObjectives.diseno_complejo * getAvgSpecific('diseno_complejo') +
            specificObjectives.diseno * getAvgSpecific('diseno') +
            specificObjectives.foto_simple * getAvgSpecific('foto_simple') +
            specificObjectives.foto_elaborada * getAvgSpecific('foto_elaborada') +
            specificObjectives.foto * getAvgSpecific('foto') +
            (specificObjectives.recording_session * 3) // Sesiones de grabación: 3 horas por sesión
        } else {
          // Usar tipos generales (compatibilidad)
          requiredHours = 
            generalObjectives.videos * getAvgGeneral('video') +
            generalObjectives.photos * getAvgGeneral('foto') +
            generalObjectives.designs * getAvgGeneral('diseno')
        }
      }

      // Costo por tipo específico dentro del cliente: prorratear horas/costo por tipo con worklogs del proyecto
      const pid = c.clientId
      const projLogs = monthWorklogs.filter((w:any)=> w.project_id === pid)
      const typeAggClient = new Map<string, { horas: number, cost: number }>()
      for (const w of projLogs) {
        const h = Number(w.hours||0)
        const uid = w.user_id
        const ch = costHourByEmp.get(uid) || 0
        const t = w._typeSpecific || w._typeNorm // Usar tipo específico primero
        const a = typeAggClient.get(t) || { horas: 0, cost: 0 }
        a.horas += h
        a.cost += h * ch
        typeAggClient.set(t, a)
      }
      const perType = Array.from(typeAggClient.entries())
        .map(([type, a]) => ({ type, horas: a.horas, costoMXN: Math.round(a.cost) }))
        .sort((a, b) => {
          const order: Record<string, number> = {
            'reel_corto': 1, 'reel_largo': 2, 'reel': 3, 'video': 4,
            'diseno_simple': 5, 'diseno_complejo': 6, 'diseno': 7,
            'foto_simple': 8, 'foto_elaborada': 9, 'foto': 10
          }
          return (order[a.type] || 99) - (order[b.type] || 99)
        })
      
      return { 
        ...c, 
        objectives: { ...specificObjectives, ...generalObjectives }, // Incluir ambos para compatibilidad
        requiredHours, 
        perType 
      }
    })

    // Análisis de Capacidad del Equipo vs Demanda de Clientes
    const totalCapacidadEquipo = employees.length * HORAS_CAPACIDAD_MES // Capacidad total del equipo en horas/mes
    const totalHorasRequeridas = clients.reduce((sum, c) => sum + (c.requiredHours || 0), 0) // Horas totales requeridas por todos los clientes
    
    // Calcular horas requeridas por cliente (promedio)
    const promedioHorasPorCliente = clients.length > 0 ? totalHorasRequeridas / clients.length : 0
    
    // Calcular cuántos clientes puede atender el equipo con su capacidad actual
    const maxClientesCapacidad = promedioHorasPorCliente > 0 ? Math.floor(totalCapacidadEquipo / promedioHorasPorCliente) : 0
    
    // Calcular utilización actual de capacidad
    const utilizacionCapacidad = totalCapacidadEquipo > 0 ? (totalHorasRequeridas / totalCapacidadEquipo) : 0
    
    // Horas disponibles para nuevos clientes
    const horasDisponibles = Math.max(0, totalCapacidadEquipo - totalHorasRequeridas)
    
    // Clientes adicionales que se pueden cerrar sin contratar
    const clientesAdicionalesDisponibles = promedioHorasPorCliente > 0 ? Math.floor(horasDisponibles / promedioHorasPorCliente) : 0
    
    // Desglose de horas por tipo de trabajo para todos los clientes
    const horasPorTipoTrabajo = new Map<string, { totalHoras: number, clientes: number }>()
    for (const c of clients) {
      if (Array.isArray(c.horasByType)) {
        for (const ht of c.horasByType) {
          const tipo = ht.type || 'other'
          const horas = ht.totalHoras || 0
          const actual = horasPorTipoTrabajo.get(tipo) || { totalHoras: 0, clientes: 0 }
          actual.totalHoras += horas
          actual.clientes += 1
          horasPorTipoTrabajo.set(tipo, actual)
        }
      }
    }
    
    // Agrupar por categoría general (video, diseño, foto)
    const horasPorCategoria = {
      video: Array.from(horasPorTipoTrabajo.entries())
        .filter(([tipo]) => ['reel_corto', 'reel_largo', 'reel', 'video'].includes(tipo))
        .reduce((sum, [, data]) => sum + data.totalHoras, 0),
      diseño: Array.from(horasPorTipoTrabajo.entries())
        .filter(([tipo]) => ['diseno_simple', 'diseno_complejo', 'diseno'].includes(tipo))
        .reduce((sum, [, data]) => sum + data.totalHoras, 0),
      foto: Array.from(horasPorTipoTrabajo.entries())
        .filter(([tipo]) => ['foto_simple', 'foto_elaborada', 'foto'].includes(tipo))
        .reduce((sum, [, data]) => sum + data.totalHoras, 0),
    }
    
    const capacityAnalysis = {
      totalClientes: clients.length,
      totalCapacidadEquipo, // Horas totales disponibles del equipo
      totalHorasRequeridas, // Horas totales requeridas por todos los clientes
      promedioHorasPorCliente,
      maxClientesCapacidad, // Cuántos clientes puede atender el equipo
      utilizacionCapacidad, // Porcentaje de capacidad utilizada (0-1)
      horasDisponibles, // Horas disponibles para nuevos clientes
      clientesAdicionalesDisponibles, // Clientes adicionales que se pueden cerrar
      horasPorCategoria, // Horas por video, diseño, foto
      horasPorTipo: Array.from(horasPorTipoTrabajo.entries()).map(([tipo, data]) => ({
        tipo,
        totalHoras: data.totalHoras,
        clientes: data.clientes,
        promedioPorCliente: data.clientes > 0 ? data.totalHoras / data.clientes : 0
      }))
    }

    const metrics = { 
      month: m, 
      employees, 
      clients: clientsWithObjectives, 
      types, 
      stagesByEmployee, 
      totals: { 
        ingresos, 
        ingresosEsperados: ingresosEsperadosTotal,
        ingresosReales,
        ingresosVariables,
        costoLabor, 
        costoNomina,
        totalGastos,
        gastosFijos,
        gastosVariables,
        gastosMSI: gastosMSIMesActual,
        costoTotal,
        utilidad,
        utilidadPct,
        margenAbs, 
        margenPct, 
        utilizacionPromedioEquipo 
      },
      capacityAnalysis
    }
    const res = NextResponse.json(metrics)
    res.headers.set('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=60')
    return res
  } catch (e: any) {
    // Fallback: return empty metrics to avoid UI crash while infra is configured
    const now = new Date()
    const defaultMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`
    const empty = {
      month: defaultMonth,
      employees: [],
      clients: [],
      totals: {
        ingresos: 0,
        ingresosEsperados: 0,
        ingresosReales: 0,
        ingresosVariables: 0,
        costoLabor: 0,
        costoNomina: 0,
        totalGastos: 0,
        gastosFijos: 0,
        gastosVariables: 0,
        gastosMSI: 0,
        costoTotal: 0,
        utilidad: 0,
        utilidadPct: null,
        margenAbs: 0,
        margenPct: null,
        utilizacionPromedioEquipo: 0,
      },
      capacityAnalysis: {
        totalClientes: 0,
        totalCapacidadEquipo: 0,
        totalHorasRequeridas: 0,
        promedioHorasPorCliente: 0,
        maxClientesCapacidad: 0,
        utilizacionCapacidad: 0,
        horasDisponibles: 0,
        clientesAdicionalesDisponibles: 0,
        horasPorCategoria: { video: 0, diseño: 0, foto: 0 },
        horasPorTipo: []
      },
      error: 'Failed to compute metrics',
      details: e?.message || 'Unknown error',
    } as any
    const res = NextResponse.json(empty, { status: 200 })
    res.headers.set('Cache-Control', 'public, max-age=30, s-maxage=30, stale-while-revalidate=60')
    return res
  }
}


