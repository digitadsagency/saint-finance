import { render, screen } from '@testing-library/react'
import { TaskCard } from '@/components/TaskCard'
import { Task } from '@/lib/validation'

const mockTask: Task = {
  id: '1',
  project_id: 'project-1',
  title: 'Test Task',
  description_md: 'Test description',
  priority: 'high',
  status: 'todo',
  assignee_id: 'user-1',
  reporter_id: 'user-2',
  due_date: '2024-01-15',
  estimate_hours: 4,
  created_at: '2024-01-01T10:00:00Z',
  updated_at: '2024-01-01T10:00:00Z',
  version: 1,
  labels_csv: 'test, example'
}

describe('TaskCard', () => {
  it('renders task title', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test Task')).toBeInTheDocument()
  })

  it('renders task description', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('Test description')).toBeInTheDocument()
  })

  it('renders priority badge', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('high')).toBeInTheDocument()
  })

  it('renders labels', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('test')).toBeInTheDocument()
    expect(screen.getByText('example')).toBeInTheDocument()
  })

  it('renders due date', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('15/1/2024')).toBeInTheDocument()
  })

  it('renders estimate hours', () => {
    render(<TaskCard task={mockTask} />)
    expect(screen.getByText('4h')).toBeInTheDocument()
  })
})
