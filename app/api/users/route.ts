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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role = 'member', avatar = '👨‍💼' } = body

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Nombre y email son requeridos' },
        { status: 400 }
      )
    }

    const newUser = await UsersService.createUser({
      name,
      email,
      password: password || 'password123',
      role,
      avatar
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create user' },
      { status: 500 }
    )
  }
}
