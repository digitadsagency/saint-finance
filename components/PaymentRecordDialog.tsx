'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface PaymentRecordDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    project_id: string
    billing_id: string
    expected_amount: number
    paid_amount: number
    paid_date: string
    notes?: string
  }) => Promise<void>
  billings: any[]
  projects: any[]
  defaultDate?: string
  defaultBillingId?: string
}

export function PaymentRecordDialog({
  open,
  onClose,
  onSubmit,
  billings,
  projects,
  defaultDate,
  defaultBillingId
}: PaymentRecordDialogProps) {
  const [formData, setFormData] = useState({
    billing_id: '',
    paid_amount: '',
    paid_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)

  // Actualizar el formulario cuando cambia defaultDate o defaultBillingId, o cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      setFormData({
        billing_id: defaultBillingId || '',
        paid_amount: '',
        paid_date: defaultDate || new Date().toISOString().split('T')[0],
        notes: ''
      })
    }
  }, [open, defaultDate, defaultBillingId])

  const selectedBilling = billings.find(b => b.id === formData.billing_id)
  const selectedProject = projects.find(p => p.id === selectedBilling?.project_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBilling) return

    setSubmitting(true)
    try {
      await onSubmit({
        project_id: selectedBilling.project_id,
        billing_id: formData.billing_id,
        expected_amount: selectedBilling.monthly_amount,
        paid_amount: Number(formData.paid_amount),
        paid_date: formData.paid_date,
        notes: formData.notes
      })
      setFormData({
        billing_id: '',
        paid_amount: '',
        paid_date: new Date().toISOString().split('T')[0],
        notes: ''
      })
      onClose()
    } catch (error) {
      console.error('Error submitting payment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Registrar Pago Recibido</DialogTitle>
          <DialogDescription>
            Registra un pago recibido de un cliente
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="billing_id">Cliente</Label>
            <Select
              value={formData.billing_id}
              onValueChange={(value) => setFormData({ ...formData, billing_id: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un cliente" />
              </SelectTrigger>
              <SelectContent>
                {billings.map((billing) => {
                  const project = projects.find(p => p.id === billing.project_id)
                  return (
                    <SelectItem key={billing.id} value={billing.id}>
                      {project?.name || 'Cliente'} - {billing.monthly_amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
            {selectedBilling && (
              <p className="text-xs text-gray-500 mt-1">
                Día de pago esperado: {selectedBilling.payment_day} de cada mes
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="paid_date">Fecha de Pago</Label>
            <Input
              id="paid_date"
              type="date"
              value={formData.paid_date}
              onChange={(e) => setFormData({ ...formData, paid_date: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="paid_amount">Monto Recibido</Label>
            <Input
              id="paid_amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.paid_amount}
              onChange={(e) => setFormData({ ...formData, paid_amount: e.target.value })}
              placeholder={selectedBilling?.monthly_amount?.toString() || '0'}
              required
            />
            {selectedBilling && (
              <p className="text-xs text-gray-500 mt-1">
                Monto esperado: {selectedBilling.monthly_amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="notes">Notas (opcional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Notas adicionales sobre el pago..."
            />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || !formData.billing_id || !formData.paid_amount}>
              {submitting ? 'Registrando...' : 'Registrar Pago'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

