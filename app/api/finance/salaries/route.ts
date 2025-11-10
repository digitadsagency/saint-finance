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


