'use client'

import { AdminSidebar } from './admin-sidebar'
import { useNavigationRefresh } from '@/hooks/useNavigationRefresh'

interface AdminLayoutProps {
  children: React.ReactNode
}

export function AdminLayout({ children }: AdminLayoutProps) {
  // Automatically refresh data when navigating between pages
  useNavigationRefresh()

  return (
    <div className="min-h-screen bg-white">
      <AdminSidebar />
      <div className="lg:pl-64">
        <main className="py-6 min-h-screen">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
