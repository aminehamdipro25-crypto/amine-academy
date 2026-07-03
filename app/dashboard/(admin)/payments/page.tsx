'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle2, XCircle, Clock, RefreshCw, CreditCard, AlertTriangle, BadgeCheck } from 'lucide-react'
import type { PendingPayment, PaymentStatus } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { ACountUp } from '@/components/ui'
import { staggerContainer, fadeUp, popIn, liftHover, tapOnly } from '@/lib/motion'

const METHOD_LABELS: Record<string, string> = {
  fawran:           'فوران',
  bank_transfer_qa: 'بنكي — قطر',
  bank_transfer_tn: 'بنكي — تونس',
  whatsapp:         'واتساب',
}

const METHOD_COLORS: Record<string, string> = {
  fawran:           'bg-blue-100 text-blue-700',
  bank_transfer_qa: 'bg-emerald-100 text-emerald-700',
  bank_transfer_tn: 'bg-teal-100 text-teal-700',
  whatsapp:         'bg-green-100 text-green-700',
}

const PLAN_LABELS: Record<string, string> = {
  basic: 'الأساسي', standard: 'المتقدم', premium: 'المتميز',
  session: 'حصة مفردة', weekly: 'أسبوعي', monthly: 'شهري',
}

const PLAN_COLORS: Record<string, string> = {
  session: 'bg-gray-100 text-gray-700',
  weekly:  'bg-violet-100 text-violet-700',
  monthly: 'bg-brand-100 text-brand-700',
}

export default function AdminPaymentsPage() {
  const { toast } = useToast()
  const [payments, setPayments] = useState<PendingPayment[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<PaymentStatus | 'all'>('all')
  const [processingId, setProcessingId] = useState<string | null>(null)
  const [confirm, setConfirm] = useState<{ id: string; name: string } | null>(null)

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
        toast(
          status === 'confirmed' ? '✓ تم تأكيد الدفعة بنجاح' : 'تم رفض الدفعة',
          status === 'confirmed' ? 'success' : 'error'
        )
      } else {
        toast('حدث خطأ، حاول مجدداً', 'error')
      }
    } catch {
      toast('تعذّر الاتصال بالخادم', 'error')
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

  const TABS = [
    { key: 'all'       as const, label: 'الكل',           icon: CreditCard,   bg: 'bg-gray-600',    glow: 'shadow-gray-500/20'    },
    { key: 'pending'   as const, label: 'قيد المراجعة',   icon: Clock,        bg: 'bg-amber-500',   glow: 'shadow-amber-500/20'   },
    { key: 'confirmed' as const, label: 'مؤكدة',          icon: BadgeCheck,   bg: 'bg-emerald-600', glow: 'shadow-emerald-500/20' },
    { key: 'rejected'  as const, label: 'مرفوضة',         icon: XCircle,      bg: 'bg-red-500',     glow: 'shadow-red-500/20'     },
  ]

  return (
    <motion.div className="space-y-6" dir="rtl" variants={staggerContainer} initial="hidden" animate="show">

      {/* ── Header ── */}
      <motion.div variants={fadeUp} className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-brand-500" />
            المدفوعات
          </h1>
          <p className="text-gray-400 text-sm mt-1">مراجعة وتأكيد طلبات الاشتراك</p>
        </div>
        <motion.button
          {...tapOnly}
          onClick={fetchPayments}
          disabled={loading}
          className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm shadow-brand-500/20 disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          تحديث
        </motion.button>
      </motion.div>

      {/* ── Stats Strip ── */}
      <motion.div variants={staggerContainer} className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TABS.map(({ key, label, icon: Icon, bg, glow }) => (
          <motion.button
            key={key}
            variants={popIn}
            {...liftHover}
            onClick={() => setFilter(key)}
            className={`bg-white rounded-2xl p-4 border text-right transition-all hover:shadow-md ${
              filter === key ? 'border-brand-300 ring-2 ring-brand-200 shadow-md' : 'border-gray-100 shadow-sm'
            }`}
          >
            <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center shadow-lg ${glow} mb-3`}>
              <Icon className="w-5 h-5 text-white" />
            </div>
            <div className="text-3xl font-black text-gray-900 ltr-num"><ACountUp value={counts[key]} /></div>
            <div className="text-gray-400 text-xs mt-0.5 font-medium">{label}</div>
          </motion.button>
        ))}
      </motion.div>

      {/* ── Pending alert ── */}
      {counts.pending > 0 && (
        <motion.div variants={fadeUp} className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
          <p className="text-amber-800 text-sm font-bold">
            {counts.pending} طلب{counts.pending > 1 ? 'ات تنتظر' : ' ينتظر'} مراجعتك — راجعها الآن
          </p>
        </motion.div>
      )}

      {/* ── Cards ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl border border-gray-100 p-5 animate-pulse">
              <div className="flex gap-3 mb-4">
                <div className="w-12 h-12 bg-gray-200 rounded-2xl flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-gray-200 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
              <div className="space-y-2">
                <div className="h-2.5 bg-gray-100 rounded w-full" />
                <div className="h-2.5 bg-gray-100 rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div variants={fadeUp} className="bg-white rounded-3xl border border-gray-100 py-24 text-center shadow-sm">
          <div className="text-6xl mb-4">💳</div>
          <p className="text-gray-900 font-black text-lg">لا توجد مدفوعات</p>
          <p className="text-gray-400 text-sm mt-1">
            {filter === 'all' ? 'ستظهر هنا عند استلام أول طلب دفع' : `لا توجد مدفوعات ${TABS.find(t => t.key === filter)?.label}`}
          </p>
        </motion.div>
      ) : (
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
          {filtered.map(payment => {
            const isProcessing = processingId === payment.id
            const date = new Date(payment.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric', month: 'short', day: 'numeric',
            })

            const statusBadge =
              payment.status === 'pending'   ? 'bg-amber-100 text-amber-700 ring-1 ring-amber-200' :
              payment.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200' :
              payment.status === 'rejected'  ? 'bg-red-100 text-red-700 ring-1 ring-red-200' :
                                               'bg-gray-100 text-gray-600 ring-1 ring-gray-200'

            const statusDot =
              payment.status === 'pending'   ? 'bg-amber-400' :
              payment.status === 'confirmed' ? 'bg-emerald-500' :
              payment.status === 'rejected'  ? 'bg-red-500' : 'bg-gray-400'

            const statusLabel =
              payment.status === 'pending'   ? 'قيد المراجعة' :
              payment.status === 'confirmed' ? 'مؤكد' :
              payment.status === 'rejected'  ? 'مرفوض' : 'منتهي'

            const planColor = PLAN_COLORS[payment.plan] ?? 'bg-gray-100 text-gray-600'
            const methodColor = METHOD_COLORS[payment.method] ?? 'bg-gray-100 text-gray-600'

            return (
              <motion.div
                key={payment.id}
                layout
                variants={popIn}
                initial="hidden"
                animate="show"
                exit={{ opacity: 0, scale: 0.92, transition: { duration: 0.2 } }}
                {...liftHover}
                className="group bg-white rounded-3xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-200"
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-md flex-shrink-0">
                      {payment.guestName?.[0] ?? '?'}
                      <span className={`absolute -bottom-0.5 -left-0.5 w-3 h-3 ${statusDot} rounded-full border-2 border-white`} />
                    </div>
                    <div>
                      <p className="font-black text-gray-900 text-sm">{payment.guestName}</p>
                      <p className="text-gray-400 text-[11px] mt-0.5 ltr-num">{payment.guestEmail}</p>
                    </div>
                  </div>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black ${statusBadge}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                    {statusLabel}
                  </span>
                </div>

                {/* Amount highlight */}
                <div className="bg-brand-50 rounded-2xl px-4 py-3 mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-[10px] text-gray-400 font-medium mb-0.5">المبلغ</p>
                    <p className="text-2xl font-black text-brand-700 ltr-num">
                      <ACountUp value={payment.amount} /> <span className="text-sm font-bold">{payment.currency === 'QAR' ? 'ر.ق' : 'د.ت'}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex px-2.5 py-1 rounded-xl text-[11px] font-black ${planColor}`}>
                      {PLAN_LABELS[payment.plan] ?? payment.plan}
                    </span>
                  </div>
                </div>

                {/* Info rows */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">طريقة الدفع</span>
                    <span className={`font-bold px-2 py-0.5 rounded-lg ${methodColor}`}>
                      {METHOD_LABELS[payment.method] ?? payment.method}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">رمز المرجع</span>
                    <code className="font-mono bg-brand-50 text-brand-700 px-2 py-0.5 rounded-lg text-[11px] font-bold">
                      {payment.referenceCode}
                    </code>
                  </div>
                  {payment.guestPhone && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium">الهاتف</span>
                      <span className="text-gray-700 font-bold ltr-num">{payment.guestPhone}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium">التاريخ</span>
                    <span className="text-gray-500 ltr-num">{date}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-gray-50">
                  {payment.status === 'pending' && (
                    <div className="flex gap-2">
                      <motion.button
                        {...tapOnly}
                        onClick={() => updateStatus(payment.id, 'confirmed')}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-black rounded-xl transition-colors disabled:opacity-50"
                      >
                        {isProcessing
                          ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          : <CheckCircle2 className="w-3.5 h-3.5" />}
                        تأكيد
                      </motion.button>
                      <motion.button
                        {...tapOnly}
                        onClick={() => setConfirm({ id: payment.id, name: payment.guestName ?? '' })}
                        disabled={isProcessing}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-black rounded-xl transition-colors disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        رفض
                      </motion.button>
                    </div>
                  )}
                  {payment.status === 'confirmed' && (
                    <div className="flex items-center justify-center gap-2 py-2 text-emerald-600">
                      <BadgeCheck className="w-4 h-4" />
                      <span className="text-xs font-black">تم التأكيد</span>
                    </div>
                  )}
                  {payment.status === 'rejected' && (
                    <motion.button
                      {...tapOnly}
                      onClick={() => updateStatus(payment.id, 'pending')}
                      disabled={isProcessing}
                      className="w-full py-2 text-xs text-gray-500 hover:text-gray-800 font-bold underline transition-colors"
                    >
                      إعادة فتح للمراجعة
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
          </AnimatePresence>
        </motion.div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title="رفض الدفعة"
        message={`هل أنت متأكد من رفض دفعة ${confirm?.name ?? ''}؟ لا يمكن التراجع عن هذا القرار.`}
        confirmLabel="نعم، رفض الدفعة"
        onConfirm={() => { const id = confirm?.id; setConfirm(null); if (id) updateStatus(id, 'rejected') }}
        onCancel={() => setConfirm(null)}
      />
    </motion.div>
  )
}
