import { getSheetsClient, getSpreadsheetId } from '../sheets/client'

export interface Task {
  id: string
  project_id: string
  title: string
  description: string
  status: 'backlog' | 'todo' | 'inprogress' | 'review' | 'done'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id: string
  due_date: string
  estimate_hours?: number
  created_at: string
  updated_at: string
}

export interface CreateTaskData {
  project_id: string
  title: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assignee_id?: string
  due_date?: string
  estimate_hours?: number
}

export class TasksService {
  private static async getSheet() {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    return { sheets, spreadsheetId }
  }

  static async getTasksByProject(projectId: string): Promise<Task[]> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'tasks!A2:J1000', // Skip header row
      })

      const rows = response.data.values || []
      
      return rows
        .filter(row => row[1] === projectId) // Filter by project_id
        .map(row => ({
          id: row[0],
          project_id: row[1],
          title: row[2],
          description: row[3],
          status: row[4] as Task['status'],
          priority: row[5] as Task['priority'],
          assignee_id: row[6],
          due_date: row[7],
          created_at: row[8],
          updated_at: row[9]
        }))
    } catch (error) {
      console.error('Error fetching tasks:', error)
      return []
    }
  }

  static async getAllTasks(workspaceId: string): Promise<Task[]> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'tasks!A2:K1000',
      })

      const rows = response.data.values || []
      
      // Get all projects for this workspace first
      const projectsResponse = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'projects!A2:J1000',
      })

      const projectRows = projectsResponse.data.values || []
      const workspaceProjectIds = projectRows
        .filter(row => row[1] === workspaceId)
        .map(row => row[0])

      return rows
        .filter(row => workspaceProjectIds.includes(row[1]))
        .map(row => ({
          id: row[0],
          project_id: row[1],
          title: row[2],
          description: row[3],
          status: row[4] as Task['status'],
          priority: row[5] as Task['priority'],
          assignee_id: row[6],
          due_date: row[7],
          estimate_hours: row[8] ? parseFloat(row[8]) : undefined,
          created_at: row[9],
          updated_at: row[10]
        }))
    } catch (error) {
      console.error('Error fetching all tasks:', error)
      return []
    }
  }

  static async createTask(data: CreateTaskData): Promise<Task> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      const taskId = `task-${Date.now()}`
      const now = new Date().toISOString()
      
      const newTask = [
        taskId,
        data.project_id,
        data.title,
        data.description,
        'todo',
        data.priority,
        data.assignee_id || 'user-1',
        data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
        data.estimate_hours || '', // Add estimate_hours field
        now,
        now
      ]

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'tasks!A:K',
        valueInputOption: 'RAW',
        requestBody: {
          values: [newTask]
        }
      })

      console.log('✅ Task created in Google Sheets:', taskId)

      return {
        id: taskId,
        project_id: data.project_id,
        title: data.title,
        description: data.description,
        status: 'todo',
        priority: data.priority,
        assignee_id: data.assignee_id || 'user-1',
        due_date: data.due_date || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        estimate_hours: data.estimate_hours,
        created_at: now,
        updated_at: now
      }
    } catch (error) {
      console.error('Error creating task:', error)
      throw error
    }
  }

  static async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      // Get all tasks to find the row
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'tasks!A2:J1000',
      })

      const rows = response.data.values || []
      const taskIndex = rows.findIndex(row => row[0] === taskId)
      
      if (taskIndex === -1) {
        throw new Error('Task not found')
      }

      const rowNumber = taskIndex + 2 // +2 because we skip header and arrays are 0-indexed
      
      // Update the row
      const updatedRow = [...rows[taskIndex]]
      if (updates.title) updatedRow[2] = updates.title
      if (updates.description) updatedRow[3] = updates.description
      if (updates.status) updatedRow[4] = updates.status
      if (updates.priority) updatedRow[5] = updates.priority
      if (updates.assignee_id) updatedRow[6] = updates.assignee_id
      if (updates.due_date) updatedRow[7] = updates.due_date
      updatedRow[9] = new Date().toISOString() // updated_at

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `tasks!A${rowNumber}:J${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      })

      console.log('✅ Task updated in Google Sheets:', taskId)

      return {
        id: updatedRow[0],
        project_id: updatedRow[1],
        title: updatedRow[2],
        description: updatedRow[3],
        status: updatedRow[4] as Task['status'],
        priority: updatedRow[5] as Task['priority'],
        assignee_id: updatedRow[6],
        due_date: updatedRow[7],
        created_at: updatedRow[8],
        updated_at: updatedRow[9]
      }
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }
}
