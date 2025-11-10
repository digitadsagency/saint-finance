'use client'

import { memo } from 'react'
import { Loader2, RefreshCw } from 'lucide-react'

interface OptimizedLoadingProps {
  size?: 'sm' | 'md' | 'lg'
  text?: string
  variant?: 'spinner' | 'dots' | 'pulse'
  className?: string
}

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8'
}

export const OptimizedLoading = memo(function OptimizedLoading({
  size = 'md',
  text = 'Cargando...',
  variant = 'spinner',
  className = ''
}: OptimizedLoadingProps) {
  const iconSize = sizeClasses[size]

  if (variant === 'dots') {
    return (
      <div className={`flex items-center justify-center space-x-1 ${className}`}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></div>
        </div>
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    )
  }

  if (variant === 'pulse') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse [animation-delay:0.2s]"></div>
          <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse [animation-delay:0.4s]"></div>
        </div>
        {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
      </div>
    )
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${iconSize} animate-spin text-blue-600`} />
      {text && <span className="ml-2 text-sm text-gray-600">{text}</span>}
    </div>
  )
})

// Pre-configured loading components
export const PageLoading = memo(function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <OptimizedLoading size="lg" text="Cargando página..." />
      </div>
    </div>
  )
})

export const DataLoading = memo(function DataLoading() {
  return (
    <div className="flex items-center justify-center h-64">
      <OptimizedLoading size="md" text="Cargando datos..." variant="dots" />
    </div>
  )
})

export const CardLoading = memo(function CardLoading() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <OptimizedLoading size="sm" text="Cargando..." variant="pulse" />
    </div>
  )
})

export const ButtonLoading = memo(function ButtonLoading({ text = 'Procesando...' }: { text?: string }) {
  return (
    <div className="flex items-center">
      <RefreshCw className="h-4 w-4 animate-spin mr-2" />
      <span>{text}</span>
    </div>
  )
})
