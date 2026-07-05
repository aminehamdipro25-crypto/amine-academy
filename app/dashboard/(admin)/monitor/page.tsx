'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ChevronDown, ChevronUp, RefreshCw, ShieldAlert } from 'lucide-react'
import { staggerContainer, fadeUp, popIn } from '@/lib/motion'
import type { ErrorEvent } from '@/lib/error-monitor'

function formatTs(iso: string): string {
  try {
    const d = new Date(iso)
    return d.toLocaleString('fr-FR', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    })
  } catch { return iso }
}

function LevelBadge({ level }: { level: 'error' | 'warning' }) {
  if (level === 'error') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
        خطأ
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200">
      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
      تحذير
    </span>
  )
}

function ErrorCard({ event }: { event: ErrorEvent }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div
      variants={popIn}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
    >
      {/* Main row */}
      <div className="p-4 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <LevelBadge level={event.level} />
            {event.role && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand-50 text-brand-700 border border-brand-100">
                {event.role}
              </span>
            )}
            {event.userId && (
              <span className="text-xs text-gray-400 font-mono">{event.userId}</span>
            )}
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 ltr-num">
            {formatTs(event.ts)}
          </span>
        </div>

        <p className="text-sm font-semibold text-gray-800 leading-relaxed break-words">
          {event.message}
        </p>

        {event.url && (
          <p className="text-xs text-gray-400 break-all font-mono leading-relaxed">
            {event.url}
          </p>
        )}

        {event.stack && (
          <button
            onClick={() => setExpanded(v => !v)}
            className="self-start flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium transition-colors mt-1"
          >
            {expanded ? (
              <>
                <ChevronUp className="w-3.5 h-3.5" />
                إخفاء Stack Trace
              </>
            ) : (
              <>
                <ChevronDown className="w-3.5 h-3.5" />
                عرض Stack Trace
              </>
            )}
          </button>
        )}
      </div>

      {/* Stack trace */}
      <AnimatePresence>
        {expanded && event.stack && (
          <motion.div
            key="stack"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-gray-100 bg-gray-50 px-4 py-3">
              <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words font-mono leading-relaxed overflow-x-auto">
                {event.stack}
              </pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function MonitorPage() {
  const [errors, setErrors]     = useState<ErrorEvent[]>([])
  const [loading, setLoading]   = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const fetchErrors = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/monitor/error')
      if (res.ok) {
        const data = await res.json()
        setErrors(Array.isArray(data.errors) ? data.errors : [])
        setLastRefresh(new Date())
      }
    } catch { /* silent */ } finally {
      setLoading(false)
    }
  }, [])

  // Initial fetch
  useEffect(() => {
    fetchErrors()
  }, [fetchErrors])

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const id = setInterval(fetchErrors, 60_000)
    return () => clearInterval(id)
  }, [fetchErrors])

  const errorCount   = errors.filter(e => e.level === 'error').length
  const warningCount = errors.filter(e => e.level === 'warning').length

  return (
    <motion.div
      className="space-y-6"
      variants={staggerContainer}
      initial="hidden"
      animate="show"
    >
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <span className="text-xl">🔴</span>
            <ShieldAlert className="w-6 h-6 text-red-500" />
            مراقبة الأخطاء
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            آخر {errors.length} حدث · يتجدد تلقائياً كل 60 ثانية
            {lastRefresh && (
              <span className="mr-2 ltr-num">
                · آخر تحديث: {lastRefresh.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        </div>

        <button
          onClick={fetchErrors}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-medium text-gray-700 hover:border-brand-300 hover:text-brand-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </motion.div>

      {/* Summary chips */}
      {errors.length > 0 && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-50 border border-red-200 text-sm font-semibold text-red-700">
            <AlertCircle className="w-4 h-4" />
            <span className="ltr-num">{errorCount}</span>
            <span>خطأ</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-sm font-semibold text-amber-700">
            <AlertCircle className="w-4 h-4" />
            <span className="ltr-num">{warningCount}</span>
            <span>تحذير</span>
          </div>
        </motion.div>
      )}

      {/* Loading skeleton */}
      {loading && errors.length === 0 && (
        <motion.div variants={fadeUp} className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-24 rounded-2xl bg-gray-100 animate-pulse" />
          ))}
        </motion.div>
      )}

      {/* Empty state */}
      {!loading && errors.length === 0 && (
        <motion.div
          variants={fadeUp}
          className="flex flex-col items-center justify-center gap-4 py-20 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-green-50 border border-green-100 flex items-center justify-center">
            <span className="text-3xl">✅</span>
          </div>
          <p className="text-gray-500 font-medium text-lg">لا توجد أخطاء مسجلة</p>
          <p className="text-gray-400 text-sm">سيظهر هنا أي خطأ يُبلَّغ عنه من واجهة المستخدم أو السيرفر</p>
        </motion.div>
      )}

      {/* Error list */}
      {errors.length > 0 && (
        <motion.div className="space-y-3" variants={staggerContainer}>
          {errors.map(event => (
            <ErrorCard key={event.id} event={event} />
          ))}
        </motion.div>
      )}
    </motion.div>
  )
}
