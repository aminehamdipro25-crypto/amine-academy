'use client'
import { useState, useEffect } from 'react'
import type { LearningDifficultyProfile } from '@/lib/types'
import Link from 'next/link'

const SEVERITY_COLORS: Record<string, string> = {
  none: 'text-green-400 bg-green-900/20',
  mild: 'text-amber-400 bg-amber-900/20',
  moderate: 'text-orange-400 bg-orange-900/20',
  severe: 'text-red-400 bg-red-900/20',
}
const SEVERITY_LABELS: Record<string, string> = {
  none: 'طبيعي', mild: 'خفيف', moderate: 'متوسط', severe: 'شديد',
}

const LD_DOMAINS = [
  { key: 'dyslexia',       label: 'عسر القراءة',      emoji: '📖' },
  { key: 'dyscalculia',    label: 'عسر الحساب',       emoji: '🔢' },
  { key: 'dysgraphia',     label: 'عسر الكتابة',      emoji: '✍️' },
  { key: 'workingMemory',  label: 'ذاكرة العمل',      emoji: '🧩' },
  { key: 'processingSpeed',label: 'سرعة المعالجة',    emoji: '⏱️' },
]

export default function LearningDifficultiesPage() {
  const [profiles, setProfiles] = useState<LearningDifficultyProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    // Load profiles via admin clients list
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(async ({ parents }) => {
        if (!parents) { setLoading(false); return }
        const profileRequests = parents.flatMap((p: { children?: { id: string }[] }) =>
          (p.children || []).map((s: { id: string }) =>
            fetch(`/api/learning-difficulties?studentId=${s.id}`)
              .then(r => r.json())
              .then(({ profile }) => profile)
              .catch(() => null)
          )
        )
        const allProfiles = (await Promise.all(profileRequests)).filter(Boolean)
        setProfiles(allProfiles)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])

  const filtered = profiles.filter(p =>
    !search || p.studentId.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-gray-900">صعوبات التعلم</h1>
          <p className="text-gray-500 mt-1">ملفات صعوبات التعلم الشاملة للطلاب</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="بحث..."
            className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-5 gap-4 mb-8">
        {LD_DOMAINS.map(d => {
          const affected = profiles.filter(p => {
            const domain = p[d.key as keyof LearningDifficultyProfile] as { severity: string } | undefined
            return domain && domain.severity !== 'none'
          }).length
          return (
            <div key={d.key} className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm text-center">
              <div className="text-3xl mb-2">{d.emoji}</div>
              <div className="text-2xl font-black text-gray-900">{affected}</div>
              <div className="text-xs text-gray-500 mt-1">{d.label}</div>
            </div>
          )
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-4">📊</div>
          <p>لا توجد ملفات صعوبات تعلم حتى الآن.</p>
          <p className="text-sm mt-2">أجر تقييم صعوبات التعلم خلال الجلسة لإنشاء ملفات.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-gray-900">طالب #{p.studentId.slice(-6)}</h3>
                  <p className="text-gray-400 text-sm">آخر تحديث: {new Date(p.updatedAt).toLocaleDateString('ar')}</p>
                </div>
                <Link href={`/dashboard/clients/${p.studentId}`}
                  className="text-brand-600 text-sm font-bold hover:underline">
                  عرض الملف
                </Link>
              </div>

              <div className="grid grid-cols-5 gap-3">
                {LD_DOMAINS.map(d => {
                  const domain = p[d.key as keyof LearningDifficultyProfile] as { severity: string; indicators: string[] }
                  const sev = domain?.severity || 'none'
                  return (
                    <div key={d.key} className={`rounded-xl p-3 text-center ${SEVERITY_COLORS[sev]}`}>
                      <div className="text-2xl mb-1">{d.emoji}</div>
                      <div className="font-black text-xs">{SEVERITY_LABELS[sev]}</div>
                      <div className="text-xs opacity-70 mt-0.5">{d.label}</div>
                    </div>
                  )
                })}
              </div>

              {p.recommendations.length > 0 && (
                <div className="mt-4 bg-brand-50 rounded-xl p-3">
                  <h4 className="font-bold text-brand-700 text-xs mb-2">التوصيات:</h4>
                  <ul className="space-y-1">
                    {p.recommendations.slice(0, 3).map((r, i) => (
                      <li key={i} className="text-brand-600 text-xs flex items-start gap-2">
                        <span>•</span>{r}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
