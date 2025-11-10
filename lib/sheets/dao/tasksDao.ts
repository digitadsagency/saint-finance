import { BaseDAO } from './base';
import { Task, CreateTaskInput, UpdateTaskInput, Status } from '../../validation';

export class TasksDAO extends BaseDAO<Task> {
  protected entityName = 'tasks';
  protected headers = [
    'id', 'project_id', 'title', 'description_md', 'priority', 'status', 
    'assignee_id', 'reporter_id', 'due_date', 'estimate_hours', 'completed_at', 
    'created_at', 'updated_at', 'version', 'labels_csv'
  ];

  async list(): Promise<Task[]> {
    return this.getAllRows();
  }

  async getById(id: string): Promise<Task | null> {
    return this.getRowById(id);
  }

  async getByProjectId(projectId: string): Promise<Task[]> {
    const tasks = await this.getAllRows();
    return tasks.filter(task => task.project_id === projectId);
  }

  async getByAssigneeId(assigneeId: string): Promise<Task[]> {
    const tasks = await this.getAllRows();
    return tasks.filter(task => task.assignee_id === assigneeId);
  }

  async getByStatus(status: Status): Promise<Task[]> {
    const tasks = await this.getAllRows();
    return tasks.filter(task => task.status === status);
  }

  async create(data: CreateTaskInput & { reporter_id: string }): Promise<Task> {
    return this.insertRow(data);
  }

  async updateById(id: string, data: UpdateTaskInput): Promise<Task> {
    const { version, ...updateData } = data;
    return this.updateRowById(id, updateData, version);
  }

  async updateStatus(id: string, status: Status, version: number): Promise<Task> {
    const updateData: Partial<Task> = { status };
    if (status === 'done') {
      updateData.completed_at = new Date().toISOString();
    } else {
      updateData.completed_at = undefined;
    }
    return this.updateRowById(id, updateData, version);
  }

  async deleteById(id: string): Promise<void> {
    return this.deleteRowById(id);
  }

  async search(query: string): Promise<Task[]> {
    const tasks = await this.getAllRows();
    const lowercaseQuery = query.toLowerCase();
    
    return tasks.filter(task => 
      task.title.toLowerCase().includes(lowercaseQuery) ||
      (task.description_md && task.description_md.toLowerCase().includes(lowercaseQuery)) ||
      (task.labels_csv && task.labels_csv.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const tasksDao = new TasksDAO();
