'use client'

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load heavy components
export const LazyKanbanBoard = lazy(() => import('./KanbanBoard').then(module => ({ default: module.KanbanBoard })))
export const LazyTaskDrawer = lazy(() => import('./TaskDrawer').then(module => ({ default: module.TaskDrawer })))
export const LazyInteractiveModal = lazy(() => import('./InteractiveModal').then(module => ({ default: module.InteractiveModal })))
export const LazyProjectCreationModal = lazy(() => import('./ProjectCreationModal').then(module => ({ default: module.ClientCreationModal })))
export const LazyTeamEfficiencyWidget = lazy(() => import('./TeamEfficiencyWidget').then(module => ({ default: module.TeamEfficiencyWidget })))

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
    <span className="ml-2 text-sm text-gray-600">Cargando...</span>
  </div>
)

// Wrapper component with Suspense
export function withLazyLoading<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: React.ReactNode
) {
  return function LazyWrapper(props: T) {
    return (
      <Suspense fallback={fallback || <LoadingSpinner />}>
        <Component {...props} />
      </Suspense>
    )
  }
}

// Pre-configured lazy components with loading states
export const KanbanBoardLazy = withLazyLoading(LazyKanbanBoard)
export const TaskDrawerLazy = withLazyLoading(LazyTaskDrawer)
export const InteractiveModalLazy = withLazyLoading(LazyInteractiveModal)
export const ProjectCreationModalLazy = withLazyLoading(LazyProjectCreationModal)
export const TeamEfficiencyWidgetLazy = withLazyLoading(LazyTeamEfficiencyWidget)
