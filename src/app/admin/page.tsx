'use client'

import { useAuth } from '@/contexts/auth-context'
import { AdminDashboard } from '@/components/admin-dashboard'
import { AdminLayout } from '@/components/admin-layout'

export default function AdminPage() {
  const { user, profile, loading } = useAuth()

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  if (!user || profile?.role !== 'admin') {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-black mb-4">Access Denied</h1>
            <p className="text-gray-600">You don't have permission to access this page.</p>
          </div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <AdminDashboard />
    </AdminLayout>
  )
}
