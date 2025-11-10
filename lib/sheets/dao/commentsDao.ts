import { BaseDAO } from './base';
import { TaskComment, CreateCommentInput } from '../../validation';

export class CommentsDAO extends BaseDAO<TaskComment> {
  protected entityName = 'task_comments';
  protected headers = ['id', 'task_id', 'user_id', 'body_md', 'created_at', 'updated_at', 'version'];

  async list(): Promise<TaskComment[]> {
    return this.getAllRows();
  }

  async getById(id: string): Promise<TaskComment | null> {
    return this.getRowById(id);
  }

  async getByTaskId(taskId: string): Promise<TaskComment[]> {
    const comments = await this.getAllRows();
    return comments
      .filter(comment => comment.task_id === taskId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  async create(data: CreateCommentInput & { user_id: string }): Promise<TaskComment> {
    return this.insertRow(data);
  }

  async updateById(id: string, data: Partial<TaskComment>, version: number): Promise<TaskComment> {
    return this.updateRowById(id, data, version);
  }

  async deleteById(id: string): Promise<void> {
    return this.deleteRowById(id);
  }
}

export const commentsDao = new CommentsDAO();
