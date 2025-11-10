import { getSheetsClient, getSpreadsheetId } from '../sheets/client'

export interface Project {
  id: string
  workspace_id: string
  name: string
  description: string
  status: 'active' | 'completed' | 'paused'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline: string
  // Campos antiguos (para compatibilidad)
  monthly_videos?: number
  monthly_photos?: number
  monthly_designs?: number
  // Campos nuevos (tipos específicos)
  monthly_reel_corto?: number
  monthly_reel_largo?: number
  monthly_reel?: number
  monthly_video?: number
  monthly_diseno_simple?: number
  monthly_diseno_complejo?: number
  monthly_diseno?: number
  monthly_foto_simple?: number
  monthly_foto_elaborada?: number
  monthly_foto?: number
  monthly_recording_sessions?: number // Sesiones de grabación al mes (3 horas por sesión)
  created_at: string
  updated_at: string
}

export interface CreateProjectData {
  name: string
  description: string
  priority: 'low' | 'medium' | 'high' | 'urgent'
  deadline: string
  // Campos antiguos (para compatibilidad)
  monthly_videos?: number
  monthly_photos?: number
  monthly_designs?: number
  // Campos nuevos (tipos específicos)
  monthly_reel_corto?: number
  monthly_reel_largo?: number
  monthly_reel?: number
  monthly_video?: number
  monthly_diseno_simple?: number
  monthly_diseno_complejo?: number
  monthly_diseno?: number
  monthly_foto_simple?: number
  monthly_foto_elaborada?: number
  monthly_foto?: number
  monthly_recording_sessions?: number // Sesiones de grabación al mes (3 horas por sesión)
}

export class ProjectsService {
  private static async getSheet() {
    const sheets = await getSheetsClient()
    const spreadsheetId = getSpreadsheetId()
    return { sheets, spreadsheetId }
  }

  static async getAllProjects(workspaceId: string): Promise<Project[]> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'projects!A2:W1000', // Expandido para incluir sesiones de grabación
      })

      const rows = response.data.values || []
      
      return rows
        .filter(row => row[1] === workspaceId) // Filter by workspace_id
        .map(row => ({
          id: row[0],
          workspace_id: row[1],
          name: row[2],
          description: row[3],
          status: row[4] as Project['status'],
          priority: row[5] as Project['priority'],
          deadline: row[6],
          // Campos antiguos (para compatibilidad)
          monthly_videos: parseInt(row[7]) || 0,
          monthly_photos: parseInt(row[8]) || 0,
          monthly_designs: parseInt(row[9]) || 0,
          // Campos nuevos (tipos específicos)
          monthly_reel_corto: parseInt(row[12]) || 0,
          monthly_reel_largo: parseInt(row[13]) || 0,
          monthly_reel: parseInt(row[14]) || 0,
          monthly_video: parseInt(row[15]) || 0,
          monthly_diseno_simple: parseInt(row[16]) || 0,
          monthly_diseno_complejo: parseInt(row[17]) || 0,
          monthly_diseno: parseInt(row[18]) || 0,
          monthly_foto_simple: parseInt(row[19]) || 0,
          monthly_foto_elaborada: parseInt(row[20]) || 0,
          monthly_foto: parseInt(row[21]) || 0,
          monthly_recording_sessions: parseInt(row[22]) || 0,
          created_at: row[10] || new Date().toISOString(),
          updated_at: row[11] || new Date().toISOString()
        }))
    } catch (error) {
      console.error('Error fetching projects:', error)
      return []
    }
  }

  static async createProject(workspaceId: string, data: CreateProjectData): Promise<Project> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      const projectId = `proj-${Date.now()}`
      const now = new Date().toISOString()
      
      const newProject = [
        projectId,
        workspaceId,
        data.name,
        data.description,
        'active',
        data.priority,
        data.deadline,
        // Campos antiguos (para compatibilidad)
        data.monthly_videos || 0,
        data.monthly_photos || 0,
        data.monthly_designs || 0,
        now,
        now,
        // Campos nuevos (tipos específicos)
        data.monthly_reel_corto || 0,
        data.monthly_reel_largo || 0,
        data.monthly_reel || 0,
        data.monthly_video || 0,
        data.monthly_diseno_simple || 0,
        data.monthly_diseno_complejo || 0,
        data.monthly_diseno || 0,
        data.monthly_foto_simple || 0,
        data.monthly_foto_elaborada || 0,
        data.monthly_foto || 0,
        data.monthly_recording_sessions || 0
      ]

      await sheets.spreadsheets.values.append({
        spreadsheetId,
        range: 'projects!A:W',
        valueInputOption: 'RAW',
        requestBody: {
          values: [newProject]
        }
      })

      console.log('✅ Project created in Google Sheets:', projectId)

      return {
        id: projectId,
        workspace_id: workspaceId,
        name: data.name,
        description: data.description,
        status: 'active',
        priority: data.priority,
        deadline: data.deadline,
        // Campos antiguos (para compatibilidad)
        monthly_videos: data.monthly_videos || 0,
        monthly_photos: data.monthly_photos || 0,
        monthly_designs: data.monthly_designs || 0,
        // Campos nuevos (tipos específicos)
        monthly_reel_corto: data.monthly_reel_corto || 0,
        monthly_reel_largo: data.monthly_reel_largo || 0,
        monthly_reel: data.monthly_reel || 0,
        monthly_video: data.monthly_video || 0,
        monthly_diseno_simple: data.monthly_diseno_simple || 0,
        monthly_diseno_complejo: data.monthly_diseno_complejo || 0,
        monthly_diseno: data.monthly_diseno || 0,
        monthly_foto_simple: data.monthly_foto_simple || 0,
        monthly_foto_elaborada: data.monthly_foto_elaborada || 0,
        monthly_foto: data.monthly_foto || 0,
        monthly_recording_sessions: data.monthly_recording_sessions || 0,
        created_at: now,
        updated_at: now
      }
    } catch (error) {
      console.error('Error creating project:', error)
      throw error
    }
  }

  static async updateProject(projectId: string, updates: Partial<Project>): Promise<Project> {
    try {
      const { sheets, spreadsheetId } = await this.getSheet()
      
      // Get all projects to find the row (hasta columna W para incluir todos los campos)
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: 'projects!A2:W1000',
      })

      const rows = response.data.values || []
      const projectIndex = rows.findIndex(row => row[0] === projectId)
      
      if (projectIndex === -1) {
        throw new Error('Project not found')
      }

      const rowNumber = projectIndex + 2 // +2 because we skip header and arrays are 0-indexed
      
      // Update the row - asegurar que tenga todas las columnas necesarias
      const updatedRow = [...rows[projectIndex]]
      // Asegurar que el array tenga al menos 23 elementos (columnas A-W)
      while (updatedRow.length < 23) {
        updatedRow.push('')
      }
      
      // Actualizar campos básicos
      if (updates.name !== undefined) updatedRow[2] = updates.name
      if (updates.description !== undefined) updatedRow[3] = updates.description || ''
      if (updates.status) updatedRow[4] = updates.status
      if (updates.priority) updatedRow[5] = updates.priority
      if (updates.deadline) updatedRow[6] = updates.deadline
      
      // Actualizar campos antiguos (para compatibilidad)
      if (updates.monthly_videos !== undefined) updatedRow[7] = updates.monthly_videos || 0
      if (updates.monthly_photos !== undefined) updatedRow[8] = updates.monthly_photos || 0
      if (updates.monthly_designs !== undefined) updatedRow[9] = updates.monthly_designs || 0
      
      // Actualizar updated_at
      updatedRow[11] = new Date().toISOString()
      
      // Actualizar campos nuevos (tipos específicos)
      if (updates.monthly_reel_corto !== undefined) updatedRow[12] = updates.monthly_reel_corto || 0
      if (updates.monthly_reel_largo !== undefined) updatedRow[13] = updates.monthly_reel_largo || 0
      if (updates.monthly_reel !== undefined) updatedRow[14] = updates.monthly_reel || 0
      if (updates.monthly_video !== undefined) updatedRow[15] = updates.monthly_video || 0
      if (updates.monthly_diseno_simple !== undefined) updatedRow[16] = updates.monthly_diseno_simple || 0
      if (updates.monthly_diseno_complejo !== undefined) updatedRow[17] = updates.monthly_diseno_complejo || 0
      if (updates.monthly_diseno !== undefined) updatedRow[18] = updates.monthly_diseno || 0
      if (updates.monthly_foto_simple !== undefined) updatedRow[19] = updates.monthly_foto_simple || 0
      if (updates.monthly_foto_elaborada !== undefined) updatedRow[20] = updates.monthly_foto_elaborada || 0
      if (updates.monthly_foto !== undefined) updatedRow[21] = updates.monthly_foto || 0
      if (updates.monthly_recording_sessions !== undefined) updatedRow[22] = updates.monthly_recording_sessions || 0

      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `projects!A${rowNumber}:W${rowNumber}`,
        valueInputOption: 'RAW',
        requestBody: {
          values: [updatedRow]
        }
      })

      console.log('✅ Project updated in Google Sheets:', projectId)

      return {
        id: updatedRow[0],
        workspace_id: updatedRow[1],
        name: updatedRow[2],
        description: updatedRow[3] || '',
        status: (updatedRow[4] || 'active') as Project['status'],
        priority: (updatedRow[5] || 'medium') as Project['priority'],
        deadline: updatedRow[6] || '',
        // Campos antiguos (para compatibilidad)
        monthly_videos: parseInt(updatedRow[7]) || 0,
        monthly_photos: parseInt(updatedRow[8]) || 0,
        monthly_designs: parseInt(updatedRow[9]) || 0,
        // Campos nuevos (tipos específicos)
        monthly_reel_corto: parseInt(updatedRow[12]) || 0,
        monthly_reel_largo: parseInt(updatedRow[13]) || 0,
        monthly_reel: parseInt(updatedRow[14]) || 0,
        monthly_video: parseInt(updatedRow[15]) || 0,
        monthly_diseno_simple: parseInt(updatedRow[16]) || 0,
        monthly_diseno_complejo: parseInt(updatedRow[17]) || 0,
        monthly_diseno: parseInt(updatedRow[18]) || 0,
        monthly_foto_simple: parseInt(updatedRow[19]) || 0,
        monthly_foto_elaborada: parseInt(updatedRow[20]) || 0,
        monthly_foto: parseInt(updatedRow[21]) || 0,
        monthly_recording_sessions: parseInt(updatedRow[22]) || 0,
        created_at: updatedRow[10] || new Date().toISOString(),
        updated_at: updatedRow[11] || new Date().toISOString()
      }
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }
}
