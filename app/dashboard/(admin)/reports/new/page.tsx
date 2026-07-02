'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowRight, Save, Sparkles, User, Calendar, ClipboardList,
  Brain, Star, CheckCircle2, AlertCircle, ChevronDown,
} from 'lucide-react'
import type { Parent, Student } from '@/lib/types'
import { useToast } from '@/components/ui/Toast'

const METRICS = [
  { key: 'attention',            label: 'الانتباه والتركيز',   icon: '🎯', color: 'blue' },
  { key: 'impulse_control',      label: 'كبح الاندفاعية',      icon: '🛑', color: 'red' },
  { key: 'social_interaction',   label: 'التفاعل الاجتماعي',   icon: '🤝', color: 'green' },
  { key: 'motor_coordination',   label: 'التنسيق الحركي',      icon: '🏃', color: 'orange' },
  { key: 'emotional_regulation', label: 'تنظيم المشاعر',       icon: '💙', color: 'violet' },
]

const SCORE_CONFIG: Record<number, { label: string; bg: string; text: string; ring: string }> = {
  1: { label: 'ضعيف جداً', bg: 'bg-red-500',    text: 'text-white', ring: 'ring-red-300' },
  2: { label: 'ضعيف',     bg: 'bg-orange-400', text: 'text-white', ring: 'ring-orange-300' },
  3: { label: 'متوسط',    bg: 'bg-amber-400',  text: 'text-white', ring: 'ring-amber-300' },
  4: { label: 'جيد',      bg: 'bg-emerald-400',text: 'text-white', ring: 'ring-emerald-300' },
  5: { label: 'ممتاز',    bg: 'bg-emerald-600',text: 'text-white', ring: 'ring-emerald-400' },
}

const SCORE_BAR_COLOR: Record<number, string> = {
  1: 'bg-red-400', 2: 'bg-orange-400', 3: 'bg-amber-400', 4: 'bg-emerald-400', 5: 'bg-emerald-600',
}

interface ParentWithStudents extends Parent { students: Student[] }

function SectionHeader({ num, title, icon }: { num: number; title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-8 h-8 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-sm flex-shrink-0 shadow-md shadow-brand-500/30">
        {num}
      </div>
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="font-black text-gray-900 text-base">{title}</h2>
      </div>
      <div className="flex-1 h-px bg-gray-100" />
    </div>
  )
}

export default function NewReportPage() {
  const router = useRouter()
  const { toast } = useToast()
  const [clients, setClients] = useState<ParentWithStudents[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generatingAI, setGeneratingAI] = useState(false)
  const [aiError, setAiError] = useState('')

  const [selectedParentId, setSelectedParentId] = useState('')
  const [selectedStudentId, setSelectedStudentId] = useState('')
  const [type, setType] = useState<'session' | 'weekly' | 'monthly'>('session')
  const [periodStart, setPeriodStart] = useState(new Date().toISOString().slice(0, 10))
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10))
  const [completed, setCompleted] = useState(0)
  const [total, setTotal] = useState(5)
  const [points, setPoints] = useState(0)
  const [professorNotes, setProfessorNotes] = useState('')
  const [ratings, setRatings] = useState<Record<string, number>>(
    Object.fromEntries(METRICS.map(m => [m.key, 3]))
  )

  useEffect(() => {
    fetch('/api/admin/clients-list')
      .then(r => r.json())
      .then(d => {
        setClients(d.clients || [])
        if (d.clients?.length > 0) {
          setSelectedParentId(d.clients[0].id)
          if (d.clients[0].students?.length > 0) setSelectedStudentId(d.clients[0].students[0].id)
        }
      })
      .catch(() => toast('تعذر تحميل قائمة المشتركين', 'error'))
      .finally(() => setLoading(false))
  }, [toast])

  const selectedParent = clients.find(c => c.id === selectedParentId)
  const selectedStudent = selectedParent?.students?.find(s => s.id === selectedStudentId)

  function handleParentChange(pid: string) {
    setSelectedParentId(pid)
    const p = clients.find(c => c.id === pid)
    setSelectedStudentId(p?.students?.[0]?.id ?? '')
  }

  const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0

  function generateLocalTemplate() {
    const name = selectedStudent ? selectedStudent.firstName : 'الطفل'
    const typeLabel = type === 'session' ? 'الجلسة' : type === 'weekly' ? 'هذا الأسبوع' : 'هذا الشهر'
    const perfLevel = completionPct >= 80 ? 'ممتازاً' : completionPct >= 60 ? 'جيداً' : completionPct >= 40 ? 'متوسطاً' : 'يحتاج دعماً'
    const lowestMetric = METRICS.reduce((a, b) => (ratings[a.key] ?? 3) <= (ratings[b.key] ?? 3) ? a : b)
    const highestMetric = METRICS.reduce((a, b) => (ratings[a.key] ?? 3) >= (ratings[b.key] ?? 3) ? a : b)
    const avg = (Object.values(ratings).reduce((a, b) => a + b, 0) / METRICS.length)
    const tip = completionPct >= 70
      ? 'تشجيعه على الاستمرار والمواظبة على روتين التمارين اليومية'
      : 'دعمه في المنزل من خلال تخصيص وقت منتظم للتمرين والمراجعة'
    setProfessorNotes(
      `أظهر ${name} أداءً ${perfLevel} خلال ${typeLabel}، حيث أكمل ${completed} تمريناً من أصل ${total} (${completionPct}%) واكتسب ${points} نقطة. ` +
      `تميّز في مجال ${highestMetric.label}، ` +
      (avg < 4 ? `في حين يحتاج مزيداً من التطوير في ${lowestMetric.label}. ` : `وأظهر مستوى سلوكياً عاماً مُرضياً. `) +
      `توصية للأسرة هذا الأسبوع: ${tip}.`
    )
    toast('تم توليد نموذج محلي — يمكنك تعديله', 'info')
  }

  async function generateAISummary() {
    if (!selectedStudentId || generatingAI) return
    setGeneratingAI(true)
    setAiError('')
    try {
      const res = await fetch('/api/admin/ai-generate-report-summary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          type, periodStart, periodEnd,
          completedExercises: completed,
          totalExercises: total,
          pointsEarned: points,
          behaviorRatings: METRICS.map(m => ({ metric: m.key, score: ratings[m.key] || 3 })),
        }),
      })
      const data = await res.json()
      if (data.summary) {
        setProfessorNotes(data.summary)
        toast('تم توليد الملخص بنجاح ✓', 'success')
      } else {
        setAiError(data.error || 'تعذر توليد الملخص — يمكنك الكتابة يدوياً')
      }
    } catch {
      setAiError('تعذر الاتصال — يمكنك الكتابة يدوياً')
    } finally {
      setGeneratingAI(false)
    }
  }

  async function submit() {
    if (!selectedStudentId || !selectedParentId) {
      toast('يرجى اختيار المشترك والطفل', 'error')
      return
    }
    setSaving(true)
    try {
      const res = await fetch('/api/admin/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedStudentId,
          parentId: selectedParentId,
          type, periodStart, periodEnd,
          completedExercises: completed,
          totalExercises: total,
          pointsEarned: points,
          behaviorRatings: METRICS.map(m => ({
            metric: m.key, score: ratings[m.key] || 3,
            ratedBy: 'professor', date: new Date().toISOString(),
          })),
          professorNotes,
        }),
      })
      if (res.ok) {
        toast('تم حفظ التقرير بنجاح ✓', 'success')
        setTimeout(() => router.push('/dashboard/reports'), 800)
      } else {
        const d = await res.json()
        toast(d.error || 'حدث خطأ أثناء الحفظ', 'error')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-4 border-brand-600 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const avgRating = Object.values(ratings).reduce((a, b) => a + b, 0) / METRICS.length

  return (
    <div className="max-w-2xl mx-auto space-y-6" dir="rtl">

      {/* ── Back ── */}
      <button onClick={() => router.push('/dashboard/reports')}
        className="flex items-center gap-2 text-gray-400 hover:text-gray-700 transition-colors text-sm font-bold">
        <ArrowRight className="w-4 h-4" />
        العودة للتقارير
      </button>

      {/* ── Page header ── */}
      <div className="bg-gradient-to-bl from-brand-700 via-brand-600 to-indigo-700 rounded-3xl p-6 text-white relative overflow-hidden">
        <div className="pointer-events-none absolute -top-8 -left-8 w-40 h-40 bg-white/5 rounded-full" />
        <div className="pointer-events-none absolute bottom-0 left-16 w-24 h-24 bg-white/5 rounded-full" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black">تقرير تقدم أكاديمي جديد</h1>
              <p className="text-white/60 text-xs mt-0.5">أكاديمية أمين — توثيق التطور السلوكي والأكاديمي</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── SECTION 1: المعلومات الأساسية ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader num={1} title="المعلومات الأساسية" icon={<User className="w-4 h-4 text-brand-500" />} />

        {/* Parent + Student */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">ولي الأمر</label>
            <div className="relative">
              <select
                value={selectedParentId}
                onChange={e => handleParentChange(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-300 focus:outline-none appearance-none bg-gray-50 text-gray-800"
              >
                {clients.length === 0 && <option value="">لا يوجد مشتركون</option>}
                {clients.map(c => (
                  <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">الطفل</label>
            <div className="relative">
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-300 focus:outline-none appearance-none bg-gray-50 text-gray-800"
              >
                {!selectedParent?.students?.length && <option value="">لا يوجد أطفال</option>}
                {selectedParent?.students?.map(s => (
                  <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Student info chip */}
        {selectedStudent && (
          <div className="bg-brand-50 rounded-2xl px-4 py-3 flex items-center gap-3 mb-5">
            <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-md shadow-brand-500/30">
              {selectedStudent.firstName?.[0]}
            </div>
            <div>
              <p className="font-black text-brand-900 text-sm">{selectedStudent.firstName} {selectedStudent.lastName}</p>
              <p className="text-brand-600 text-[11px] mt-0.5">{selectedStudent.diagnosis} · {selectedStudent.ageGroup} سنة</p>
            </div>
            <CheckCircle2 className="w-4 h-4 text-brand-500 mr-auto" />
          </div>
        )}

        {/* Report type tabs */}
        <div className="mb-5">
          <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">نوع التقرير</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { val: 'session', label: 'جلسة واحدة', icon: '📋' },
              { val: 'weekly',  label: 'تقرير أسبوعي', icon: '📅' },
              { val: 'monthly', label: 'تقرير شهري',   icon: '📊' },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setType(opt.val as typeof type)}
                className={`flex flex-col items-center gap-1 py-3 px-2 rounded-2xl border-2 transition-all text-sm font-bold ${
                  type === opt.val
                    ? 'bg-brand-600 border-brand-600 text-white shadow-md shadow-brand-500/30'
                    : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:bg-brand-50'
                }`}
              >
                <span className="text-lg">{opt.icon}</span>
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">من تاريخ</label>
            <input type="date" value={periodStart} onChange={e => setPeriodStart(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-300 focus:outline-none bg-gray-50 ltr-num" />
          </div>
          <div>
            <label className="block text-xs font-black text-gray-500 uppercase tracking-widest mb-2">إلى تاريخ</label>
            <input type="date" value={periodEnd} onChange={e => setPeriodEnd(e.target.value)}
              className="w-full border border-gray-200 rounded-2xl px-4 py-3 text-sm font-bold focus:ring-2 focus:ring-brand-300 focus:outline-none bg-gray-50 ltr-num" />
          </div>
        </div>
      </div>

      {/* ── SECTION 2: إنجازات الجلسة ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader num={2} title="إنجازات الجلسة" icon={<Star className="w-4 h-4 text-amber-500" />} />

        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: 'تمارين مكتملة', val: completed, set: setCompleted, color: 'emerald', max: total },
            { label: 'إجمالي التمارين', val: total, set: setTotal, color: 'brand', max: 50 },
            { label: 'نقاط مكتسبة', val: points, set: setPoints, color: 'amber', max: 9999 },
          ].map(({ label, val, set, color }) => (
            <div key={label} className="bg-gray-50 rounded-2xl p-3 text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-wide mb-3">{label}</p>
              <div className="flex items-center justify-center gap-2">
                <button type="button"
                  onClick={() => set(Math.max(0, val - 1))}
                  className="w-7 h-7 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-black text-base leading-none shadow-sm">
                  −
                </button>
                <input
                  type="number"
                  value={val}
                  onChange={e => set(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-14 text-center font-black text-xl text-gray-900 bg-transparent focus:outline-none ltr-num"
                />
                <button type="button"
                  onClick={() => set(val + 1)}
                  className="w-7 h-7 bg-white rounded-xl border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors font-black text-base leading-none shadow-sm">
                  +
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div className="bg-gray-50 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black text-gray-500 uppercase tracking-wide">نسبة الإنجاز</span>
            <span className={`text-sm font-black ltr-num ${completionPct >= 80 ? 'text-emerald-600' : completionPct >= 50 ? 'text-amber-600' : 'text-red-500'}`}>
              {completionPct}%
            </span>
          </div>
          <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                completionPct >= 80 ? 'bg-emerald-500' : completionPct >= 50 ? 'bg-amber-400' : 'bg-red-400'
              }`}
              style={{ width: `${completionPct}%` }}
            />
          </div>
          <p className="text-[11px] text-gray-400 mt-2 text-center">
            {completed} تمرين من أصل {total} · {points} نقطة مكتسبة
          </p>
        </div>
      </div>

      {/* ── SECTION 3: التقييم السلوكي ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader num={3} title="التقييم السلوكي المعياري" icon={<Brain className="w-4 h-4 text-violet-500" />} />

        <p className="text-xs text-gray-400 mb-5 bg-gray-50 rounded-xl px-4 py-2.5 font-medium">
          قيّم كل مجال من 1 (ضعيف جداً) إلى 5 (ممتاز) بناءً على ملاحظاتك خلال الجلسة
        </p>

        <div className="space-y-5">
          {METRICS.map(m => {
            const score = ratings[m.key] || 3
            const cfg = SCORE_CONFIG[score]
            return (
              <div key={m.key}>
                <div className="flex items-center justify-between mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{m.icon}</span>
                    <span className="font-bold text-gray-800 text-sm">{m.label}</span>
                  </div>
                  <span className={`text-[11px] font-black px-2.5 py-1 rounded-full ${cfg.bg} ${cfg.text}`}>
                    {cfg.label}
                  </span>
                </div>

                {/* Rating buttons */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(v => {
                    const c = SCORE_CONFIG[v]
                    const active = score === v
                    const filled = v <= score
                    return (
                      <button
                        key={v}
                        type="button"
                        onClick={() => setRatings(r => ({ ...r, [m.key]: v }))}
                        className={`flex-1 h-10 rounded-xl font-black text-sm transition-all ${
                          active
                            ? `${c.bg} ${c.text} scale-105 shadow-md ring-2 ring-offset-1 ${c.ring}`
                            : filled
                            ? `${c.bg} ${c.text} opacity-50`
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {v}
                      </button>
                    )
                  })}
                </div>

                {/* Mini bar */}
                <div className="h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${SCORE_BAR_COLOR[score]}`}
                    style={{ width: `${(score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* Average */}
        <div className="mt-5 bg-gradient-to-r from-brand-50 to-violet-50 rounded-2xl px-5 py-4 flex items-center justify-between border border-brand-100">
          <div>
            <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest mb-0.5">متوسط التقييم الكلي</p>
            <p className="text-xs text-gray-500">{SCORE_CONFIG[Math.round(avgRating)]?.label}</p>
          </div>
          <div className="text-3xl font-black text-brand-700 ltr-num">
            {avgRating.toFixed(1)}<span className="text-base text-brand-400">/5</span>
          </div>
        </div>
      </div>

      {/* ── SECTION 4: الملاحظات والملخص ── */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm">
        <SectionHeader num={4} title="ملاحظات الأستاذ والخلاصة" icon={<ClipboardList className="w-4 h-4 text-teal-500" />} />

        {/* AI button */}
        <button
          type="button"
          onClick={generateAISummary}
          disabled={!selectedStudentId || generatingAI}
          className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-brand-700 to-brand-600 hover:from-brand-800 hover:to-brand-700 disabled:opacity-50 text-white font-black py-3.5 px-5 rounded-2xl transition-all shadow-md mb-4"
        >
          {generatingAI ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              جارٍ توليد الملخص بالذكاء الاصطناعي...
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              ✨ توليد ملخص أكاديمي بالذكاء الاصطناعي
            </>
          )}
        </button>

        {aiError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-3 mb-4 space-y-2">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 text-xs font-medium">{aiError}</p>
            </div>
            <button
              type="button"
              onClick={generateLocalTemplate}
              className="w-full text-center text-xs font-black text-amber-700 bg-amber-100 hover:bg-amber-200 py-2 rounded-xl transition-colors"
            >
              📝 توليد نموذج محلي بدلاً من ذلك
            </button>
          </div>
        )}

        <div className="relative">
          <textarea
            value={professorNotes}
            onChange={e => setProfessorNotes(e.target.value)}
            rows={6}
            placeholder="اكتب ملاحظاتك الأكاديمية والسريرية حول الجلسة:&#10;• أداء الطفل العام خلال الجلسة&#10;• أبرز التحسينات الملحوظة&#10;• المجالات التي تحتاج مزيداً من الاهتمام&#10;• توصيات للأسرة هذا الأسبوع"
            className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm focus:ring-2 focus:ring-brand-300 focus:outline-none resize-none bg-gray-50 leading-relaxed text-gray-800 placeholder:text-gray-300"
          />
          <div className="absolute bottom-3 left-4 text-[10px] text-gray-300 ltr-num font-mono">
            {professorNotes.length}/3000
          </div>
        </div>

        {professorNotes.length > 0 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-100 rounded-xl px-3 py-2 flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
            <p className="text-emerald-700 text-xs font-bold">الملاحظات جاهزة — {professorNotes.split(' ').length} كلمة</p>
          </div>
        )}
      </div>

      {/* ── Summary preview ── */}
      <div className="bg-gray-900 rounded-3xl p-5 text-white">
        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">ملخص التقرير</p>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-white/5 rounded-2xl py-3">
            <p className="text-2xl font-black ltr-num">{completionPct}%</p>
            <p className="text-[10px] text-gray-400 mt-0.5">إنجاز</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-3">
            <p className="text-2xl font-black ltr-num">{avgRating.toFixed(1)}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">متوسط سلوكي</p>
          </div>
          <div className="bg-white/5 rounded-2xl py-3">
            <p className="text-2xl font-black ltr-num">{points}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">نقطة</p>
          </div>
        </div>
        {selectedStudent && (
          <p className="text-center text-gray-500 text-xs mt-3">
            {selectedStudent.firstName} {selectedStudent.lastName} · {selectedStudent.diagnosis} · {type === 'session' ? 'جلسة واحدة' : type === 'weekly' ? 'تقرير أسبوعي' : 'تقرير شهري'}
          </p>
        )}
      </div>

      {/* ── Submit ── */}
      <button
        onClick={submit}
        disabled={saving || !selectedStudentId}
        className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-brand-500/25 text-base"
      >
        {saving ? (
          <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
        ) : (
          <Save className="w-5 h-5" />
        )}
        حفظ التقرير الأكاديمي
      </button>

    </div>
  )
}
