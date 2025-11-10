import { BaseDAO } from './base';
import { Workspace, CreateWorkspaceInput } from '../../validation';

export class WorkspacesDAO extends BaseDAO<Workspace> {
  protected entityName = 'workspaces';
  protected headers = ['id', 'name', 'created_by', 'created_at', 'updated_at', 'version'];

  async list(): Promise<Workspace[]> {
    return this.getAllRows();
  }

  async getById(id: string): Promise<Workspace | null> {
    return this.getRowById(id);
  }

  async create(data: CreateWorkspaceInput & { created_by: string }): Promise<Workspace> {
    return this.insertRow(data);
  }

  async updateById(id: string, data: Partial<Workspace>, version: number): Promise<Workspace> {
    return this.updateRowById(id, data, version);
  }

  async deleteById(id: string): Promise<void> {
    return this.deleteRowById(id);
  }
}

export const workspacesDao = new WorkspacesDAO();
