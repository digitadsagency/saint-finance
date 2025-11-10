import { BaseDAO } from './base';
import { Project, CreateProjectInput } from '../../validation';

export class ProjectsDAO extends BaseDAO<Project> {
  protected entityName = 'projects';
  protected headers = ['id', 'workspace_id', 'name', 'description_md', 'status', 'created_at', 'updated_at', 'version'];

  async list(): Promise<Project[]> {
    return this.getAllRows();
  }

  async getById(id: string): Promise<Project | null> {
    return this.getRowById(id);
  }

  async getByWorkspaceId(workspaceId: string): Promise<Project[]> {
    const projects = await this.getAllRows();
    return projects.filter(project => project.workspace_id === workspaceId);
  }

  async create(data: CreateProjectInput): Promise<Project> {
    return this.insertRow(data);
  }

  async updateById(id: string, data: Partial<Project>, version: number): Promise<Project> {
    return this.updateRowById(id, data, version);
  }

  async deleteById(id: string): Promise<void> {
    return this.deleteRowById(id);
  }
}

export const projectsDao = new ProjectsDAO();
