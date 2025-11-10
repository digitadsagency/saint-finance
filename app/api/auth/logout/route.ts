import { NextResponse } from 'next/server'
import { clearAuthCookie } from '@/lib/auth-simple'

export async function POST() {
  try {
    const cookie = clearAuthCookie()

    return NextResponse.json(
      { message: 'Cierre de sesión exitoso' },
      { 
        status: 200,
        headers: {
          'Set-Cookie': cookie
        }
      }
    )
  } catch (error) {
    console.error('Error en logout:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
