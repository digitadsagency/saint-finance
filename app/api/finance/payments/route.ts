import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'

function isAdminUser(user: any): boolean {
  if (!user) return false
  // Accept both object {name, username} and string
  const name = typeof user === 'string' 
    ? user.toLowerCase()
    : (user.name || user.username || '').toLowerCase()
  return name === 'miguel' || name === 'raul'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId')
    const month = searchParams.get('month') || undefined

    if (!workspaceId) {
      return NextResponse.json({ error: 'workspaceId is required' }, { status: 400 })
    }

    const records = await FinanceService.listPaymentRecords(workspaceId, month)
    return NextResponse.json(records)
  } catch (e) {
    console.error('Error fetching payment records:', e)
    return NextResponse.json({ error: 'Failed to fetch payment records' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Calculate expected_date from billing record's payment_day
    const billingRecords = await FinanceService.listClientBilling(body.workspace_id)
    const billing = billingRecords.find(b => b.id === body.billing_id)
    
    if (!billing) {
      return NextResponse.json({ error: 'Billing record not found' }, { status: 404 })
    }

    // Calculate expected date for the month/year
    const paidDate = new Date(body.paid_date)
    const expectedDate = new Date(paidDate.getFullYear(), paidDate.getMonth(), billing.payment_day)
    
    const record = await FinanceService.createPaymentRecord({
      workspace_id: body.workspace_id,
      project_id: body.project_id,
      billing_id: body.billing_id,
      expected_amount: Number(body.expected_amount || billing.monthly_amount),
      paid_amount: Number(body.paid_amount),
      expected_date: expectedDate.toISOString().split('T')[0],
      paid_date: body.paid_date,
      notes: body.notes || ''
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    console.error('Error creating payment record:', e)
    return NextResponse.json({ error: 'Failed to create payment record' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Payment record id is required' }, { status: 400 })
    }

    // Calculate expected_date from billing record's payment_day if billing_id is provided
    let expectedDate = body.expected_date
    if (body.billing_id) {
      const billingRecords = await FinanceService.listClientBilling(body.workspace_id)
      const billing = billingRecords.find(b => b.id === body.billing_id)
      if (billing && body.paid_date) {
        const paidDate = new Date(body.paid_date)
        expectedDate = new Date(paidDate.getFullYear(), paidDate.getMonth(), billing.payment_day).toISOString().split('T')[0]
      }
    }

    const updateData: any = {}
    if (body.project_id) updateData.project_id = body.project_id
    if (body.billing_id) updateData.billing_id = body.billing_id
    if (body.expected_amount !== undefined) updateData.expected_amount = Number(body.expected_amount)
    if (body.paid_amount !== undefined) updateData.paid_amount = Number(body.paid_amount)
    if (expectedDate) updateData.expected_date = expectedDate
    if (body.paid_date) updateData.paid_date = body.paid_date
    if (body.notes !== undefined) updateData.notes = body.notes

    const record = await FinanceService.updatePaymentRecord(body.id, updateData)
    return NextResponse.json(record)
  } catch (e) {
    console.error('Error updating payment record:', e)
    return NextResponse.json({ error: 'Failed to update payment record' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const currentUser = searchParams.get('current_user')

    if (!id) {
      return NextResponse.json({ error: 'Payment record id is required' }, { status: 400 })
    }

    if (!isAdminUser(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await FinanceService.deletePaymentRecord(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('Error deleting payment record:', e)
    return NextResponse.json({ error: 'Failed to delete payment record' }, { status: 500 })
  }
}

