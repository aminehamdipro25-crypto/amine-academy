'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Plus, Save, Target, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import { fadeUp, staggerContainer } from '@/lib/motion'

// ── Goal library (evidence-based therapeutic goals) ──────────────
const GOAL_LIBRARY = [
  // Attention
  { id: 'att-1', domain: 'انتباه', text: 'تحسين مدة الانتباه المستمر إلى 10 دقائق متواصلة', weeks: 6 },
  { id: 'att-2', domain: 'انتباه', text: 'تقليل الانشتات الخارجي بنسبة 50% خلال أنشطة الفصل', weeks: 8 },
  { id: 'att-3', domain: 'انتباه', text: 'اتباع تعليمات متعددة الخطوات (3 خطوات) باستقلالية', weeks: 10 },
  // Memory
  { id: 'mem-1', domain: 'ذاكرة', text: 'تحسين الذاكرة العاملة: تذكر 5 عناصر بعد 30 ثانية', weeks: 8 },
  { id: 'mem-2', domain: 'ذاكرة', text: 'تعزيز الذاكرة الإجرائية: اتباع روتين يومي بدون تذكير', weeks: 12 },
  // Language / Reading
  { id: 'lang-1', domain: 'لغة وقراءة', text: 'قراءة 20 كلمة جديدة بطلاقة في الدقيقة', weeks: 10 },
  { id: 'lang-2', domain: 'لغة وقراءة', text: 'تمييز الحروف المتشابهة (ب/ت/ث) بدقة 90%', weeks: 8 },
  { id: 'lang-3', domain: 'لغة وقراءة', text: 'تحسين التعبير الشفهي: بناء جملة من 5 كلمات', weeks: 6 },
  // Social / Emotional
  { id: 'soc-1', domain: 'اجتماعي وعاطفي', text: 'التعرف على 5 مشاعر أساسية ووصفها لفظياً', weeks: 6 },
  { id: 'soc-2', domain: 'اجتماعي وعاطفي', text: 'تطبيق 3 استراتيجيات للتهدئة الذاتية عند الضغط', weeks: 8 },
  { id: 'soc-3', domain: 'اجتماعي وعاطفي', text: 'المشاركة في نشاط جماعي بدون سلوك تحدٍّ', weeks: 10 },
  // Motor
  { id: 'mot-1', domain: 'حركي', text: 'تحسين التناسق بين اليدين في الأنشطة الدقيقة', weeks: 8 },
  { id: 'mot-2', domain: 'حركي', text: 'تعزيز عبور خط المنتصف في 80% من الجلسات', weeks: 6 },
  // Behavior
  { id: 'beh-1', domain: 'سلوك', text: 'تقليل نوبات الغضب إلى أقل من 2 في الأسبوع', weeks: 12 },
  { id: 'beh-2', domain: 'سلوك', text: 'اتباع التعليمات الأولى في 80% من المرات', weeks: 8 },
  { id: 'beh-3', domain: 'سلوك', text: 'البقاء في مقعده طوال النشاط (20 دقيقة)', weeks: 6 },
]

const DOMAINS = [...new Set(GOAL_LIBRARY.map(g => g.domain))]

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'not-started': { label: 'لم يبدأ',   color: '#6B7280', bg: '#F3F4F6' },
  'in-progress': { label: 'جارٍ',      color: '#2563EB', bg: '#EFF6FF' },
  'achieved':    { label: 'تحقّق ✓',   color: '#16A34A', bg: '#F0FDF4' },
  'on-hold':     { label: 'متوقف',     color: '#D97706', bg: '#FFFBEB' },
}

interface PlanGoal {
  id: string
  goalId: string
  text: string
  domain: string
  targetWeeks: number
  status: 'not-started' | 'in-progress' | 'achieved' | 'on-hold'
  notes: string
  startDate: string
}

interface Client {
  id: string
  firstName: string
  lastName: string
  students: Array<{ id: string; firstName: string; diagnosis: string }>
}

export default function TreatmentPlanPage() {
  const [clients, setClients]         = useState<Client[]>([])
  const [loading, setLoading]         = useState(true)
  const [saving, setSaving]           = useState(false)
  const [success, setSuccess]         = useState(false)
  const [parentId, setParentId]       = useState('')
  const [studentId, setStudentId]     = useState('')
  const [filterDomain, setFilterDomain] = useState('الكل')
  const [planGoals, setPlanGoals]     = useState<PlanGoal[]>([])
  const [planTitle, setPlanTitle]     = useState('خطة علاج شاملة')
  const [customGoal, setCustomGoal]   = useState('')

  useEffect(() => {
    fetch('/api/clients').then(r => r.json()).then(d => {
      setClients(d.parents ?? [])
    }).finally(() => setLoading(false))
  }, [])

  const selectedClient = clients.find(c => c.id === parentId)
  const selectedStudent = selectedClient?.students.find(s => s.id === studentId)

  function addGoalFromLibrary(goal: typeof GOAL_LIBRARY[0]) {
    if (planGoals.find(g => g.goalId === goal.id)) return
    setPlanGoals(prev => [...prev, {
      id: crypto.randomUUID(),
      goalId: goal.id,
      text: goal.text,
      domain: goal.domain,
      targetWeeks: goal.weeks,
      status: 'not-started',
      notes: '',
      startDate: new Date().toISOString().slice(0, 10),
    }])
  }

  function addCustomGoal() {
    if (!customGoal.trim()) return
    setPlanGoals(prev => [...prev, {
      id: crypto.randomUUID(),
      goalId: 'custom-' + Date.now(),
      text: customGoal.trim(),
      domain: 'مخصص',
      targetWeeks: 8,
      status: 'not-started',
      notes: '',
      startDate: new Date().toISOString().slice(0, 10),
    }])
    setCustomGoal('')
  }

  function updateGoal(id: string, field: keyof PlanGoal, value: string | number) {
    setPlanGoals(prev => prev.map(g => g.id === id ? { ...g, [field]: value } : g))
  }

  function removeGoal(id: string) {
    setPlanGoals(prev => prev.filter(g => g.id !== id))
  }

  async function savePlan() {
    if (!studentId || planGoals.length === 0) return
    setSaving(true)
    try {
      await fetch('/api/students/' + studentId + '/treatment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: planTitle, goals: planGoals }),
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch { /* silent */ } finally { setSaving(false) }
  }

  const filtered = filterDomain === 'الكل'
    ? GOAL_LIBRARY
    : GOAL_LIBRARY.filter(g => g.domain === filterDomain)

  return (
    <div className="p-6 max-w-6xl mx-auto" dir="rtl">
      <motion.div {...fadeUp} className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">خطة العلاج الفردية (IEP)</h1>
        <p className="text-gray-500 text-sm mt-1">بناء خطة علاج مخصصة لكل طالب بأهداف قابلة للقياس</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Setup + Goal Library */}
        <div className="space-y-4">
          {/* Student selector */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-black text-gray-800 text-sm mb-3">اختيار الطالب</h2>
            {loading ? (
              <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-brand-500" /></div>
            ) : (
              <div className="space-y-2">
                <select value={parentId} onChange={e => { setParentId(e.target.value); setStudentId('') }}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                  <option value="">اختر ولي الأمر</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>
                  ))}
                </select>
                {selectedClient && (
                  <select value={studentId} onChange={e => setStudentId(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
                    <option value="">اختر الطالب</option>
                    {selectedClient.students.map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} — {s.diagnosis}</option>
                    ))}
                  </select>
                )}
                {selectedStudent && (
                  <input value={planTitle} onChange={e => setPlanTitle(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    placeholder="عنوان الخطة" />
                )}
              </div>
            )}
          </div>

          {/* Goal library */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-black text-gray-800 text-sm mb-3">مكتبة الأهداف العلاجية</h2>
            <div className="flex flex-wrap gap-1 mb-3">
              {['الكل', ...DOMAINS].map(d => (
                <button key={d} onClick={() => setFilterDomain(d)}
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                    filterDomain === d ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}>{d}</button>
              ))}
            </div>
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {filtered.map(goal => {
                const added = planGoals.some(g => g.goalId === goal.id)
                return (
                  <button key={goal.id} onClick={() => addGoalFromLibrary(goal)} disabled={added}
                    className={`w-full text-right px-3 py-2 rounded-xl text-xs transition-all ${
                      added ? 'bg-green-50 text-green-700 cursor-not-allowed' : 'bg-gray-50 hover:bg-brand-50 text-gray-700 hover:text-brand-700'
                    }`}
                  >
                    <div className="font-bold leading-snug">{goal.text}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{goal.domain} · {goal.weeks} أسابيع</div>
                    {added && <div className="text-[10px] text-green-600 mt-0.5">✓ مضاف</div>}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Custom goal */}
          <div className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
            <h2 className="font-black text-gray-800 text-sm mb-2">هدف مخصص</h2>
            <textarea value={customGoal} onChange={e => setCustomGoal(e.target.value)}
              placeholder="اكتب هدفاً مخصصاً..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              rows={3} />
            <button onClick={addCustomGoal} disabled={!customGoal.trim()}
              className="mt-2 w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold py-2 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
              <Plus className="w-4 h-4" /> إضافة الهدف
            </button>
          </div>
        </div>

        {/* Right: Plan builder */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-gray-800">
              الأهداف المختارة
              {planGoals.length > 0 && (
                <span className="mr-2 text-brand-600 text-sm">({planGoals.length} هدف)</span>
              )}
            </h2>
            {planGoals.length > 0 && (
              <button onClick={savePlan} disabled={!studentId || saving}
                className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white font-bold px-4 py-2 rounded-xl text-sm transition-colors">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                {success ? '✓ تم الحفظ' : 'حفظ الخطة'}
              </button>
            )}
          </div>

          {planGoals.length === 0 ? (
            <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-12 text-center">
              <Target className="w-12 h-12 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">اختر أهدافاً من المكتبة</p>
              <p className="text-gray-300 text-sm mt-1">أو أضف هدفاً مخصصاً</p>
            </div>
          ) : (
            <motion.div {...staggerContainer} className="space-y-3">
              {planGoals.map(goal => {
                const status = STATUS_LABELS[goal.status]
                const targetDate = new Date(goal.startDate)
                targetDate.setDate(targetDate.getDate() + goal.targetWeeks * 7)
                return (
                  <motion.div key={goal.id} {...fadeUp}
                    className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] bg-brand-50 text-brand-700 font-black px-2 py-0.5 rounded-full">
                            {goal.domain}
                          </span>
                          <span className="text-[10px] text-gray-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {goal.targetWeeks} أسبوع
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 leading-snug">{goal.text}</p>
                      </div>
                      <button onClick={() => removeGoal(goal.id)}
                        className="text-gray-300 hover:text-red-500 transition-colors text-lg leading-none flex-shrink-0">
                        ×
                      </button>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">الحالة</label>
                        <select value={goal.status}
                          onChange={e => updateGoal(goal.id, 'status', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none"
                          style={{ color: status.color }}
                        >
                          {Object.entries(STATUS_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>{v.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">تاريخ البدء</label>
                        <input type="date" value={goal.startDate}
                          onChange={e => updateGoal(goal.id, 'startDate', e.target.value)}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none ltr-num" />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-400 font-bold block mb-1">الأسابيع المستهدفة</label>
                        <input type="number" value={goal.targetWeeks} min={1} max={52}
                          onChange={e => updateGoal(goal.id, 'targetWeeks', Number(e.target.value))}
                          className="w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none ltr-num" />
                      </div>
                    </div>
                    {goal.status === 'achieved' && (
                      <div className="mt-2 flex items-center gap-1 text-green-600 text-xs font-bold">
                        <CheckCircle2 className="w-4 h-4" /> تحقّق الهدف
                      </div>
                    )}
                    <div className="mt-2">
                      <input value={goal.notes} onChange={e => updateGoal(goal.id, 'notes', e.target.value)}
                        placeholder="ملاحظات على هذا الهدف..."
                        className="w-full text-xs border border-gray-100 rounded-lg px-2 py-1.5 focus:outline-none bg-gray-50 focus:bg-white transition-colors" />
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          )}

          {/* Summary strip */}
          {planGoals.length > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {(['not-started', 'in-progress', 'achieved'] as const).map(s => (
                <div key={s} className="rounded-2xl p-3 text-center border"
                  style={{ background: STATUS_LABELS[s].bg, borderColor: STATUS_LABELS[s].color + '30' }}>
                  <div className="text-2xl font-black" style={{ color: STATUS_LABELS[s].color }}>
                    {planGoals.filter(g => g.status === s).length}
                  </div>
                  <div className="text-xs font-bold" style={{ color: STATUS_LABELS[s].color }}>
                    {STATUS_LABELS[s].label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
