import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDataRefresh } from '@/contexts/data-refresh-context'

export function useNavigationRefresh() {
  const router = useRouter()
  const { refreshData } = useDataRefresh()

  useEffect(() => {
    // Refresh data when the component mounts (navigation)
    refreshData()
  }, [refreshData])

  return { refreshData }
}
