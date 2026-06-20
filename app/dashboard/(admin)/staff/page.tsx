'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserCog, Plus, X, Trash2, KeyRound, CheckCircle, AlertCircle,
  RefreshCw, Eye, EyeOff, Power, Mail, Calendar,
} from 'lucide-react'

interface StaffMember {
  id: string
  email: string
  name: string
  isActive: boolean
  createdAt: string
  lastLoginAt: string | null
}

export default function StaffManagementPage() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  const [pwdEditId, setPwdEditId] = useState<string | null>(null)
  const [newPwd, setNewPwd] = useState('')
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [pwdError, setPwdError] = useState('')

  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/staff')
      if (!res.ok) throw new Error('فشل تحميل قائمة فريق العمل')
      setStaff(await res.json())
      setError('')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setCreating(true)
    setCreateError('')
    try {
      const res = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل إنشاء الحساب')
      setName(''); setEmail(''); setPassword('')
      setShowCreate(false)
      await load()
    } catch (e) {
      setCreateError((e as Error).message)
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(member: StaffMember) {
    setBusyId(member.id)
    try {
      const res = await fetch(`/api/admin/staff/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !member.isActive }),
      })
      if (res.ok) await load()
    } finally {
      setBusyId(null)
    }
  }

  async function handlePasswordReset(id: string) {
    if (newPwd.length < 8) { setPwdError('كلمة المرور قصيرة جداً (8 أحرف على الأقل)'); return }
    setPwdSaving(true)
    setPwdError('')
    try {
      const res = await fetch(`/api/admin/staff/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'فشل تغيير كلمة المرور')
      setPwdEditId(null)
      setNewPwd('')
    } catch (e) {
      setPwdError((e as Error).message)
    } finally {
      setPwdSaving(false)
    }
  }

  async function handleDelete(id: string) {
    setBusyId(id)
    try {
      const res = await fetch(`/api/admin/staff/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setConfirmDeleteId(null)
        await load()
      }
    } finally {
      setBusyId(null)
    }
  }

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <UserCog className="w-6 h-6 text-brand-500" />
            فريق العمل
          </h1>
          <p className="text-gray-500 text-sm mt-1">إدارة حسابات المعالجين — صلاحيات محدودة، لا يمكنهم حذف العملاء أو الوصول للمدفوعات والإعدادات</p>
        </div>
        <button
          onClick={() => { setShowCreate(true); setCreateError('') }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          إضافة معالج
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-2xl p-4">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-800 text-sm font-medium">{error}</p>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-black text-gray-900 text-lg">حساب معالج جديد</h2>
            <button onClick={() => setShowCreate(false)} className="text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          </div>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">الاسم الكامل</label>
              <input
                type="text" value={name} onChange={e => setName(e.target.value)} required
                placeholder="مثال: سارة بن علي"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)} required
                placeholder="example@email.com" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1.5">كلمة المرور</label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                  placeholder="8 أحرف على الأقل" dir="ltr"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400 focus:border-transparent"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {createError && (
              <div className="md:col-span-3 flex items-center gap-2 text-red-700 text-sm bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {createError}
              </div>
            )}

            <div className="md:col-span-3 flex justify-end">
              <button
                type="submit" disabled={creating}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
              >
                {creating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {creating ? 'جاري الإنشاء…' : 'إنشاء الحساب'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Staff list */}
      <div className="bg-white rounded-2xl border border-gray-100">
        {loading ? (
          <div className="p-6 space-y-3 animate-pulse">
            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-100 rounded-xl" />)}
          </div>
        ) : staff.length === 0 ? (
          <div className="p-10 text-center text-gray-400">
            <UserCog className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm font-medium">لا يوجد فريق عمل بعد — أضف أول معالج للبدء</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {staff.map(member => (
              <div key={member.id} className="p-5">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 ${member.isActive ? 'bg-gradient-to-br from-brand-400 to-brand-700' : 'bg-gray-300'}`}>
                      {member.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-black text-gray-900 truncate">{member.name}</p>
                        {!member.isActive && (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">معطّل</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{member.email}</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {member.lastLoginAt ? `آخر دخول: ${new Date(member.lastLoginAt).toLocaleDateString('fr-FR')}` : 'لم يسجل الدخول بعد'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => { setPwdEditId(pwdEditId === member.id ? null : member.id); setNewPwd(''); setPwdError('') }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      كلمة مرور
                    </button>
                    <button
                      onClick={() => toggleActive(member)}
                      disabled={busyId === member.id}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors disabled:opacity-50 ${
                        member.isActive ? 'text-amber-700 bg-amber-50 hover:bg-amber-100' : 'text-green-700 bg-green-50 hover:bg-green-100'
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      {member.isActive ? 'تعطيل' : 'تفعيل'}
                    </button>
                    {confirmDeleteId === member.id ? (
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => setConfirmDeleteId(null)} className="px-3 py-2 rounded-lg text-xs font-bold text-gray-500 bg-gray-50 hover:bg-gray-100">إلغاء</button>
                        <button
                          onClick={() => handleDelete(member.id)}
                          disabled={busyId === member.id}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black text-white bg-red-600 hover:bg-red-700 disabled:opacity-60"
                        >
                          {busyId === member.id ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          تأكيد الحذف
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDeleteId(member.id)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        حذف
                      </button>
                    )}
                  </div>
                </div>

                {pwdEditId === member.id && (
                  <div className="mt-4 bg-gray-50 rounded-xl p-4 flex flex-wrap items-end gap-3">
                    <div className="flex-1 min-w-[200px]">
                      <label className="block text-xs font-bold text-gray-600 mb-1.5">كلمة مرور جديدة</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                          placeholder="8 أحرف على الأقل" dir="ltr"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2 pl-10 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-400"
                        />
                        <button type="button" onClick={() => setShowNewPwd(s => !s)} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                          {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePasswordReset(member.id)}
                      disabled={pwdSaving}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-60"
                    >
                      {pwdSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      حفظ
                    </button>
                    {pwdError && <p className="text-red-600 text-xs font-medium w-full">{pwdError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
