import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'

function isAdminUser(userNameOrUsername?: string | { name?: string; username?: string }) {
  if (!userNameOrUsername) return false
  const v = typeof userNameOrUsername === 'string' 
    ? userNameOrUsername.toLowerCase() 
    : (userNameOrUsername.name || userNameOrUsername.username || '').toLowerCase()
  return v === 'miguel' || v === 'raul'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const records = await FinanceService.listIncomes(workspaceId)
    return NextResponse.json(records)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch incomes' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const record = await FinanceService.createIncome({
      workspace_id: body.workspace_id,
      description: body.description,
      amount: Number(body.amount),
      date: body.date,
      project_id: body.project_id,
      notes: body.notes
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create income' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Income id is required' }, { status: 400 })
    }

    const record = await FinanceService.updateIncome(body.id, {
      description: body.description,
      amount: body.amount ? Number(body.amount) : undefined,
      date: body.date,
      project_id: body.project_id,
      notes: body.notes
    })
    return NextResponse.json(record)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update income' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const currentUser = searchParams.get('current_user') || undefined

    if (!id) {
      return NextResponse.json({ error: 'Income id is required' }, { status: 400 })
    }

    if (!isAdminUser(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await FinanceService.deleteIncome(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete income' }, { status: 500 })
  }
}

