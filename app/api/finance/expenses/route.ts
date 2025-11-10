import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'

function isAdminUser(userNameOrUsername?: string) {
  const v = (userNameOrUsername || '').toLowerCase()
  return v === 'miguel' || v === 'raul'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const records = await FinanceService.listExpenses(workspaceId)
    return NextResponse.json(records)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Basic admin check using provided current_user_name (from client) for now
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const record = await FinanceService.createExpense({
      workspace_id: body.workspace_id,
      description: body.description,
      amount: Number(body.amount),
      expense_type: body.expense_type || 'variable',
      date: body.date,
      is_installment: body.is_installment === true || body.is_installment === 'true',
      installment_months: body.installment_months ? Number(body.installment_months) : undefined,
      notes: body.notes
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create expense' }, { status: 500 })
  }
}

