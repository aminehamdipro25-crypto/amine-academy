'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeUp } from '@/lib/motion'
import type { AuditEntry } from '@/lib/audit'

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  login:               { label: 'تسجيل دخول',     color: '#2563EB' },
  logout:              { label: 'تسجيل خروج',     color: '#6B7280' },
  register:            { label: 'تسجيل جديد',      color: '#7C5CFC' },
  session_save:        { label: 'حفظ جلسة',        color: '#16A34A' },
  session_view:        { label: 'عرض جلسة',        color: '#0891B2' },
  report_view:         { label: 'عرض تقرير',       color: '#0891B2' },
  client_view:         { label: 'عرض ملف عميل',   color: '#0891B2' },
  data_export:         { label: 'تصدير بيانات',    color: '#D97706' },
  account_delete:      { label: 'حذف حساب',        color: '#DC2626' },
  password_reset:      { label: 'إعادة كلمة مرور', color: '#D97706' },
  impersonate:         { label: 'انتحال هوية',      color: '#9333EA' },
  treatment_plan_save: { label: 'حفظ خطة علاج',   color: '#16A34A' },
}

export default function AuditPage() {
  const [log, setLog]         = useState<AuditEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter]   = useState<string>('الكل')

  useEffect(() => {
    fetch('/api/monitor/audit')
      .then(r => r.json())
      .then(d => setLog(d.log ?? []))
      .finally(() => setLoading(false))
  }, [])

  const actions = ['الكل', ...Object.keys(ACTION_LABELS)]
  const filtered = filter === 'الكل' ? log : log.filter(e => e.action === filter)

  return (
    <div className="p-6 max-w-5xl mx-auto" dir="rtl">
      <motion.div {...fadeUp} className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">📋 سجل المراجعة (Audit Log)</h1>
        <p className="text-gray-500 text-sm mt-1">جميع العمليات الحساسة مسجلة — 90 يوماً، آخر 2000 حدث</p>
      </motion.div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mb-5">
        {actions.map(a => (
          <button
            key={a}
            onClick={() => setFilter(a)}
            className={`text-xs font-bold px-3 py-1.5 rounded-full border transition-all ${
              filter === a
                ? 'bg-brand-600 text-white border-brand-600'
                : 'bg-white text-gray-500 border-gray-200 hover:border-brand-300'
            }`}
          >
            {a === 'الكل' ? 'الكل' : ACTION_LABELS[a]?.label ?? a}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-14 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-4xl mb-3">✅</div>
          <p className="text-gray-400 font-bold">لا توجد أحداث مسجلة</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(entry => {
            const meta = ACTION_LABELS[entry.action] ?? { label: entry.action, color: '#6B7280' }
            return (
              <div
                key={entry.id}
                className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-4 shadow-sm"
              >
                <span
                  className="text-[10px] font-black px-2 py-1 rounded-full whitespace-nowrap flex-shrink-0"
                  style={{ background: meta.color + '18', color: meta.color }}
                >
                  {meta.label}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-gray-700 font-medium truncate">
                    {entry.actorRole} <span className="text-gray-400">·</span> {entry.actorId}
                    {entry.targetId && <> <span className="text-gray-400">→</span> {entry.targetId}</>}
                  </div>
                  {entry.ip && (
                    <div className="text-[10px] text-gray-400 mt-0.5">IP: {entry.ip}</div>
                  )}
                </div>
                <div className="text-[10px] text-gray-400 flex-shrink-0 ltr-num">
                  {new Date(entry.ts).toLocaleString('ar-SA')}
                </div>
              </div>
            )
          })}
        </div>
      )}

      <p className="text-center text-xs text-gray-300 mt-6">
        {filtered.length} حدث · يُحدَّث تلقائياً عند كل زيارة
      </p>
    </div>
  )
}
