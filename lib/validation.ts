import { z } from 'zod';

// Enums
export const PrioritySchema = z.enum(['low', 'med', 'high', 'urgent']);
export const StatusSchema = z.enum(['backlog', 'todo', 'inprogress', 'review', 'done']);
export const RoleSchema = z.enum(['owner', 'admin', 'member']);

// Base schemas
export const BaseEntitySchema = z.object({
  id: z.string().uuid(),
  created_at: z.string(),
  updated_at: z.string(),
  version: z.number().int().positive(),
});

// Workspace schemas
export const WorkspaceSchema = BaseEntitySchema.extend({
  name: z.string().min(1).max(100),
  created_by: z.string().uuid(),
});

export const WorkspaceMemberSchema = BaseEntitySchema.extend({
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: RoleSchema,
});

// Project schemas
export const ProjectSchema = BaseEntitySchema.extend({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description_md: z.string().optional(),
  status: z.enum(['active', 'archived']).default('active'),
});

export const ProjectMemberSchema = BaseEntitySchema.extend({
  project_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: RoleSchema,
});

// Task schemas
export const TaskSchema = BaseEntitySchema.extend({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description_md: z.string().optional(),
  priority: PrioritySchema,
  status: StatusSchema,
  assignee_id: z.string().uuid().optional(),
  reporter_id: z.string().uuid(),
  due_date: z.string().optional(),
  estimate_hours: z.number().positive().optional(),
  completed_at: z.string().optional(),
  labels_csv: z.string().optional(),
});

export const TaskCommentSchema = BaseEntitySchema.extend({
  task_id: z.string().uuid(),
  user_id: z.string().uuid(),
  body_md: z.string().min(1),
});

export const TaskLabelSchema = BaseEntitySchema.extend({
  project_id: z.string().uuid(),
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-F]{6}$/i),
});

export const AttachmentSchema = BaseEntitySchema.extend({
  task_id: z.string().uuid(),
  file_url: z.string().url(),
  mime: z.string(),
  size: z.number().positive(),
});

export const ActivityLogSchema = z.object({
  id: z.string().uuid(),
  task_id: z.string().uuid(),
  actor_id: z.string().uuid(),
  action: z.string(),
  from_value: z.string().optional(),
  to_value: z.string().optional(),
  created_at: z.string(),
});

// Input schemas for forms
export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
});

export const CreateProjectSchema = z.object({
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  description_md: z.string().optional(),
});

export const CreateTaskSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description_md: z.string().optional(),
  priority: PrioritySchema,
  status: StatusSchema,
  assignee_id: z.string().uuid().optional(),
  due_date: z.string().optional(),
  estimate_hours: z.number().positive().optional(),
  labels_csv: z.string().optional(),
});

export const UpdateTaskSchema = CreateTaskSchema.partial().extend({
  id: z.string().uuid(),
  version: z.number().int().positive(),
});

export const CreateCommentSchema = z.object({
  task_id: z.string().uuid(),
  body_md: z.string().min(1),
});

export const CreateAttachmentSchema = z.object({
  task_id: z.string().uuid(),
  file_url: z.string().url(),
  mime: z.string(),
  size: z.number().positive(),
});

// Type exports
export type Priority = z.infer<typeof PrioritySchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type Workspace = z.infer<typeof WorkspaceSchema>;
export type WorkspaceMember = z.infer<typeof WorkspaceMemberSchema>;
export type Project = z.infer<typeof ProjectSchema>;
export type ProjectMember = z.infer<typeof ProjectMemberSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type TaskComment = z.infer<typeof TaskCommentSchema>;
export type TaskLabel = z.infer<typeof TaskLabelSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type ActivityLog = z.infer<typeof ActivityLogSchema>;
export type CreateWorkspaceInput = z.infer<typeof CreateWorkspaceSchema>;
export type CreateProjectInput = z.infer<typeof CreateProjectSchema>;
export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
export type UpdateTaskInput = z.infer<typeof UpdateTaskSchema>;
export type CreateCommentInput = z.infer<typeof CreateCommentSchema>;
export type CreateAttachmentInput = z.infer<typeof CreateAttachmentSchema>;
