import { Task, Project, Workspace, TaskComment, Attachment } from './validation'
import { generateId } from './ids'

const now = (): string => new Date().toISOString()

// In-memory data store
class DataStore {
  private workspaces: Workspace[] = []
  private projects: Project[] = []
  private tasks: Task[] = []
  private comments: TaskComment[] = []
  private attachments: Attachment[] = []

  // Workspaces
  getWorkspaces(): Workspace[] {
    return this.workspaces
  }

  getWorkspaceById(id: string): Workspace | undefined {
    return this.workspaces.find(w => w.id === id)
  }

  createWorkspace(data: Omit<Workspace, 'id' | 'created_at' | 'updated_at' | 'version'>): Workspace {
    const workspace: Workspace = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data
    }
    this.workspaces.push(workspace)
    return workspace
  }

  // Projects
  getProjects(): Project[] {
    return this.projects
  }

  getProjectById(id: string): Project | undefined {
    return this.projects.find(p => p.id === id)
  }

  getProjectsByWorkspace(workspaceId: string): Project[] {
    return this.projects.filter(p => p.workspace_id === workspaceId)
  }

  createProject(data: Omit<Project, 'id' | 'created_at' | 'updated_at' | 'version'>): Project {
    const project: Project = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data
    }
    this.projects.push(project)
    return project
  }

  updateProject(id: string, data: Partial<Project>): Project | undefined {
    const index = this.projects.findIndex(p => p.id === id)
    if (index === -1) return undefined

    this.projects[index] = {
      ...this.projects[index],
      ...data,
      updated_at: now(),
      version: this.projects[index].version + 1
    }
    return this.projects[index]
  }

  // Tasks
  getTasks(): Task[] {
    return this.tasks
  }

  getTaskById(id: string): Task | undefined {
    return this.tasks.find(t => t.id === id)
  }

  getTasksByProject(projectId: string): Task[] {
    return this.tasks.filter(t => t.project_id === projectId)
  }

  getTasksByAssignee(assigneeId: string): Task[] {
    return this.tasks.filter(t => t.assignee_id === assigneeId)
  }

  createTask(data: Omit<Task, 'id' | 'created_at' | 'updated_at' | 'version'>): Task {
    const task: Task = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data
    }
    this.tasks.push(task)
    return task
  }

  updateTask(id: string, data: Partial<Task>): Task | undefined {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return undefined

    this.tasks[index] = {
      ...this.tasks[index],
      ...data,
      updated_at: now(),
      version: this.tasks[index].version + 1
    }
    return this.tasks[index]
  }

  deleteTask(id: string): boolean {
    const index = this.tasks.findIndex(t => t.id === id)
    if (index === -1) return false

    this.tasks.splice(index, 1)
    return true
  }

  // Comments
  getCommentsByTask(taskId: string): TaskComment[] {
    return this.comments.filter(c => c.task_id === taskId)
  }

  createComment(data: Omit<TaskComment, 'id' | 'created_at' | 'updated_at' | 'version'>): TaskComment {
    const comment: TaskComment = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data
    }
    this.comments.push(comment)
    return comment
  }

  // Attachments
  getAttachmentsByTask(taskId: string): Attachment[] {
    return this.attachments.filter(a => a.task_id === taskId)
  }

  createAttachment(data: Omit<Attachment, 'id' | 'created_at' | 'updated_at' | 'version'>): Attachment {
    const attachment: Attachment = {
      id: generateId(),
      created_at: now(),
      updated_at: now(),
      version: 1,
      ...data
    }
    this.attachments.push(attachment)
    return attachment
  }

  // Initialize with demo data
  initializeDemoData() {
    // Create demo workspace
    const workspace = this.createWorkspace({
      name: 'Agencia Marketing',
      created_by: 'user-1'
    })

    // Create demo projects
    const project1 = this.createProject({
      workspace_id: workspace.id,
      name: 'Campaña Redes Sociales',
      description_md: 'Desarrollo de contenido para redes sociales del cliente',
      status: 'active'
    })

    const project2 = this.createProject({
      workspace_id: workspace.id,
      name: 'Rediseño Web',
      description_md: 'Rediseño completo del sitio web corporativo',
      status: 'active'
    })

    const project3 = this.createProject({
      workspace_id: workspace.id,
      name: 'Análisis Competencia',
      description_md: 'Investigación y análisis de la competencia',
      status: 'active'
    })

    // Create demo tasks
    this.createTask({
      project_id: project1.id,
      title: 'Crear contenido para Instagram',
      description_md: 'Desarrollar posts creativos para la campaña de verano',
      priority: 'high',
      status: 'inprogress',
      assignee_id: 'user-1',
      reporter_id: 'user-2',
      due_date: '2024-01-15',
      estimate_hours: 4,
      labels_csv: 'redes sociales, contenido'
    })

    this.createTask({
      project_id: project1.id,
      title: 'Planificar calendario editorial',
      description_md: 'Crear calendario de publicaciones para el próximo mes',
      priority: 'med',
      status: 'todo',
      assignee_id: 'user-3',
      reporter_id: 'user-2',
      due_date: '2024-01-20',
      estimate_hours: 6,
      labels_csv: 'planificación, calendario'
    })

    this.createTask({
      project_id: project2.id,
      title: 'Diseñar mockups para landing page',
      description_md: 'Crear wireframes y mockups para la nueva landing page',
      priority: 'urgent',
      status: 'todo',
      assignee_id: 'user-4',
      reporter_id: 'user-2',
      due_date: '2024-01-12',
      estimate_hours: 8,
      labels_csv: 'diseño, web'
    })

    this.createTask({
      project_id: project2.id,
      title: 'Desarrollar componentes React',
      description_md: 'Implementar los componentes de la nueva interfaz',
      priority: 'high',
      status: 'inprogress',
      assignee_id: 'user-5',
      reporter_id: 'user-2',
      due_date: '2024-01-18',
      estimate_hours: 12,
      labels_csv: 'desarrollo, react'
    })

    this.createTask({
      project_id: project3.id,
      title: 'Analizar métricas de competidores',
      description_md: 'Investigar y analizar las métricas de los principales competidores',
      priority: 'med',
      status: 'done',
      assignee_id: 'user-6',
      reporter_id: 'user-2',
      due_date: '2024-01-10',
      estimate_hours: 6,
      completed_at: '2024-01-09T16:00:00Z',
      labels_csv: 'análisis, investigación'
    })

    this.createTask({
      project_id: project3.id,
      title: 'Crear reporte ejecutivo',
      description_md: 'Compilar los hallazgos en un reporte ejecutivo',
      priority: 'high',
      status: 'review',
      assignee_id: 'user-7',
      reporter_id: 'user-2',
      due_date: '2024-01-30',
      estimate_hours: 6,
      labels_csv: 'reporte, ejecutivo'
    })
  }
}

// Singleton instance
export const dataStore = new DataStore()

// Initialize demo data
dataStore.initializeDemoData()
