import { NextRequest, NextResponse } from 'next/server'
import { FinanceService } from '@/lib/services/finance'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const workspaceId = searchParams.get('workspaceId') || 'demo'
    const records = await FinanceService.listWorklogs(workspaceId)
    return NextResponse.json(records)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch worklogs' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const record = await FinanceService.createWorklog({
      workspace_id: body.workspace_id,
      user_id: body.user_id,
      project_id: body.project_id,
      type: body.type,
      hours: Number(body.hours),
      date: body.date,
      notes: body.notes
    })
    return NextResponse.json(record, { status: 201 })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to create worklog' }, { status: 500 })
  }
}


