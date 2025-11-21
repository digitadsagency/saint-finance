import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'
import { getSheetsClient } from '@/lib/sheets/client'

function isAdminUser(userNameOrUsername?: string) {
  const v = (userNameOrUsername || '').toLowerCase()
  return v === 'miguel' || v === 'raul'
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const records = await FinanceService.listSalaries(workspaceId)
    return NextResponse.json(records)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch salaries' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    // Basic admin check using provided current_user_name (from client) for now
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const record = await FinanceService.createSalary({
      workspace_id: body.workspace_id,
      user_id: body.user_id,
      monthly_salary: Number(body.monthly_salary),
      effective_month: '', // Ya no se usa, pero mantenemos compatibilidad
      notes: body.notes
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create salary' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'Salary id is required' }, { status: 400 })
    }

    const record = await FinanceService.updateSalary(body.id, {
      user_id: body.user_id,
      monthly_salary: body.monthly_salary ? Number(body.monthly_salary) : undefined,
      effective_month: body.effective_month,
      notes: body.notes
    })
    return NextResponse.json(record)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update salary' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const currentUser = searchParams.get('current_user') || undefined

    if (!id) {
      return NextResponse.json({ error: 'Salary id is required' }, { status: 400 })
    }

    if (!isAdminUser(currentUser)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    await FinanceService.deleteSalary(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete salary' }, { status: 500 })
  }
}


