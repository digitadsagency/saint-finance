'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Search, ChevronDown, Check } from 'lucide-react'

interface PaymentRecordDialogProps {
  open: boolean
  onClose: () => void
  onSubmit: (data: {
    id?: string
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
  editingPayment?: any // Payment record to edit
}

export function PaymentRecordDialog({
  open,
  onClose,
  onSubmit,
  billings,
  projects,
  defaultDate,
  defaultBillingId,
  editingPayment
}: PaymentRecordDialogProps) {
  const [formData, setFormData] = useState({
    billing_id: '',
    paid_amount: '',
    paid_date: new Date().toISOString().split('T')[0],
    notes: ''
  })
  const [submitting, setSubmitting] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Actualizar el formulario cuando cambia defaultDate o defaultBillingId, o cuando se abre el diálogo
  useEffect(() => {
    if (open) {
      if (editingPayment) {
        // Modo edición: cargar datos del pago existente
        setFormData({
          billing_id: editingPayment.billing_id || '',
          paid_amount: editingPayment.paid_amount?.toString() || '',
          paid_date: editingPayment.paid_date || new Date().toISOString().split('T')[0],
          notes: editingPayment.notes || ''
        })
      } else {
        // Modo creación: usar valores por defecto
        setFormData({
          billing_id: defaultBillingId || '',
          paid_amount: '',
          paid_date: defaultDate || new Date().toISOString().split('T')[0],
          notes: ''
        })
      }
    }
  }, [open, defaultDate, defaultBillingId, editingPayment])

  const selectedBilling = billings.find(b => b.id === formData.billing_id)
  const selectedProject = projects.find(p => p.id === selectedBilling?.project_id)

  // Filtrar billings por término de búsqueda
  const filteredBillings = useMemo(() => {
    if (!searchTerm.trim()) return billings
    const term = searchTerm.toLowerCase()
    return billings.filter(billing => {
      const project = projects.find(p => p.id === billing.project_id)
      const projectName = project?.name?.toLowerCase() || ''
      return projectName.includes(term)
    })
  }, [billings, projects, searchTerm])

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedBilling) return

    setSubmitting(true)
    try {
      await onSubmit({
        id: editingPayment?.id,
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
          <DialogTitle>{editingPayment ? 'Editar Pago Recibido' : 'Registrar Pago Recibido'}</DialogTitle>
          <DialogDescription>
            {editingPayment ? 'Edita los datos del pago recibido' : 'Registra un pago recibido de un cliente'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="billing_id">Cliente</Label>
            <div className="relative" ref={dropdownRef}>
              {/* Botón que abre el dropdown */}
              <button
                type="button"
                onClick={() => {
                  setIsDropdownOpen(!isDropdownOpen)
                  if (!isDropdownOpen) {
                    setTimeout(() => inputRef.current?.focus(), 100)
                  }
                }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm border rounded-md bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <span className={selectedProject ? 'text-gray-900' : 'text-gray-500'}>
                  {selectedProject 
                    ? `${selectedProject.name} - ${selectedBilling?.monthly_amount?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}`
                    : 'Selecciona un cliente'
                  }
                </span>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown con búsqueda */}
              {isDropdownOpen && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {/* Campo de búsqueda */}
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        ref={inputRef}
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Buscar cliente..."
                        className="w-full pl-8 pr-3 py-2 text-sm border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        autoComplete="off"
                      />
                    </div>
                  </div>

                  {/* Lista de clientes */}
                  <div className="max-h-48 overflow-y-auto">
                    {filteredBillings.length === 0 ? (
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No se encontraron clientes
                      </div>
                    ) : (
                      filteredBillings.map((billing) => {
                        const project = projects.find(p => p.id === billing.project_id)
                        const isSelected = formData.billing_id === billing.id
                        return (
                          <button
                            key={billing.id}
                            type="button"
                            onClick={() => {
                              setFormData({ ...formData, billing_id: billing.id })
                              setIsDropdownOpen(false)
                              setSearchTerm('')
                            }}
                            className={`w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-blue-50 ${
                              isSelected ? 'bg-blue-100 text-blue-900' : 'text-gray-900'
                            }`}
                          >
                            <span>
                              {project?.name || 'Cliente'} - {billing.monthly_amount?.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })}
                            </span>
                            {isSelected && <Check className="h-4 w-4 text-blue-600" />}
                          </button>
                        )
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
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
              {submitting ? (editingPayment ? 'Guardando...' : 'Registrando...') : (editingPayment ? 'Guardar Cambios' : 'Registrar Pago')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

