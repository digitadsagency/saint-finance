import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth-simple'
import { dataStore } from '@/lib/data-store'

export async function GET() {
  try {
    const workspaces = dataStore.getWorkspaces()
    return NextResponse.json(workspaces)
  } catch (error) {
    console.error('Error fetching workspaces:', error)
    return NextResponse.json(
      { error: 'Failed to fetch workspaces' },
      { status: 500 }
    )
  }
}