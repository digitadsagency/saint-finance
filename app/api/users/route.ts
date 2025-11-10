import { NextRequest, NextResponse } from 'next/server'
import { UsersService } from '@/lib/services/users'

export async function GET(request: NextRequest) {
  try {
    const users = await UsersService.getAllUsers()
    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}
