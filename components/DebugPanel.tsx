'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { X, CheckCircle, AlertCircle } from 'lucide-react'

interface DebugPanelProps {
  isOpen: boolean
  onClose: () => void
}

export function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [buttonTests, setButtonTests] = useState<Record<string, boolean>>({})

  const testButton = (buttonName: string) => {
    setButtonTests(prev => ({
      ...prev,
      [buttonName]: true
    }))
    console.log(`✅ Button "${buttonName}" clicked successfully!`)
  }

  if (!isOpen) return null

  return (
    <div className="fixed top-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-900">Debug Panel</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-3">
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test Buttons</h4>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => testButton('Quick Action')}
              className="w-full"
            >
              Test Quick Action
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => testButton('Priority Change')}
              className="w-full"
            >
              Test Priority Change
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => testButton('Status Change')}
              className="w-full"
            >
              Test Status Change
            </Button>
            
            <Button
              size="sm"
              variant="outline"
              onClick={() => testButton('Create Task')}
              className="w-full"
            >
              Test Create Task
            </Button>
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-2">Test Results</h4>
          <div className="space-y-1">
            {Object.entries(buttonTests).map(([buttonName, success]) => (
              <div key={buttonName} className="flex items-center space-x-2">
                {success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-gray-400" />
                )}
                <span className="text-xs">{buttonName}</span>
                {success && <Badge variant="secondary" className="text-xs">✓</Badge>}
              </div>
            ))}
          </div>
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-gray-500">
            Open browser console to see button click logs
          </p>
        </div>
      </div>
    </div>
  )
}
