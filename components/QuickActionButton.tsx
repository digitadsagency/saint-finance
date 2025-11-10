'use client'

import { Button } from './ui/button'
import { CheckCircle, Clock, Play, RotateCcw } from 'lucide-react'
import { Status } from '@/lib/validation'

interface QuickActionButtonProps {
  currentStatus: Status
  onStatusChange: (newStatus: Status) => void
  disabled?: boolean
}

export function QuickActionButton({ currentStatus, onStatusChange, disabled }: QuickActionButtonProps) {
  const getNextStatus = (current: Status): Status => {
    switch (current) {
      case 'backlog': return 'todo'
      case 'todo': return 'inprogress'
      case 'inprogress': return 'review'
      case 'review': return 'done'
      case 'done': return 'backlog'
      default: return 'todo'
    }
  }

  const getButtonProps = (status: Status) => {
    switch (status) {
      case 'backlog':
        return {
          icon: <Play className="h-4 w-4" />,
          text: 'Comenzar',
          variant: 'default' as const,
          className: 'bg-blue-600 hover:bg-blue-700'
        }
      case 'todo':
        return {
          icon: <Play className="h-4 w-4" />,
          text: 'Iniciar',
          variant: 'default' as const,
          className: 'bg-green-600 hover:bg-green-700'
        }
      case 'inprogress':
        return {
          icon: <Clock className="h-4 w-4" />,
          text: 'Revisar',
          variant: 'default' as const,
          className: 'bg-yellow-600 hover:bg-yellow-700'
        }
      case 'review':
        return {
          icon: <CheckCircle className="h-4 w-4" />,
          text: 'Completar',
          variant: 'default' as const,
          className: 'bg-purple-600 hover:bg-purple-700'
        }
      case 'done':
        return {
          icon: <RotateCcw className="h-4 w-4" />,
          text: 'Reabrir',
          variant: 'outline' as const,
          className: 'border-gray-300 hover:bg-gray-50'
        }
      default:
        return {
          icon: <Play className="h-4 w-4" />,
          text: 'Comenzar',
          variant: 'default' as const,
          className: 'bg-blue-600 hover:bg-blue-700'
        }
    }
  }

  const nextStatus = getNextStatus(currentStatus)
  const buttonProps = getButtonProps(currentStatus)

  return (
    <Button
      size="sm"
      variant={buttonProps.variant}
      className={`${buttonProps.className} transition-all duration-200`}
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        console.log('QuickActionButton clicked!')
        console.log('Current status:', currentStatus)
        console.log('Next status:', nextStatus)
        console.log('Button props:', buttonProps)
        onStatusChange(nextStatus)
        // Remove the alert to avoid interrupting the user experience
        console.log(`🚀 Status changed from "${currentStatus}" to "${nextStatus}"`)
      }}
      disabled={disabled}
    >
      {buttonProps.icon}
      <span className="ml-1">{buttonProps.text}</span>
    </Button>
  )
}