'use client'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, ArrowRight, Play, CheckCircle, Users, BarChart2, Calendar, BookOpen, Star, Clock, Video, Brain, Target, Award } from 'lucide-react'

const STEPS = [
  {
    id: 'dashboard',
    label: 'لوحة التحكم',
    icon: BarChart2,
    color: 'brand',
  },
  {
    id: 'booking',
    label: 'حجز الجلسات',
    icon: Calendar,
    color: 'emerald',
  },
  {
    id: 'session',
    label: 'داخل الجلسة',
    icon: Video,
    color: 'blue',
  },
  {
    id: 'exercises',
    label: 'مكتبة التمارين',
    icon: BookOpen,
    color: 'purple',
  },
  {
    id: 'progress',
    label: 'تقارير التقدم',
    icon: BarChart2,
    color: 'amber',
  },
]

function DashboardMockup() {
  return (
    <div className="bg-gray-50 rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
      {/* Top bar */}
      <div className="bg-brand-900 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">A</div>
          <span className="text-white font-bold text-sm">أكاديمية أمين — بوابة الأولياء</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/10 rounded-full flex items-center justify-center">
            <span className="text-white text-xs font-bold">م.ع</span>
          </div>
        </div>
      </div>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-48 bg-white border-l border-gray-100 p-4 hidden md:block">
          {[
            { icon: BarChart2, label: 'نظرة عامة', active: true },
            { icon: Calendar, label: 'جلساتي' },
            { icon: BookOpen, label: 'تمارين اليوم' },
            { icon: BarChart2, label: 'تقارير أمير' },
            { icon: Users, label: 'حسابي' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-1 cursor-pointer ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-500 hover:bg-gray-50'}`}>
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{label}</span>
            </div>
          ))}
        </div>
        {/* Main content */}
        <div className="flex-1 p-5">
          <div className="mb-5">
            <h2 className="font-black text-gray-900 text-lg mb-1">مرحباً، محمد 👋</h2>
            <p className="text-gray-500 text-sm">الجلسة القادمة لأمير: اليوم الساعة 5:00 مساءً</p>
          </div>
          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-5">
            {[
              { label: 'جلسات هذا الشهر', value: '8', color: 'bg-brand-50 text-brand-700' },
              { label: 'مستوى التركيز', value: '+64%', color: 'bg-emerald-50 text-emerald-700' },
              { label: 'نقاط أمير', value: '1,240', color: 'bg-amber-50 text-amber-700' },
            ].map(({ label, value, color }) => (
              <div key={label} className={`${color} rounded-xl p-3 text-center`}>
                <div className="font-black text-xl ltr-num">{value}</div>
                <div className="text-xs mt-0.5 opacity-80">{label}</div>
              </div>
            ))}
          </div>
          {/* Next session card */}
          <div className="bg-brand-900 text-white rounded-2xl p-4 mb-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/70 text-xs">الجلسة القادمة</span>
              <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-0.5 rounded-full">مُؤكَّدة</span>
            </div>
            <h3 className="font-black text-base mb-1">جلسة الانتباه المستمر + تمارين APA</h3>
            <div className="flex items-center gap-4 text-white/70 text-xs">
              <span>📅 اليوم 5:00 م</span>
              <span>⏱️ 45 دقيقة</span>
              <span>👨‍⚕️ الأستاذ أمين</span>
            </div>
            <div className="mt-3">
              <div className="bg-white/20 rounded-xl py-2 px-4 text-center text-sm font-bold cursor-pointer hover:bg-white/30 transition-colors">
                ▶ انضم للجلسة الآن
              </div>
            </div>
          </div>
          {/* Today's exercises */}
          <div>
            <p className="text-xs font-bold text-gray-500 mb-2">تمارين اليوم لأمير</p>
            <div className="space-y-2">
              {[
                { name: 'تمرين ساعة الحركة', tag: 'APA', done: true },
                { name: 'بروتوكول Zone of Regulation', tag: 'ABA', done: false },
                { name: 'تمرين Go/No-Go', tag: 'CBT', done: false },
              ].map(({ name, tag, done }) => (
                <div key={name} className={`flex items-center gap-3 p-2.5 rounded-xl ${done ? 'bg-green-50' : 'bg-white border border-gray-100'}`}>
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${done ? 'bg-green-500' : 'border-2 border-gray-300'}`}>
                    {done && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-sm flex-1 ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{name}</span>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${tag === 'APA' ? 'bg-blue-100 text-blue-700' : tag === 'ABA' ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700'}`}>{tag}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingMockup() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
      <div className="bg-emerald-700 px-6 py-4">
        <h3 className="text-white font-black text-lg">حجز جلسة جديدة</h3>
        <p className="text-white/70 text-sm">اختر الوقت المناسب لك</p>
      </div>
      <div className="p-5">
        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-6">
          {['اختر النوع', 'اختر الوقت', 'تأكيد'].map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black ${i === 1 ? 'bg-emerald-600 text-white' : i === 0 ? 'bg-gray-200 text-gray-500' : 'border-2 border-gray-200 text-gray-300'}`}>{i + 1}</div>
              <span className={`text-xs ${i === 1 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-8 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
        {/* Calendar */}
        <p className="text-xs font-bold text-gray-500 mb-3">يونيو 2026</p>
        <div className="grid grid-cols-7 gap-1 mb-4 text-center">
          {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => (
            <div key={d} className="text-xs text-gray-400 font-bold py-1">{d}</div>
          ))}
          {Array.from({ length: 7 }, (_, i) => i + 1).map(d => (
            <div key={d} className={`text-sm py-2 rounded-lg cursor-pointer font-medium ${d === 4 ? 'bg-emerald-600 text-white font-black' : d === 5 || d === 6 ? 'text-gray-300' : 'hover:bg-emerald-50 text-gray-700'}`}>{d}</div>
          ))}
          {Array.from({ length: 7 }, (_, i) => i + 8).map(d => (
            <div key={d} className={`text-sm py-2 rounded-lg cursor-pointer font-medium ${d === 9 ? 'bg-emerald-50 text-emerald-700 border-2 border-emerald-200' : 'hover:bg-emerald-50 text-gray-700'}`}>{d}</div>
          ))}
        </div>
        {/* Time slots */}
        <p className="text-xs font-bold text-gray-500 mb-3">الفتحات المتاحة — الثلاثاء 4 يونيو</p>
        <div className="grid grid-cols-3 gap-2 mb-5">
          {['10:00 ص', '11:00 ص', '02:00 م', '03:00 م', '05:00 م', '06:00 م'].map((t, i) => (
            <div key={t} className={`text-center py-2.5 rounded-xl text-sm font-bold cursor-pointer border-2 ${i === 4 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600 hover:border-emerald-300'}`}>{t}</div>
          ))}
        </div>
        <div className="bg-emerald-600 text-white text-center py-3 rounded-2xl font-black cursor-pointer hover:bg-emerald-700 transition-colors">
          تأكيد الحجز ←
        </div>
      </div>
    </div>
  )
}

function SessionMockup() {
  return (
    <div className="bg-gray-900 rounded-2xl overflow-hidden border border-gray-700 shadow-2xl">
      {/* Video header */}
      <div className="bg-gray-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full" />
          <div className="w-2.5 h-2.5 bg-yellow-500 rounded-full" />
          <div className="w-2.5 h-2.5 bg-green-500 rounded-full" />
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/70 text-xs font-mono">مباشر — 23:14</span>
        </div>
        <div className="bg-red-600/20 text-red-400 text-xs font-bold px-2 py-1 rounded-lg">● LIVE</div>
      </div>
      {/* Main video area */}
      <div className="relative bg-gradient-to-br from-brand-900 to-brand-950 aspect-video flex items-center justify-center">
        {/* Instructor video */}
        <div className="text-center">
          <div className="w-20 h-20 bg-white/10 rounded-full mx-auto mb-3 flex items-center justify-center">
            <span className="text-4xl">👨‍⚕️</span>
          </div>
          <p className="text-white font-bold text-sm">الأستاذ أمين</p>
          <p className="text-white/60 text-xs">يشرح تمرين التسلسل العكسي</p>
        </div>
        {/* Exercise overlay */}
        <div className="absolute top-3 right-3 bg-white/10 backdrop-blur rounded-xl p-3 max-w-[160px]">
          <p className="text-white/70 text-xs mb-1 font-bold">التمرين الحالي</p>
          <p className="text-white text-xs font-black leading-tight">تحدي التسلسل المعكوس</p>
          <div className="flex gap-1 mt-2">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`w-5 h-5 rounded flex items-center justify-center text-xs font-black ${n <= 3 ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>{n}</div>
            ))}
          </div>
        </div>
        {/* Child video (small) */}
        <div className="absolute bottom-3 left-3 w-24 h-16 bg-gray-700 rounded-xl overflow-hidden border-2 border-white/20 flex items-center justify-center">
          <span className="text-2xl">👦</span>
        </div>
        {/* Points popup */}
        <div className="absolute top-3 left-3 bg-amber-400 text-amber-900 rounded-xl px-3 py-2 text-center">
          <div className="font-black text-lg ltr-num">+50</div>
          <div className="text-xs font-bold">نقطة 🌟</div>
        </div>
      </div>
      {/* Controls */}
      <div className="bg-gray-800 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {['🎤', '📷', '🖥️', '💬'].map(icon => (
            <button key={icon} className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-base transition-colors">{icon}</button>
          ))}
        </div>
        <div className="text-center">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full" />
            <span className="text-white/70 text-xs">جلسة تفاعلية مباشرة</span>
          </div>
        </div>
        <button className="bg-red-600 hover:bg-red-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors">إنهاء الجلسة</button>
      </div>
      {/* Side panel */}
      <div className="bg-gray-850 border-t border-gray-700 px-5 py-3">
        <div className="flex gap-4 text-xs">
          <div className="text-center">
            <div className="text-white font-black text-lg ltr-num">23</div>
            <div className="text-gray-400">دقيقة مضت</div>
          </div>
          <div className="text-center">
            <div className="text-emerald-400 font-black text-lg">عالي</div>
            <div className="text-gray-400">مستوى التركيز</div>
          </div>
          <div className="text-center">
            <div className="text-amber-400 font-black text-lg ltr-num">3/5</div>
            <div className="text-gray-400">تمارين منجزة</div>
          </div>
          <div className="text-center">
            <div className="text-white font-black text-lg ltr-num">150</div>
            <div className="text-gray-400">نقطة مكتسبة</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ExercisesMockup() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
      <div className="bg-purple-700 px-6 py-4">
        <h3 className="text-white font-black text-lg">مكتبة التمارين العلمية</h3>
        <p className="text-white/70 text-sm">+25 تمريناً مُعتمداً من APA / ABA / CBT</p>
      </div>
      <div className="p-5">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
          {[
            { label: 'الكل', active: true, color: 'bg-purple-600 text-white' },
            { label: 'APA', active: false, color: 'bg-blue-100 text-blue-700' },
            { label: 'ABA', active: false, color: 'bg-emerald-100 text-emerald-700' },
            { label: 'CBT', active: false, color: 'bg-purple-100 text-purple-700' },
          ].map(({ label, active, color }) => (
            <span key={label} className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap cursor-pointer ${color} ${active ? '' : 'hover:opacity-80'}`}>{label}</span>
          ))}
        </div>
        {/* Exercise cards */}
        <div className="space-y-3">
          {[
            {
              name: 'بروتوكول Zone of Regulation',
              type: 'ABA',
              age: '5-17',
              duration: '10 د',
              evidence: 'Kuypers 2011',
              color: 'border-emerald-200 bg-emerald-50',
              tag: 'bg-emerald-600',
            },
            {
              name: 'تحدي التسلسل المعكوس',
              type: 'CBT',
              age: '12-22',
              duration: '15 د',
              evidence: 'Cogmed-style',
              color: 'border-purple-200 bg-purple-50',
              tag: 'bg-purple-600',
            },
            {
              name: 'تمرين ساعة الحركة CPT',
              type: 'APA',
              age: '5-22',
              duration: '20 د',
              evidence: 'Ratey 2008',
              color: 'border-blue-200 bg-blue-50',
              tag: 'bg-blue-600',
            },
          ].map(({ name, type, age, duration, evidence, color, tag }) => (
            <div key={name} className={`rounded-xl border-2 p-3 ${color}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className={`text-white text-xs font-black px-2 py-0.5 rounded-full ${tag}`}>{type}</span>
                  <span className="text-gray-700 font-bold text-sm">{name}</span>
                </div>
                <span className="text-gray-400 text-xs ltr-num">⏱ {duration}</span>
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-500">
                <span>👶 {age} سنة</span>
                <span>📚 {evidence}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-center">
          <span className="text-purple-600 text-sm font-bold cursor-pointer hover:underline">عرض جميع التمارين (25+) ←</span>
        </div>
      </div>
    </div>
  )
}

function ProgressMockup() {
  const bars = [
    { label: 'الانتباه المستمر', value: 78, color: 'bg-brand-600' },
    { label: 'كبح التشتت', value: 62, color: 'bg-purple-500' },
    { label: 'الضبط الذاتي', value: 55, color: 'bg-emerald-500' },
    { label: 'المهارات الاجتماعية', value: 70, color: 'bg-blue-500' },
  ]
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-2xl">
      <div className="bg-amber-600 px-6 py-4 flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-lg">تقرير التقدم — أمير (9 سنوات)</h3>
          <p className="text-white/70 text-sm">الشهر الثالث من البرنامج</p>
        </div>
        <div className="text-center">
          <div className="text-white font-black text-3xl ltr-num">A+</div>
          <div className="text-white/70 text-xs">التقييم العام</div>
        </div>
      </div>
      <div className="p-5">
        {/* AI Summary */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-amber-600" />
            <span className="text-amber-700 font-bold text-sm">ملخص الأستاذ أمين</span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed">
            أمير يُظهر تحسناً ملحوظاً في الانتباه المستمر — ارتفع من 3 دقائق إلى 8 دقائق دون انقطاع.
            <strong className="text-amber-700"> أنصح بالتركيز على بروتوكول Zone of Regulation هذا الشهر.</strong>
          </p>
        </div>
        {/* Progress bars */}
        <div className="space-y-4 mb-5">
          {bars.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-700 font-medium">{label}</span>
                <span className="text-sm font-black ltr-num text-gray-900">{value}%</span>
              </div>
              <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${value}%` }} />
              </div>
            </div>
          ))}
        </div>
        {/* Monthly comparison */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'الجلسات', value: '12', sub: 'هذا الشهر', color: 'bg-brand-50 text-brand-700' },
            { label: 'الإنجازات', value: '+8', sub: 'شارة جديدة', color: 'bg-amber-50 text-amber-700' },
            { label: 'نقاط', value: '3,240', sub: 'إجمالي', color: 'bg-emerald-50 text-emerald-700' },
          ].map(({ label, value, sub, color }) => (
            <div key={label} className={`${color} rounded-xl p-3 text-center`}>
              <div className="font-black text-xl ltr-num">{value}</div>
              <div className="text-xs font-bold mt-0.5">{label}</div>
              <div className="text-xs opacity-60 mt-0.5">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

const MOCKUPS: Record<string, React.ReactNode> = {
  dashboard: <DashboardMockup />,
  booking: <BookingMockup />,
  session: <SessionMockup />,
  exercises: <ExercisesMockup />,
  progress: <ProgressMockup />,
}

const DESCRIPTIONS: Record<string, { title: string; desc: string; points: string[] }> = {
  dashboard: {
    title: 'لوحة تحكم الولي',
    desc: 'كل شيء تحتاجه في مكان واحد — الجلسات القادمة، تمارين اليوم، ونقاط طفلك.',
    points: ['عرض مباشر لتمارين اليوم', 'انضم للجلسة بنقرة واحدة', 'متابعة نقاط وإنجازات طفلك', 'تقرير أسبوعي موجز'],
  },
  booking: {
    title: 'حجز الجلسات',
    desc: 'اختر الوقت الأنسب لك وطفلك من تقويم متزامن مع جدول الأستاذ.',
    points: ['جدول متزامن لحظياً', 'تأكيد فوري عبر البريد والواتساب', 'إمكانية إلغاء أو تأجيل مجاني', 'تذكير تلقائي قبل الجلسة بساعة'],
  },
  session: {
    title: 'داخل الجلسة التفاعلية',
    desc: 'ليست مجرد مكالمة فيديو — جلسة حركية تفاعلية مع تتبع تركيز الطفل في الوقت الفعلي.',
    points: ['فيديو عالي الجودة مع أدوات تفاعلية', 'تمارين APA/ABA/CBT مباشرة', 'نظام نقاط يُحفّز الطفل لحظياً', 'ملاحظات تلقائية بعد كل جلسة'],
  },
  exercises: {
    title: 'مكتبة التمارين العلمية',
    desc: '+25 تمريناً مُصمَّماً وفق أحدث أبحاث ADHD والتوحد — قابلة للتطبيق في المنزل.',
    points: ['مُصنَّفة حسب APA / ABA / CBT', 'فيديو إرشادي لكل تمرين', 'مناسبة للأعمار 5-22 سنة', 'تحديث شهري بتمارين جديدة'],
  },
  progress: {
    title: 'تقارير التقدم الذكية',
    desc: 'تقرير شهري مفصّل يقيس التحسن في الانتباه والسلوك والمهارات الاجتماعية.',
    points: ['قياس موضوعي بمعايير علمية', 'رسوم بيانية للتطور عبر الزمن', 'ملخص مكتوب من الأستاذ', 'مقارنة بالمعدلات المرجعية'],
  },
}

export default function DemoPage() {
  const [active, setActive] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-brand-900 text-white py-5 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center font-black text-lg">A</div>
            <div>
              <span className="font-black text-base block leading-none">أكاديمية أمين</span>
              <span className="text-white/60 text-xs">جولة تجريبية للمنصة</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-white/70 hover:text-white text-sm transition-colors">
              ← العودة للرئيسية
            </Link>
            <Link href="/register" className="bg-white text-brand-700 font-black text-sm px-5 py-2.5 rounded-xl hover:bg-brand-50 transition-colors">
              سجّل الآن
            </Link>
          </div>
        </div>
      </div>

      {/* Hero banner */}
      <div className="bg-gradient-to-l from-brand-800 to-brand-950 text-white py-14 px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-4 py-2 mb-6 text-sm">
          <Play className="w-4 h-4" />
          جولة تفاعلية — شاهد المنصة قبل التسجيل
        </div>
        <h1 className="text-3xl md:text-5xl font-black mb-4">
          اكتشف كيف تعمل
          <span className="block text-transparent bg-clip-text bg-gradient-to-l from-calm-teal to-calm-lavender">
            أكاديمية أمين
          </span>
        </h1>
        <p className="text-white/70 text-lg max-w-xl mx-auto mb-8">
          جولة مرئية كاملة في كل أجزاء المنصة — من حجز الجلسة إلى تقرير التقدم.
        </p>
        <div className="flex items-center justify-center gap-6 flex-wrap text-sm">
          {[
            { icon: Video, label: 'جلسات تفاعلية مباشرة' },
            { icon: Brain, label: '25+ تمرين علمي' },
            { icon: BarChart2, label: 'تقارير تقدم مفصّلة' },
            { icon: Target, label: 'نظام نقاط تحفيزي' },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-white/80">
              <Icon className="w-4 h-4 text-calm-teal" />
              {label}
            </div>
          ))}
        </div>
      </div>

      {/* Main demo area */}
      <div className="max-w-6xl mx-auto px-6 py-12">

        {/* Step nav */}
        <div className="flex flex-wrap gap-2 justify-center mb-10">
          {STEPS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActive(id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all ${
                active === id
                  ? 'bg-brand-600 text-white shadow-lg scale-105'
                  : 'bg-white text-gray-600 hover:bg-brand-50 hover:text-brand-700 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          {/* Left: description */}
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-gray-900 mb-4">
              {DESCRIPTIONS[active].title}
            </h2>
            <p className="text-gray-600 text-lg leading-relaxed mb-6">
              {DESCRIPTIONS[active].desc}
            </p>
            <ul className="space-y-3 mb-8">
              {DESCRIPTIONS[active].points.map(point => (
                <li key={point} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-brand-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{point}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/register" className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-black px-6 py-3.5 rounded-2xl transition-colors">
                ابدأ التسجيل المجاني
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <Link href="#plans" className="flex items-center justify-center gap-2 border-2 border-brand-200 text-brand-700 hover:bg-brand-50 font-bold px-6 py-3.5 rounded-2xl transition-colors">
                عرض الخطط والأسعار
              </Link>
            </div>
          </div>
          {/* Right: mockup */}
          <div className="w-full">
            {MOCKUPS[active]}
          </div>
        </div>

        {/* Navigation arrows */}
        <div className="flex items-center justify-center gap-4 mt-10">
          <button
            onClick={() => {
              const idx = STEPS.findIndex(s => s.id === active)
              if (idx > 0) setActive(STEPS[idx - 1].id)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors disabled:opacity-30"
            disabled={STEPS.findIndex(s => s.id === active) === 0}
          >
            <ArrowRight className="w-4 h-4" />
            السابق
          </button>
          <div className="flex gap-2">
            {STEPS.map(({ id }) => (
              <button key={id} onClick={() => setActive(id)} className={`w-2.5 h-2.5 rounded-full transition-all ${active === id ? 'bg-brand-600 w-6' : 'bg-gray-300'}`} />
            ))}
          </div>
          <button
            onClick={() => {
              const idx = STEPS.findIndex(s => s.id === active)
              if (idx < STEPS.length - 1) setActive(STEPS[idx + 1].id)
            }}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors disabled:opacity-30"
            disabled={STEPS.findIndex(s => s.id === active) === STEPS.length - 1}
          >
            التالي
            <ArrowLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="bg-brand-950 text-white py-12 px-6 mt-8">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-center font-black text-2xl mb-8 text-white">نتائج حقيقية من عائلات حقيقية</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: '+200', label: 'طفل في البرنامج', icon: Users },
              { value: '98%', label: 'رضا أولياء الأمور', icon: Star },
              { value: '45 د', label: 'مدة الجلسة الواحدة', icon: Clock },
              { value: '+5', label: 'سنوات خبرة', icon: Award },
            ].map(({ value, label, icon: Icon }) => (
              <div key={label}>
                <Icon className="w-6 h-6 text-calm-teal mx-auto mb-2" />
                <div className="font-black text-3xl ltr-num mb-1">{value}</div>
                <div className="text-white/60 text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How a session works — timeline */}
      <div className="max-w-4xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <span className="inline-block text-brand-600 font-bold text-sm bg-brand-50 px-4 py-1.5 rounded-full mb-4">
            كيف تسير الجلسة؟
          </span>
          <h2 className="text-3xl font-black text-gray-900 mb-3">45 دقيقة تُغيّر الأسبوع</h2>
          <p className="text-gray-500 text-lg">كل جلسة مُهيكَلة بدقة لتحقيق أقصى تأثير في أقل وقت</p>
        </div>
        <div className="relative">
          <div className="absolute right-8 top-8 bottom-8 w-0.5 bg-brand-100 hidden md:block" />
          <div className="space-y-6">
            {[
              {
                time: '0 — 5 د',
                title: 'التحقق الحسي',
                desc: 'الأستاذ يقيم مستوى طاقة الطفل ويختار البروتوكول الأنسب لليوم.',
                icon: '🔍',
                color: 'border-blue-200 bg-blue-50',
              },
              {
                time: '5 — 20 د',
                title: 'التمارين الحركية APA',
                desc: 'تمارين جسدية مُصممة لرفع الدوبامين وتحضير الدماغ للتعلم — مثل تمارين التوازن والتنسيق الحركي.',
                icon: '🏃',
                color: 'border-brand-200 bg-brand-50',
              },
              {
                time: '20 — 35 د',
                title: 'التدريب المعرفي والسلوكي',
                desc: 'تطبيق بروتوكولات ABA / CBT — Zone of Regulation، Token Economy، تمارين الانتباه.',
                icon: '🧠',
                color: 'border-purple-200 bg-purple-50',
              },
              {
                time: '35 — 40 د',
                title: 'الاسترخاء والتعزيز',
                desc: 'تمارين تنفس هادئة، حساب النقاط، وشارة الإنجاز للطفل.',
                icon: '⭐',
                color: 'border-amber-200 bg-amber-50',
              },
              {
                time: '40 — 45 د',
                title: 'إحاطة الولي',
                desc: 'الأستاذ يشرح لولي الأمر ما تم تحقيقه، ويُعطي توصيات للمنزل حتى الجلسة القادمة.',
                icon: '💬',
                color: 'border-emerald-200 bg-emerald-50',
              },
            ].map(({ time, title, desc, icon, color }) => (
              <div key={time} className={`relative flex items-start gap-5 rounded-2xl border-2 p-5 md:pr-14 ${color}`}>
                <div className="absolute right-6 top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-brand-300 rounded-full hidden md:block" />
                <div className="text-3xl flex-shrink-0 md:hidden">{icon}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-2xl hidden md:block">{icon}</span>
                    <span className="text-xs font-mono text-gray-500 ltr-num bg-white/70 px-2 py-0.5 rounded-full">{time}</span>
                    <h3 className="font-black text-gray-900">{title}</h3>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gradient-to-l from-brand-800 to-brand-950 py-16 px-6 text-center">
        <h2 className="text-3xl md:text-4xl font-black text-white mb-4">
          هل أنت مستعد للبدء؟
        </h2>
        <p className="text-white/70 text-lg mb-8 max-w-lg mx-auto">
          الجلسة التقييمية الأولى مجانية — يحدد فيها الأستاذ أمين نوع البرنامج المناسب لطفلك.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/register" className="flex items-center gap-2 bg-white text-brand-700 hover:bg-brand-50 font-black text-lg px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-xl">
            احجز الجلسة التقييمية المجانية
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Link href="/" className="text-white/70 hover:text-white font-bold text-base transition-colors">
            العودة للرئيسية ←
          </Link>
        </div>
      </div>
    </div>
  )
}
