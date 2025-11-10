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

