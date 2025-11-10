import { getSheetsClient, getSpreadsheetId, getSheetName } from '../lib/sheets/client'

async function setupSheets() {
  try {
    console.log('🚀 Setting up Google Sheets database...')
    
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    
    console.log(`📊 Working with spreadsheet: ${spreadsheetId}`)
    
    // 1. Create and setup workspaces sheet
    await setupWorkspacesSheet(sheets, spreadsheetId)
    
    // 2. Create and setup projects sheet
    await setupProjectsSheet(sheets, spreadsheetId)
    
    // 3. Create and setup tasks sheet
    await setupTasksSheet(sheets, spreadsheetId)
    
    // 4. Create and setup users sheet
    await setupUsersSheet(sheets, spreadsheetId)
    
    // 5. Create and setup comments sheet
    await setupCommentsSheet(sheets, spreadsheetId)
    
    // 6. Create and setup activity log sheet
    await setupActivityLogSheet(sheets, spreadsheetId)
    
    console.log('✅ Google Sheets database setup completed!')
    
  } catch (error) {
    console.error('❌ Error setting up sheets:', error)
    process.exit(1)
  }
}

async function setupWorkspacesSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up workspaces sheet...')
  
  const sheetName = getSheetName('workspaces')
  
  // Create sheet if it doesn't exist
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'name', 'description', 'owner_id', 'created_at', 'updated_at']]
    }
  })
  
  // Add sample data
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:F2`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [[
        'demo',
        'Agencia Marketing',
        'Workspace para la agencia de marketing digital',
        'user-1',
        new Date().toISOString(),
        new Date().toISOString()
      ]]
    }
  })
  
  console.log(`✅ Workspaces sheet ready`)
}

async function setupProjectsSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up projects sheet...')
  
  const sheetName = getSheetName('projects')
  
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 10
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:I1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'workspace_id', 'name', 'description', 'status', 'priority', 'deadline', 'created_at', 'updated_at']]
    }
  })
  
  // Add sample data
  const sampleProjects = [
    ['proj-1', 'demo', 'Campaña Redes Sociales', 'Campaña integral para redes sociales', 'active', 'high', '2024-02-15', new Date().toISOString(), new Date().toISOString()],
    ['proj-2', 'demo', 'Rediseño Web', 'Rediseño completo del sitio web corporativo', 'active', 'medium', '2024-03-01', new Date().toISOString(), new Date().toISOString()],
    ['proj-3', 'demo', 'Análisis Competencia', 'Análisis detallado de la competencia', 'active', 'low', '2024-01-30', new Date().toISOString(), new Date().toISOString()]
  ]
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:I4`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleProjects
    }
  })
  
  console.log(`✅ Projects sheet ready`)
}

async function setupTasksSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up tasks sheet...')
  
  const sheetName = getSheetName('tasks')
  
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 12
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:J1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'project_id', 'title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'created_at', 'updated_at']]
    }
  })
  
  // Add sample data
  const sampleTasks = [
    ['task-1', 'proj-1', 'Crear contenido para Instagram', 'Desarrollar contenido visual para Instagram', 'inprogress', 'high', 'user-1', '2024-01-15', new Date().toISOString(), new Date().toISOString()],
    ['task-2', 'proj-1', 'Planificar calendario editorial', 'Crear calendario de publicaciones', 'todo', 'medium', 'user-2', '2024-01-20', new Date().toISOString(), new Date().toISOString()],
    ['task-3', 'proj-2', 'Diseñar mockups para landing page', 'Crear mockups de la nueva landing page', 'todo', 'high', 'user-3', '2024-01-25', new Date().toISOString(), new Date().toISOString()],
    ['task-4', 'proj-3', 'Analizar métricas de competidores', 'Recopilar y analizar datos de competencia', 'done', 'low', 'user-4', '2024-01-10', new Date().toISOString(), new Date().toISOString()]
  ]
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:J5`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleTasks
    }
  })
  
  console.log(`✅ Tasks sheet ready`)
}

async function setupUsersSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up users sheet...')
  
  const sheetName = getSheetName('users')
  
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 8
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'email', 'name', 'role', 'avatar', 'created_at']]
    }
  })
  
  // Add sample data
  const sampleUsers = [
    ['user-1', 'maria@agencia.com', 'María García', 'owner', '👩‍💼', new Date().toISOString()],
    ['user-2', 'carlos@agencia.com', 'Carlos López', 'admin', '👨‍💻', new Date().toISOString()],
    ['user-3', 'ana@agencia.com', 'Ana Martín', 'member', '👩‍🎨', new Date().toISOString()],
    ['user-4', 'david@agencia.com', 'David Rodríguez', 'member', '👨‍🔬', new Date().toISOString()],
    ['user-5', 'laura@agencia.com', 'Laura Sánchez', 'member', '👩‍💻', new Date().toISOString()],
    ['user-6', 'juan@agencia.com', 'Juan Pérez', 'member', '👨‍🎨', new Date().toISOString()],
    ['user-7', 'sofia@agencia.com', 'Sofía González', 'member', '👩‍🔬', new Date().toISOString()]
  ]
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:F8`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleUsers
    }
  })
  
  console.log(`✅ Users sheet ready`)
}

async function setupCommentsSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up comments sheet...')
  
  const sheetName = getSheetName('task_comments')
  
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 8
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:E1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'task_id', 'user_id', 'content', 'created_at']]
    }
  })
  
  console.log(`✅ Comments sheet ready`)
}

async function setupActivityLogSheet(sheets: any, spreadsheetId: string) {
  console.log('📋 Setting up activity log sheet...')
  
  const sheetName = getSheetName('activity_log')
  
  try {
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [{
          addSheet: {
            properties: {
              title: sheetName,
              gridProperties: {
                rowCount: 1000,
                columnCount: 8
              }
            }
          }
        }]
      }
    })
    console.log(`✅ Created sheet: ${sheetName}`)
  } catch (error) {
    console.log(`📋 Sheet ${sheetName} already exists`)
  }
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'entity_type', 'entity_id', 'action', 'user_id', 'created_at']]
    }
  })
  
  console.log(`✅ Activity log sheet ready`)
}

// Run the setup
setupSheets()
