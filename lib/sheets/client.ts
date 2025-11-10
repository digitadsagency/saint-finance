import { google } from 'googleapis';

let auth: any = null;

export const getSheetsClient = async () => {
  if (!auth) {
    try {
      auth = new google.auth.GoogleAuth({
        credentials: {
          client_email: process.env.GOOGLE_CLIENT_EMAIL,
          private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        },
        scopes: [
          'https://www.googleapis.com/auth/spreadsheets',
          'https://www.googleapis.com/auth/drive'
        ],
      });
      
      console.log('✅ Google Sheets authentication initialized');
    } catch (error) {
      console.error('❌ Error initializing Google Sheets auth:', error);
      throw error;
    }
  }

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
};

export const getSpreadsheetId = (): string => {
  const id = process.env.SHEETS_SPREADSHEET_ID;
  if (!id) {
    throw new Error('SHEETS_SPREADSHEET_ID environment variable is required');
  }
  return id;
};

export const getSheetName = (entity: string): string => {
  const sheetNames: Record<string, string> = {
    workspaces: 'workspaces',
    workspace_members: 'workspace_members',
    projects: 'projects',
    project_members: 'project_members',
    tasks: 'tasks',
    task_comments: 'task_comments',
    task_labels: 'task_labels',
    attachments: 'attachments',
    activity_log: 'activity_log',
  };
  
  return sheetNames[entity] || entity;
};
