'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/auth-context'
import { DataRefreshProvider } from '@/contexts/data-refresh-context'
import { ErrorBoundary } from '@/components/error-boundary'
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutes
        retry: 2, // Increased retry count
        refetchOnWindowFocus: true, // Enable refetch on window focus
        refetchOnMount: true, // Always refetch on mount
        refetchOnReconnect: true, // Refetch when reconnecting
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DataRefreshProvider>
            {children}
          </DataRefreshProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}
