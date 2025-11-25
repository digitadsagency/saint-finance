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
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const records = await FinanceService.listClientBilling(workspaceId)
    return NextResponse.json(records)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch client billing' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const record = await FinanceService.createClientBilling({
      workspace_id: body.workspace_id,
      project_id: body.project_id,
      monthly_amount: Number(body.monthly_amount),
      payment_day: Number(body.payment_day)
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create client billing' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    if (!isAdminUser(body.current_user)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (!body.id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const record = await FinanceService.updateClientBilling(body.id, {
      monthly_amount: body.monthly_amount !== undefined ? Number(body.monthly_amount) : undefined,
      payment_day: body.payment_day !== undefined ? Number(body.payment_day) : undefined
    })
    return NextResponse.json(record)
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed to update client billing' }, { status: 500 })
  }
}


