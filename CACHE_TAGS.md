# Cache Tags Reference

## Tag Structure

Tags follow pattern: `{resource}:{id}` or `{resource}:list:{filter}`

## Tags List

### Tasks
- `task:{taskId}` - Individual task
- `tasks:project:{projectId}` - All tasks for a project
- `tasks:workspace:{workspaceId}` - All tasks for workspace
- `tasks:user:{userId}` - User's assigned tasks
- `tasks:all` - All tasks (global)

### Projects
- `project:{projectId}` - Individual project
- `projects:workspace:{workspaceId}` - All projects in workspace
- `projects:all` - All projects (global)

### Users
- `user:{userId}` - Individual user
- `users:all` - All users

### Financial Data
- `finance:salaries:{workspaceId}` - Salaries
- `finance:billing:{workspaceId}` - Client billing
- `finance:worklogs:{workspaceId}` - Worklogs
- `finance:metrics:{workspaceId}:{month}` - Metrics for month

### Daily Logs
- `dailylog:{workspaceId}:{userId}` - User's daily logs
- `dailylog:{workspaceId}:all` - All logs (admin)

## Invalidation Rules

### Task Mutations
- **Create Task**: Invalidate `tasks:project:{projectId}`, `tasks:workspace:{workspaceId}`, `tasks:all`
- **Update Task**: Invalidate `task:{taskId}`, `tasks:project:{projectId}`, `tasks:workspace:{workspaceId}`
- **Delete Task**: Invalidate `task:{taskId}`, `tasks:project:{projectId}`, `tasks:workspace:{workspaceId}`

### Project Mutations
- **Create Project**: Invalidate `projects:workspace:{workspaceId}`, `projects:all`
- **Update Project**: Invalidate `project:{projectId}`, `projects:workspace:{workspaceId}`

### Financial Mutations
- **Create/Update Salary**: Invalidate `finance:salaries:{workspaceId}`, `finance:metrics:{workspaceId}:*`
- **Create/Update Billing**: Invalidate `finance:billing:{workspaceId}`, `finance:metrics:{workspaceId}:*`
- **Create/Update Worklog**: Invalidate `finance:worklogs:{workspaceId}`, `finance:metrics:{workspaceId}:*`

### Daily Log Mutations
- **Create/Update Log**: Invalidate `dailylog:{workspaceId}:{userId}`, `dailylog:{workspaceId}:all`

