import { Role } from './validation';

export const PERMISSIONS = {
  // Workspace permissions
  WORKSPACE_VIEW: ['owner', 'admin', 'member'],
  WORKSPACE_EDIT: ['owner', 'admin'],
  WORKSPACE_DELETE: ['owner'],
  WORKSPACE_MANAGE_MEMBERS: ['owner', 'admin'],

  // Project permissions
  PROJECT_VIEW: ['owner', 'admin', 'member'],
  PROJECT_CREATE: ['owner', 'admin', 'member'],
  PROJECT_EDIT: ['owner', 'admin', 'member'],
  PROJECT_DELETE: ['owner', 'admin'],
  PROJECT_MANAGE_MEMBERS: ['owner', 'admin'],

  // Task permissions
  TASK_VIEW: ['owner', 'admin', 'member'],
  TASK_CREATE: ['owner', 'admin', 'member'],
  TASK_EDIT: ['owner', 'admin', 'member'],
  TASK_DELETE: ['owner', 'admin'],
  TASK_ASSIGN: ['owner', 'admin', 'member'],

  // Comment permissions
  COMMENT_VIEW: ['owner', 'admin', 'member'],
  COMMENT_CREATE: ['owner', 'admin', 'member'],
  COMMENT_EDIT: ['owner', 'admin', 'member'],
  COMMENT_DELETE: ['owner', 'admin', 'member'],
} as const;

export const hasPermission = (userRole: Role, permission: keyof typeof PERMISSIONS): boolean => {
  return PERMISSIONS[permission].includes(userRole);
};

export const canViewWorkspace = (role: Role): boolean => {
  return hasPermission(role, 'WORKSPACE_VIEW');
};

export const canEditWorkspace = (role: Role): boolean => {
  return hasPermission(role, 'WORKSPACE_EDIT');
};

export const canDeleteWorkspace = (role: Role): boolean => {
  return hasPermission(role, 'WORKSPACE_DELETE');
};

export const canManageWorkspaceMembers = (role: Role): boolean => {
  return hasPermission(role, 'WORKSPACE_MANAGE_MEMBERS');
};

export const canViewProject = (role: Role): boolean => {
  return hasPermission(role, 'PROJECT_VIEW');
};

export const canCreateProject = (role: Role): boolean => {
  return hasPermission(role, 'PROJECT_CREATE');
};

export const canEditProject = (role: Role): boolean => {
  return hasPermission(role, 'PROJECT_EDIT');
};

export const canDeleteProject = (role: Role): boolean => {
  return hasPermission(role, 'PROJECT_DELETE');
};

export const canManageProjectMembers = (role: Role): boolean => {
  return hasPermission(role, 'PROJECT_MANAGE_MEMBERS');
};

export const canViewTask = (role: Role): boolean => {
  return hasPermission(role, 'TASK_VIEW');
};

export const canCreateTask = (role: Role): boolean => {
  return hasPermission(role, 'TASK_CREATE');
};

export const canEditTask = (role: Role): boolean => {
  return hasPermission(role, 'TASK_EDIT');
};

export const canDeleteTask = (role: Role): boolean => {
  return hasPermission(role, 'TASK_DELETE');
};

export const canAssignTask = (role: Role): boolean => {
  return hasPermission(role, 'TASK_ASSIGN');
};

export const canViewComment = (role: Role): boolean => {
  return hasPermission(role, 'COMMENT_VIEW');
};

export const canCreateComment = (role: Role): boolean => {
  return hasPermission(role, 'COMMENT_CREATE');
};

export const canEditComment = (role: Role): boolean => {
  return hasPermission(role, 'COMMENT_EDIT');
};

export const canDeleteComment = (role: Role): boolean => {
  return hasPermission(role, 'COMMENT_DELETE');
};
