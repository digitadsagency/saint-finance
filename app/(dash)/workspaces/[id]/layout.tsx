'use client'

import { Sidebar } from '@/components/Sidebar'

export default function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar workspaceId={params.id} />
      <div className="flex-1 main-content ml-64 overflow-y-auto transition-all duration-300">
        {children}
      </div>
    </div>
  )
}
