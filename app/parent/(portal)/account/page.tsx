'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Download, Trash2, AlertTriangle, ShieldAlert, User, Mail } from 'lucide-react'

interface ParentInfo {
  firstName: string
  lastName: string
  email: string
}

export default function AccountPage() {
  const router = useRouter()
  const [parent, setParent] = useState<ParentInfo | null>(null)
  const [loadingData, setLoadingData] = useState(true)

  // Download state
  const [downloading, setDownloading] = useState(false)

  // Delete state
  const [confirmInput, setConfirmInput] = useState('')
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  useEffect(() => {
    fetch('/api/parent/me')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.parent) {
          setParent({
            firstName: d.parent.firstName,
            lastName: d.parent.lastName,
            email: d.parent.email,
          })
        }
      })
      .catch(() => {})
      .finally(() => setLoadingData(false))
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await fetch('/api/parent/me')
      if (!res.ok) throw new Error('فشل التحميل')
      const data = await res.json()
      // Strip sensitive server-only fields before download
      const exportData = {
        parent: {
          id: data.parent?.id,
          firstName: data.parent?.firstName,
          lastName: data.parent?.lastName,
          email: data.parent?.email,
          phone: data.parent?.phone,
          subscriptionPlan: data.parent?.subscriptionPlan,
          subscriptionStatus: data.parent?.subscriptionStatus,
          createdAt: data.parent?.createdAt,
        },
        children: (data.children ?? []).map((c: Record<string, unknown>) => ({
          id: c.id,
          firstName: c.firstName,
          lastName: c.lastName,
          diagnosis: c.diagnosis,
          ageGroup: c.ageGroup,
          totalPoints: c.totalPoints,
          streak: c.streak,
          createdAt: c.createdAt,
        })),
        exportedAt: new Date().toISOString(),
      }
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `amine-academy-data-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch {
      // non-critical — user can retry
    } finally {
      setDownloading(false)
    }
  }

  async function handleDelete() {
    if (confirmInput !== 'DELETE') return
    setDeleting(true)
    setDeleteError('')
    try {
      const res = await fetch('/api/parent/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setDeleteError(d?.error === 'server_error' ? 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى.' : 'فشل حذف الحساب. يرجى المحاولة مرة أخرى.')
        return
      }
      router.push('/parent/login?deleted=1')
    } catch {
      setDeleteError('تعذّر الاتصال بالخادم. يرجى التحقق من اتصالك والمحاولة مرة أخرى.')
    } finally {
      setDeleting(false)
    }
  }

  if (loadingData) {
    return (
      <div dir="rtl" className="flex items-center justify-center py-24">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse"
          style={{ background: '#F3EEFF' }}
        >
          <User className="w-6 h-6" style={{ color: '#7C5CFC' }} />
        </div>
      </div>
    )
  }

  return (
    <div dir="rtl" className="space-y-5">

      {/* ══ Page header ══ */}
      <div>
        <h1 className="font-black text-xl text-gray-900">إعدادات الحساب</h1>
        <p className="text-gray-400 text-sm mt-1">إدارة بياناتك الشخصية وخصوصيتك</p>
      </div>

      {/* ══ Identity card ══ */}
      {parent && (
        <div
          className="rounded-2xl p-5"
          style={{
            background: '#FFFFFF',
            border: '1.5px solid #F0E8FF',
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: '#F3EEFF' }}
            >
              <User className="w-5 h-5" style={{ color: '#7C5CFC' }} />
            </div>
            <div>
              <p className="font-black text-gray-900 text-sm leading-tight">
                {parent.firstName} {parent.lastName}
              </p>
              <p className="text-gray-400 text-xs mt-0.5">ولي الأمر</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #F0E8FF' }}>
            <Mail className="w-4 h-4 flex-shrink-0" style={{ color: '#9CA3AF' }} />
            <span className="text-sm text-gray-600 ltr-num" dir="ltr">{parent.email}</span>
          </div>
        </div>
      )}

      {/* ══ Section 1 — Download my data ══ */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #F0E8FF',
          boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#F3EEFF' }}
          >
            <Download className="w-4 h-4" style={{ color: '#7C5CFC' }} />
          </div>
          <h2 className="font-black text-gray-900 text-sm">تنزيل بياناتي</h2>
        </div>
        <p className="text-gray-500 text-xs mb-4 leading-relaxed">
          يمكنك تنزيل نسخة من جميع بياناتك الشخصية وبيانات أطفالك المسجّلة في أكاديمية أمين بصيغة JSON.
          هذا حق مكفول لك بموجب لوائح حماية البيانات (GDPR).
        </p>
        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-black transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          style={{ background: '#F3EEFF', color: '#6B46F0', border: '1.5px solid #E0D0FF' }}
          onMouseEnter={e => { if (!downloading) (e.currentTarget as HTMLButtonElement).style.background = '#E8DBFF' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = '#F3EEFF' }}
        >
          <Download className="w-4 h-4" />
          {downloading ? 'جاري التحضير...' : 'تنزيل بياناتي'}
        </button>
      </div>

      {/* ══ Section 2 — Delete account (Danger Zone) ══ */}
      <div
        className="rounded-2xl p-5"
        style={{
          background: '#FFFFFF',
          border: '1.5px solid #FECACA',
          boxShadow: '0 2px 12px rgba(239,68,68,0.06)',
        }}
      >
        {/* Danger header */}
        <div className="flex items-center gap-2 mb-3">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#FEF2F2' }}
          >
            <ShieldAlert className="w-4 h-4 text-red-500" />
          </div>
          <h2 className="font-black text-red-700 text-sm">حذف الحساب نهائياً</h2>
        </div>

        {/* Warning box */}
        <div
          className="rounded-xl p-4 mb-5"
          style={{ background: '#FFF5F5', border: '1px solid #FED7D7' }}
        >
          <div className="flex items-start gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 text-xs font-black leading-snug">تحذير: هذا الإجراء لا يمكن التراجع عنه</p>
          </div>
          <ul className="text-red-700 text-xs space-y-1 leading-relaxed pr-1">
            <li>• سيتم حذف حسابك وجميع بياناتك الشخصية نهائياً</li>
            <li>• سيتم حذف بيانات جميع أطفالك المسجّلين (التقدم، التقارير، البرامج)</li>
            <li>• سيتم حذف سجل مراسلاتك مع الأخصائي</li>
            <li>• لن تتمكن من استعادة أي من هذه البيانات بعد الحذف</li>
          </ul>
        </div>

        {/* Confirmation input */}
        <div className="mb-4">
          <label className="block text-gray-700 text-xs font-black mb-2">
            لتأكيد الحذف، اكتب <span className="font-mono font-black text-red-600 bg-red-50 px-1.5 py-0.5 rounded">DELETE</span> في الحقل أدناه:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={e => { setConfirmInput(e.target.value); setDeleteError('') }}
            placeholder="اكتب DELETE هنا"
            dir="ltr"
            className="w-full px-4 py-2.5 rounded-xl text-sm font-mono outline-none transition-all"
            style={{
              background: '#FFF5F5',
              border: confirmInput === 'DELETE'
                ? '1.5px solid #EF4444'
                : '1.5px solid #FECACA',
              color: '#1F2937',
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.boxShadow = '0 0 0 3px rgba(239,68,68,0.12)' }}
            onBlur={e => { (e.target as HTMLInputElement).style.boxShadow = 'none' }}
            disabled={deleting}
            autoComplete="off"
            spellCheck={false}
          />
        </div>

        {/* Error message */}
        {deleteError && (
          <div
            className="rounded-xl px-4 py-3 mb-4 text-xs font-bold text-red-700"
            style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
          >
            {deleteError}
          </div>
        )}

        {/* Delete button */}
        <button
          onClick={handleDelete}
          disabled={confirmInput !== 'DELETE' || deleting}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-black text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: confirmInput === 'DELETE' && !deleting
              ? 'linear-gradient(135deg, #DC2626, #B91C1C)'
              : '#F87171',
            boxShadow: confirmInput === 'DELETE' && !deleting
              ? '0 4px 16px rgba(220,38,38,0.35)'
              : 'none',
          }}
          onMouseEnter={e => {
            if (confirmInput === 'DELETE' && !deleting)
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #B91C1C, #991B1B)'
          }}
          onMouseLeave={e => {
            if (confirmInput === 'DELETE' && !deleting)
              (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #DC2626, #B91C1C)'
          }}
        >
          {deleting ? (
            <>
              <span
                className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin flex-shrink-0"
                style={{ animationDuration: '0.7s' }}
              />
              جاري حذف الحساب...
            </>
          ) : (
            <>
              <Trash2 className="w-4 h-4" />
              حذف حسابي وجميع بياناتي
            </>
          )}
        </button>

        <p className="text-gray-400 text-[11px] text-center mt-3 leading-relaxed">
          بالضغط على الزر أعلاه، تؤكد موافقتك على الحذف الفوري والنهائي لجميع بياناتك.
        </p>
      </div>
    </div>
  )
}
