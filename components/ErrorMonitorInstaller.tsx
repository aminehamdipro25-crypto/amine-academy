'use client'
import { useEffect } from 'react'
import { installGlobalErrorHandlers } from '@/lib/client-error-monitor'

export default function ErrorMonitorInstaller() {
  useEffect(() => {
    installGlobalErrorHandlers()
  }, [])
  return null
}
