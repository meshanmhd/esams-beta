'use client'

import { useEffect, useState } from 'react'

interface PerformanceMonitorProps {
  name: string
  onLoadComplete?: (duration: number) => void
}

export function PerformanceMonitor({ name, onLoadComplete }: PerformanceMonitorProps) {
  const [startTime] = useState(() => performance.now())

  useEffect(() => {
    const endTime = performance.now()
    const duration = endTime - startTime
    
    if (onLoadComplete) {
      onLoadComplete(duration)
    }

    // Log performance in development
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} loaded in ${duration.toFixed(2)}ms`)
    }
  }, [name, startTime, onLoadComplete])

  return null
}

// Hook for measuring performance
export function usePerformanceMeasure(name: string) {
  const [startTime] = useState(() => performance.now())
  const [duration, setDuration] = useState<number | null>(null)

  const endMeasure = () => {
    const endTime = performance.now()
    const measuredDuration = endTime - startTime
    setDuration(measuredDuration)
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} completed in ${measuredDuration.toFixed(2)}ms`)
    }
    
    return measuredDuration
  }

  return { duration, endMeasure }
}


