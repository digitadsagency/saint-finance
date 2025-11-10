'use client'

import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

export default function SignUpPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleGoogleSignUp = async () => {
    setLoading(true)
    try {
      await signIn('google', { callbackUrl: '/workspaces' })
    } catch (error) {
      console.error('Error signing up:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            Únete a MiniMonday
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Crea tu cuenta para empezar a gestionar proyectos
          </p>
        </div>
        
        <div className="mt-8 space-y-6">
          <Button
            onClick={handleGoogleSignUp}
            disabled={loading}
            className="w-full"
            size="lg"
          >
            {loading ? 'Creando cuenta...' : 'Registrarse con Google'}
          </Button>
          
          <p className="text-center text-sm text-gray-600">
            ¿Ya tienes cuenta?{' '}
            <button
              onClick={() => router.push('/sign-in')}
              className="font-medium text-blue-600 hover:text-blue-500"
            >
              Inicia sesión
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
