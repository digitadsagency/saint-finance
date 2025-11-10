const { google } = require('googleapis');
require('dotenv').config({ path: '.env.local' });

async function populateSheets() {
  try {
    console.log('🚀 Populating Google Sheets database...');
    
    // Initialize Google Sheets client
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive'
      ],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SHEETS_SPREADSHEET_ID;
    
    if (!spreadsheetId) {
      throw new Error('SHEETS_SPREADSHEET_ID not found in environment variables');
    }
    
    console.log(`📊 Working with spreadsheet: ${spreadsheetId}`);
    
    // 1. Setup workspaces sheet
    await setupWorkspaces(sheets, spreadsheetId);
    
    // 2. Setup projects sheet
    await setupProjects(sheets, spreadsheetId);
    
    // 3. Setup tasks sheet
    await setupTasks(sheets, spreadsheetId);
    
    // 4. Setup users sheet
    await setupUsers(sheets, spreadsheetId);
    
    // 5. Setup comments sheet (commented out for now)
    // await setupComments(sheets, spreadsheetId);
    
    // 6. Setup activity log sheet (commented out for now)
    // await setupActivityLog(sheets, spreadsheetId);
    
    console.log('✅ Google Sheets database populated successfully!');
    
  } catch (error) {
    console.error('❌ Error populating sheets:', error);
    process.exit(1);
  }
}

async function setupWorkspaces(sheets, spreadsheetId) {
  console.log('📋 Setting up workspaces sheet...');
  
  const sheetName = 'workspaces';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'name', 'description', 'owner_id', 'created_at', 'updated_at']]
    }
  });
  
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
  });
  
  console.log('✅ Workspaces sheet populated');
}

async function setupProjects(sheets, spreadsheetId) {
  console.log('📋 Setting up projects sheet...');
  
  const sheetName = 'projects';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:I1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'workspace_id', 'name', 'description', 'status', 'priority', 'deadline', 'created_at', 'updated_at']]
    }
  });
  
  // Add sample data
  const sampleProjects = [
    ['proj-1', 'demo', 'Campaña Redes Sociales', 'Campaña integral para redes sociales', 'active', 'high', '2024-02-15', new Date().toISOString(), new Date().toISOString()],
    ['proj-2', 'demo', 'Rediseño Web', 'Rediseño completo del sitio web corporativo', 'active', 'medium', '2024-03-01', new Date().toISOString(), new Date().toISOString()],
    ['proj-3', 'demo', 'Análisis Competencia', 'Análisis detallado de la competencia', 'active', 'low', '2024-01-30', new Date().toISOString(), new Date().toISOString()]
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:I4`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleProjects
    }
  });
  
  console.log('✅ Projects sheet populated');
}

async function setupTasks(sheets, spreadsheetId) {
  console.log('📋 Setting up tasks sheet...');
  
  const sheetName = 'tasks';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:J1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'project_id', 'title', 'description', 'status', 'priority', 'assignee_id', 'due_date', 'created_at', 'updated_at']]
    }
  });
  
  // Add sample data
  const sampleTasks = [
    ['task-1', 'proj-1', 'Crear contenido para Instagram', 'Desarrollar contenido visual para Instagram', 'inprogress', 'high', 'user-1', '2024-01-15', new Date().toISOString(), new Date().toISOString()],
    ['task-2', 'proj-1', 'Planificar calendario editorial', 'Crear calendario de publicaciones', 'todo', 'medium', 'user-2', '2024-01-20', new Date().toISOString(), new Date().toISOString()],
    ['task-3', 'proj-1', 'Diseñar mockups para landing page', 'Crear mockups de la nueva landing page', 'todo', 'high', 'user-3', '2024-01-25', new Date().toISOString(), new Date().toISOString()],
    ['task-4', 'proj-2', 'Desarrollar componentes React', 'Crear componentes reutilizables', 'inprogress', 'medium', 'user-4', '2024-01-30', new Date().toISOString(), new Date().toISOString()],
    ['task-5', 'proj-2', 'Configurar Google Analytics', 'Implementar tracking de analytics', 'todo', 'low', 'user-5', '2024-02-05', new Date().toISOString(), new Date().toISOString()],
    ['task-6', 'proj-3', 'Analizar métricas de competidores', 'Recopilar y analizar datos de competencia', 'done', 'low', 'user-6', '2024-01-10', new Date().toISOString(), new Date().toISOString()],
    ['task-7', 'proj-3', 'Crear reporte de insights', 'Documentar hallazgos del análisis', 'done', 'medium', 'user-7', '2024-01-12', new Date().toISOString(), new Date().toISOString()]
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:J8`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleTasks
    }
  });
  
  console.log('✅ Tasks sheet populated');
}

async function setupUsers(sheets, spreadsheetId) {
  console.log('📋 Setting up users sheet...');
  
  const sheetName = 'users';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:G1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'email', 'name', 'role', 'avatar', 'password', 'created_at']]
    }
  });
  
  // Add sample data
  const sampleUsers = [
    ['user-1', 'pablo@agencia.com', 'Pablo', 'owner', '👨‍💼', 'password123', new Date().toISOString()],
    ['user-2', 'dani@agencia.com', 'Dani', 'admin', '👨‍💻', 'password123', new Date().toISOString()],
    ['user-3', 'sandra@agencia.com', 'Sandra', 'member', '👩‍🎨', 'password123', new Date().toISOString()],
    ['user-4', 'miguel@agencia.com', 'Miguel', 'member', '👨‍🔬', 'password123', new Date().toISOString()],
    ['user-5', 'raul@agencia.com', 'Raul', 'member', '👨‍💻', 'password123', new Date().toISOString()],
    ['user-6', 'alvaro@agencia.com', 'Alvaro', 'member', '👨‍🎨', 'password123', new Date().toISOString()],
    ['user-7', 'angela@agencia.com', 'Angela', 'member', '👩‍🔬', 'password123', new Date().toISOString()],
    ['user-8', 'liz@agencia.com', 'Liz', 'member', '👩‍💼', 'password123', new Date().toISOString()]
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:G9`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleUsers
    }
  });
  
  console.log('✅ Users sheet populated');
}

async function setupComments(sheets, spreadsheetId) {
  console.log('📋 Setting up comments sheet...');
  
  const sheetName = 'task_comments';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:E1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'task_id', 'user_id', 'content', 'created_at']]
    }
  });
  
  // Add sample data
  const sampleComments = [
    ['comment-1', 'task-1', 'user-2', '¡Excelente trabajo con el diseño!', new Date().toISOString()],
    ['comment-2', 'task-1', 'user-3', 'Necesitamos ajustar los colores de la marca', new Date().toISOString()],
    ['comment-3', 'task-4', 'user-1', 'Los componentes están funcionando perfectamente', new Date().toISOString()]
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:E4`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleComments
    }
  });
  
  console.log('✅ Comments sheet populated');
}

async function setupActivityLog(sheets, spreadsheetId) {
  console.log('📋 Setting up activity log sheet...');
  
  const sheetName = 'activity_log';
  
  // Add headers
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${sheetName}!A1:F1`,
    valueInputOption: 'RAW',
    requestBody: {
      values: [['id', 'entity_type', 'entity_id', 'action', 'user_id', 'created_at']]
    }
  });
  
  // Add sample data
  const sampleActivities = [
    ['activity-1', 'task', 'task-1', 'created', 'user-1', new Date().toISOString()],
    ['activity-2', 'task', 'task-1', 'status_changed', 'user-2', new Date().toISOString()],
    ['activity-3', 'project', 'proj-1', 'created', 'user-1', new Date().toISOString()],
    ['activity-4', 'task', 'task-6', 'completed', 'user-6', new Date().toISOString()]
  ];
  
  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${sheetName}!A2:F5`,
    valueInputOption: 'RAW',
    requestBody: {
      values: sampleActivities
    }
  });
  
  console.log('✅ Activity log sheet populated');
}

// Run the population
populateSheets();
