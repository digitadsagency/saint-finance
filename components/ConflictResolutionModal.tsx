'use client'

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

interface ConflictResolutionModalProps {
  open: boolean
  onClose: () => void
  onRefreshAndApply: () => void
  onDiscard: () => void
  resourceName?: string
  serverState?: any
  userChanges?: any
}

export function ConflictResolutionModal({
  open,
  onClose,
  onRefreshAndApply,
  onDiscard,
  resourceName = 'Esta tarea',
  serverState,
  userChanges,
}: ConflictResolutionModalProps) {
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
            <DialogTitle>Conflicto de concurrencia</DialogTitle>
          </div>
          <DialogDescription>
            {resourceName} cambió mientras la estabas editando. ¿Cómo quieres proceder?
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {serverState && (
            <div className="rounded bg-gray-50 p-3 text-sm">
              <div className="font-medium mb-1 text-gray-700">Estado actual en el servidor:</div>
              <pre className="text-xs text-gray-600 overflow-auto max-h-32">
                {JSON.stringify(serverState, null, 2)}
              </pre>
            </div>
          )}
          {userChanges && (
            <div className="rounded bg-blue-50 p-3 text-sm">
              <div className="font-medium mb-1 text-blue-700">Tus cambios:</div>
              <pre className="text-xs text-blue-600 overflow-auto max-h-32">
                {JSON.stringify(userChanges, null, 2)}
              </pre>
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onDiscard}>
              Descartar mis cambios
            </Button>
            <Button onClick={onRefreshAndApply}>
              Refrescar y aplicar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

