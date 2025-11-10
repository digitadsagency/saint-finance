'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ProjectPage({ params }: { params: { id: string; projectId: string } }) {
  const router = useRouter()

  useEffect(() => {
    // Redirect to ClickUp list view by default
    router.replace(`/workspaces/${params.id}/projects/${params.projectId}/clickup-list`)
  }, [router, params.id, params.projectId])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
    </div>
  )
}
