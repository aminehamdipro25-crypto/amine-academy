'use client'

import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, RefreshCw, Filter } from 'lucide-react'
import type { PendingPayment, PaymentStatus } from '@/lib/types'

const METHOD_LABELS: Record<string, string> = {
  fawran:           'فوران',
  bank_transfer_qa: 'بنكي — قطر',
  bank_transfer_tn: 'بنكي — تونس',
  whatsapp:         'واتساب',
}

const STATUS_CONFIG: Record<PaymentStatus, { label: string; bg: string; text: string; icon: React.ElementType }> = {
  pending:   { label: 'قيد المراجعة', bg: 'bg-amber-100',  text: 'text-amber-700',  icon: Clock },
  confirmed: { label: 'مؤكد',          bg: 'bg-green-100',  text: 'text-green-700',  icon: CheckCircle2 },
  rejected:  { label: 'مرفوض',         bg: 'bg-red-100',    text: 'text-red-700',    icon: XCircle },
  expired:   { label: 'منتهي',         bg: 'bg-gray-100',   text: 'text-gray-500',   icon: Clock },
}

const PLAN_LABELS: Record<string, string> = {
  basic:    'الأساسي',
  standard: 'المتقدم',
  premium:  'المتميز',
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)

  const fetchPayments = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/payments')
      if (res.ok) {
        const data = await res.json()
        setPayments(data.payments ?? [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchPayments() }, [fetchPayments])

  async function updateStatus(id: string, status: PaymentStatus) {
    setProcessingId(id)
    try {
      const res = await fetch(`/api/admin/payments?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (res.ok) {
        setPayments(prev => prev.map(p => p.id === id ? { ...p, status } : p))
      }
    } catch (e) {
      console.error(e)
    } finally {
      setProcessingId(null)
    }
  }

  const filtered = filter === 'all' ? payments : payments.filter(p => p.status === filter)

  const counts = {
    all:       payments.length,
    pending:   payments.filter(p => p.status === 'pending').length,
    confirmed: payments.filter(p => p.status === 'confirmed').length,
    rejected:  payments.filter(p => p.status === 'rejected').length,
  }

  return (
    <div className="p-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">إدارة المدفوعات</h1>
          <p className="text-gray-500 text-sm mt-1">مراجعة وتأكيد طلبات الاشتراك</p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { key: 'all',       label: 'الكل',       color: 'bg-gray-50 border-gray-200' },
          { key: 'pending',   label: 'قيد المراجعة', color: 'bg-amber-50 border-amber-200' },
          { key: 'confirmed', label: 'مؤكد',        color: 'bg-green-50 border-green-200' },
          { key: 'rejected',  label: 'مرفوض',       color: 'bg-red-50 border-red-200' },
        ].map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key as typeof filter)}
            className={`${color} border-2 rounded-xl p-4 text-right transition-all ${filter === key ? 'ring-2 ring-brand-400 shadow-md' : ''}`}
          >
            <p className="text-2xl font-black text-gray-900">{counts[key as keyof typeof counts]}</p>
            <p className="text-sm text-gray-500">{label}</p>
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-gray-500">تصفية:</span>
        {(['all', 'pending', 'confirmed', 'rejected'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
              filter === f ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {f === 'all' ? 'الكل' : STATUS_CONFIG[f].label}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="text-center py-16">
          <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-400 mt-3 text-sm">جارٍ التحميل...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <p className="text-gray-400 text-lg">لا توجد مدفوعات</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['الاسم', 'البريد', 'الخطة', 'المبلغ', 'طريقة الدفع', 'رمز المرجع', 'الحالة', 'التاريخ', 'الإجراء'].map(h => (
                    <th key={h} className="px-4 py-3 text-right text-xs font-black text-gray-500 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(payment => {
                  const sc = STATUS_CONFIG[payment.status]
                  const StatusIcon = sc.icon
                  const isProcessing = processingId === payment.id
                  const date = new Date(payment.createdAt).toLocaleDateString('ar-QA', {
                    year: 'numeric', month: 'short', day: 'numeric',
                  })

                  return (
                    <tr key={payment.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-bold text-gray-900 text-sm whitespace-nowrap">{payment.guestName}</p>
                        {payment.guestPhone && (
                          <p className="text-xs text-gray-400 mt-0.5" dir="ltr">{payment.guestPhone}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600" dir="ltr">{payment.guestEmail}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-bold text-gray-700">{PLAN_LABELS[payment.plan] ?? payment.plan}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm font-black text-brand-700 whitespace-nowrap">
                          {payment.amount} {payment.currency === 'QAR' ? 'ر.ق' : 'د.ت'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600">{METHOD_LABELS[payment.method] ?? payment.method}</span>
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs font-mono bg-brand-50 text-brand-700 px-2 py-1 rounded-lg whitespace-nowrap">
                          {payment.referenceCode}
                        </code>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${sc.bg} ${sc.text} whitespace-nowrap`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {sc.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-gray-400 whitespace-nowrap">{date}</span>
                      </td>
                      <td className="px-4 py-3">
                        {payment.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => updateStatus(payment.id, 'confirmed')}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50 whitespace-nowrap"
                            >
                              {isProcessing ? (
                                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              ) : (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              )}
                              تأكيد
                            </button>
                            <button
                              onClick={() => updateStatus(payment.id, 'rejected')}
                              disabled={isProcessing}
                              className="flex items-center gap-1 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              رفض
                            </button>
                          </div>
                        )}
                        {payment.status === 'confirmed' && (
                          <span className="text-xs text-green-600 font-bold">✓ تم التأكيد</span>
                        )}
                        {payment.status === 'rejected' && (
                          <button
                            onClick={() => updateStatus(payment.id, 'pending')}
                            disabled={isProcessing}
                            className="text-xs text-gray-500 hover:text-gray-700 font-bold underline"
                          >
                            إعادة فتح
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
