'use client'

import { createContext, useContext, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'

interface DataRefreshContextType {
  refreshData: (queryKeys?: string[][]) => Promise<void>
  invalidateQueries: (queryKeys: string[][]) => void
  refetchQueries: (queryKeys: string[][]) => Promise<void>
}

const DataRefreshContext = createContext<DataRefreshContextType | undefined>(undefined)

export function DataRefreshProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()

  const invalidateQueries = useCallback((queryKeys: string[][]) => {
    queryKeys.forEach(queryKey => {
      queryClient.invalidateQueries({ queryKey })
    })
  }, [queryClient])

  const refetchQueries = useCallback(async (queryKeys: string[][]) => {
    await Promise.all(
      queryKeys.map(queryKey => 
        queryClient.refetchQueries({ queryKey })
      )
    )
  }, [queryClient])

  const refreshData = useCallback(async (queryKeys?: string[][]) => {
    try {
      if (queryKeys) {
        await refetchQueries(queryKeys)
      } else {
        // Refresh all queries
        await queryClient.refetchQueries()
      }
    } catch (error) {
      console.error('Error refreshing data:', error)
    }
  }, [queryClient, refetchQueries])

  return (
    <DataRefreshContext.Provider value={{ 
      refreshData, 
      invalidateQueries, 
      refetchQueries 
    }}>
      {children}
    </DataRefreshContext.Provider>
  )
}

export function useDataRefresh() {
  const context = useContext(DataRefreshContext)
  if (context === undefined) {
    throw new Error('useDataRefresh must be used within a DataRefreshProvider')
  }
  return context
}



