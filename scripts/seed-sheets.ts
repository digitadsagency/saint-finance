import { getSheetsClient, getSpreadsheetId } from '../lib/sheets/client'
import { generateId, now } from '../lib/ids'

async function createSpreadsheet() {
  const sheets = await getSheetsClient()
  const spreadsheetId = getSpreadsheetId()

  console.log('🌱 Iniciando seed de Google Sheets...')

  try {
    // Create all sheets with headers
    const sheetConfigs = [
      {
        name: 'workspaces',
        headers: ['id', 'name', 'created_by', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'workspace_members',
        headers: ['id', 'workspace_id', 'user_id', 'role', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'projects',
        headers: ['id', 'workspace_id', 'name', 'description_md', 'status', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'project_members',
        headers: ['id', 'project_id', 'user_id', 'role', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'tasks',
        headers: [
          'id', 'project_id', 'title', 'description_md', 'priority', 'status',
          'assignee_id', 'reporter_id', 'due_date', 'estimate_hours', 'completed_at',
          'created_at', 'updated_at', 'version', 'labels_csv'
        ]
      },
      {
        name: 'task_comments',
        headers: ['id', 'task_id', 'user_id', 'body_md', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'task_labels',
        headers: ['id', 'project_id', 'name', 'color', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'attachments',
        headers: ['id', 'task_id', 'file_url', 'mime', 'size', 'created_at', 'updated_at', 'version']
      },
      {
        name: 'activity_log',
        headers: ['id', 'task_id', 'actor_id', 'action', 'from_value', 'to_value', 'created_at']
      }
    ]

    // Create sheets if they don't exist
    for (const config of sheetConfigs) {
      try {
        await sheets.spreadsheets.values.get({
          spreadsheetId,
          range: `${config.name}!1:1`
        })
        console.log(`✅ Sheet '${config.name}' already exists`)
      } catch (error) {
        // Sheet doesn't exist, create it
        await sheets.spreadsheets.batchUpdate({
          spreadsheetId,
          requestBody: {
            requests: [{
              addSheet: {
                properties: {
                  title: config.name
                }
              }
            }]
          }
        })

        // Add headers
        await sheets.spreadsheets.values.update({
          spreadsheetId,
          range: `${config.name}!1:1`,
          valueInputOption: 'RAW',
          requestBody: {
            values: [config.headers]
          }
        })

        console.log(`✅ Created sheet '${config.name}' with headers`)
      }
    }

    // Seed demo data
    await seedDemoData(sheets, spreadsheetId)

    console.log('🎉 Seed completado exitosamente!')
  } catch (error) {
    console.error('❌ Error durante el seed:', error)
    throw error
  }
}

async function seedDemoData(sheets: any, spreadsheetId: string) {
  const timestamp = now()
  const userId = generateId()

  // 1. Create workspace
  const workspaceId = generateId()
  const workspaceData = [
    [workspaceId, 'Agencia Marketing', userId, timestamp, timestamp, 1]
  ]

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'workspaces!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: workspaceData
    }
  })

  // 2. Create workspace members
  const members = [
    { id: generateId(), role: 'owner' },
    { id: generateId(), role: 'admin' },
    { id: generateId(), role: 'member' },
    { id: generateId(), role: 'member' },
    { id: generateId(), role: 'member' },
    { id: generateId(), role: 'member' },
    { id: generateId(), role: 'member' }
  ]

  const workspaceMembersData = members.map(member => [
    member.id, workspaceId, generateId(), member.role, timestamp, timestamp, 1
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'workspace_members!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: workspaceMembersData
    }
  })

  // 3. Create projects
  const projects = [
    {
      id: generateId(),
      name: 'Campaña Redes Sociales',
      description: 'Desarrollo de contenido para redes sociales del cliente',
      status: 'active'
    },
    {
      id: generateId(),
      name: 'Rediseño Web',
      description: 'Rediseño completo del sitio web corporativo',
      status: 'active'
    },
    {
      id: generateId(),
      name: 'Análisis Competencia',
      description: 'Investigación y análisis de la competencia',
      status: 'active'
    }
  ]

  const projectsData = projects.map(project => [
    project.id, workspaceId, project.name, project.description, project.status, timestamp, timestamp, 1
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'projects!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: projectsData
    }
  })

  // 4. Create project members
  const projectMembersData = projects.flatMap(project => 
    members.slice(0, 3).map(member => [
      generateId(), project.id, generateId(), 'member', timestamp, timestamp, 1
    ])
  )

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'project_members!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: projectMembersData
    }
  })

  // 5. Create tasks
  const tasks = [
    // Campaña Redes Sociales
    {
      projectId: projects[0].id,
      title: 'Crear contenido para Instagram',
      description: 'Desarrollar posts creativos para la campaña de verano',
      priority: 'high',
      status: 'inprogress',
      assignee: generateId(),
      dueDate: '2024-01-15',
      estimateHours: 4,
      labels: 'redes sociales, contenido'
    },
    {
      projectId: projects[0].id,
      title: 'Planificar calendario editorial',
      description: 'Crear calendario de publicaciones para el próximo mes',
      priority: 'med',
      status: 'todo',
      assignee: generateId(),
      dueDate: '2024-01-20',
      estimateHours: 6,
      labels: 'planificación, calendario'
    },
    {
      projectId: projects[0].id,
      title: 'Analizar métricas de engagement',
      description: 'Revisar y analizar las métricas de las publicaciones anteriores',
      priority: 'low',
      status: 'done',
      assignee: generateId(),
      dueDate: '2024-01-10',
      estimateHours: 3,
      labels: 'analytics, métricas'
    },

    // Rediseño Web
    {
      projectId: projects[1].id,
      title: 'Diseñar mockups para landing page',
      description: 'Crear wireframes y mockups para la nueva landing page',
      priority: 'urgent',
      status: 'todo',
      assignee: generateId(),
      dueDate: '2024-01-12',
      estimateHours: 8,
      labels: 'diseño, web'
    },
    {
      projectId: projects[1].id,
      title: 'Desarrollar componentes React',
      description: 'Implementar los componentes de la nueva interfaz',
      priority: 'high',
      status: 'inprogress',
      assignee: generateId(),
      dueDate: '2024-01-18',
      estimateHours: 12,
      labels: 'desarrollo, react'
    },
    {
      projectId: projects[1].id,
      title: 'Optimizar rendimiento',
      description: 'Mejorar la velocidad de carga del sitio web',
      priority: 'med',
      status: 'review',
      assignee: generateId(),
      dueDate: '2024-01-25',
      estimateHours: 6,
      labels: 'optimización, rendimiento'
    },

    // Análisis Competencia
    {
      projectId: projects[2].id,
      title: 'Identificar competidores principales',
      description: 'Listar y categorizar los principales competidores',
      priority: 'high',
      status: 'done',
      assignee: generateId(),
      dueDate: '2024-01-08',
      estimateHours: 4,
      labels: 'investigación, competencia'
    },
    {
      projectId: projects[2].id,
      title: 'Analizar estrategias de marketing',
      description: 'Estudiar las estrategias de marketing de la competencia',
      priority: 'med',
      status: 'inprogress',
      assignee: generateId(),
      dueDate: '2024-01-22',
      estimateHours: 8,
      labels: 'marketing, estrategia'
    },
    {
      projectId: projects[2].id,
      title: 'Crear reporte ejecutivo',
      description: 'Compilar los hallazgos en un reporte ejecutivo',
      priority: 'high',
      status: 'todo',
      assignee: generateId(),
      dueDate: '2024-01-30',
      estimateHours: 6,
      labels: 'reporte, ejecutivo'
    }
  ]

  const tasksData = tasks.map(task => [
    generateId(),
    task.projectId,
    task.title,
    task.description,
    task.priority,
    task.status,
    task.assignee,
    userId,
    task.dueDate,
    task.estimateHours,
    task.status === 'done' ? timestamp : '',
    timestamp,
    timestamp,
    1,
    task.labels
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'tasks!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: tasksData
    }
  })

  // 6. Create task labels
  const labels = [
    { projectId: projects[0].id, name: 'Redes Sociales', color: '#3B82F6' },
    { projectId: projects[0].id, name: 'Contenido', color: '#10B981' },
    { projectId: projects[1].id, name: 'Diseño', color: '#F59E0B' },
    { projectId: projects[1].id, name: 'Desarrollo', color: '#EF4444' },
    { projectId: projects[2].id, name: 'Investigación', color: '#8B5CF6' },
    { projectId: projects[2].id, name: 'Análisis', color: '#06B6D4' }
  ]

  const labelsData = labels.map(label => [
    generateId(),
    label.projectId,
    label.name,
    label.color,
    timestamp,
    timestamp,
    1
  ])

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: 'task_labels!A:Z',
    valueInputOption: 'RAW',
    requestBody: {
      values: labelsData
    }
  })

  console.log('✅ Datos de demostración creados exitosamente!')
}

// Run the seed
createSpreadsheet().catch(console.error)
