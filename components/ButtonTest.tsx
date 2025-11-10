'use client'

import { useState } from 'react'
import { Button } from './ui/button'
import { Badge } from './ui/badge'

export function ButtonTest() {
  const [clickCount, setClickCount] = useState(0)
  const [lastClicked, setLastClicked] = useState<string>('')

  const handleClick = (buttonName: string) => {
    setClickCount(prev => prev + 1)
    setLastClicked(buttonName)
    console.log(`✅ Button "${buttonName}" clicked! Count: ${clickCount + 1}`)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-white border rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="font-semibold text-gray-900 mb-3">Button Test Panel</h3>
      
      <div className="space-y-2 mb-3">
        <Button
          onClick={() => handleClick('Test Button 1')}
          className="w-full"
        >
          Test Button 1
        </Button>
        
        <Button
          variant="outline"
          onClick={() => handleClick('Test Button 2')}
          className="w-full"
        >
          Test Button 2
        </Button>
        
        <Badge
          className="cursor-pointer hover:opacity-80"
          onClick={() => handleClick('Test Badge')}
        >
          Test Badge
        </Badge>
      </div>

      <div className="text-xs text-gray-600">
        <p>Total clicks: {clickCount}</p>
        <p>Last clicked: {lastClicked || 'None'}</p>
      </div>
    </div>
  )
}
