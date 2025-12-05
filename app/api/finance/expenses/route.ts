import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'

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

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Expense id is required' }, { status: 400 })
    }

    const record = await FinanceService.updateExpense(body.id, {
      description: body.description,
      amount: body.amount ? Number(body.amount) : undefined,
      expense_type: body.expense_type,
      date: body.date,
      is_installment: body.is_installment === true || body.is_installment === 'true',
      installment_months: body.installment_months ? Number(body.installment_months) : undefined,
      notes: body.notes
    })
    return NextResponse.json(record)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update expense' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const currentUser = searchParams.get('current_user') || undefined

    if (!id) {
      return NextResponse.json({ error: 'Expense id is required' }, { status: 400 })
    }

    await FinanceService.deleteExpense(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete expense' }, { status: 500 })
  }
}

