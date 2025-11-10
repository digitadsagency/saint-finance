import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser, createToken, setAuthCookie } from '@/lib/auth-simple'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email y contraseña son requeridos' },
        { status: 400 }
      )
    }

    const user = await authenticateUser(email, password)
    
    if (!user) {
      return NextResponse.json(
        { error: 'Credenciales inválidas' },
        { status: 401 }
      )
    }

    const token = createToken(user)
    const cookie = setAuthCookie(token)

    return NextResponse.json(
      { 
        user,
        message: 'Inicio de sesión exitoso' 
      },
      { 
        status: 200,
        headers: {
          'Set-Cookie': cookie
        }
      }
    )
  } catch (error) {
    console.error('Error en login:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
