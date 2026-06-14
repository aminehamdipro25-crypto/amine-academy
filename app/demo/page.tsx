'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Pause, Volume2, VolumeX, BarChart2, Calendar, BookOpen, Users, Star, Clock, Award, Brain } from 'lucide-react'

const SLIDE_DURATION = 7000
const FADE_MS = 450

// ─── Ambient music ────────────────────────────────────────────────────────────
function createAmbientMusic(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 3)
  master.connect(ctx.destination)

  const bass = ctx.createOscillator()
  bass.type = 'sine'
  bass.frequency.value = 110
  const bassG = ctx.createGain()
  bassG.gain.value = 0.45
  bass.connect(bassG)
  bassG.connect(master)
  bass.start()

  const padFreqs = [220, 261.63, 329.63, 392]
  const padOscs = padFreqs.map(freq => {
    const osc = ctx.createOscillator()
    osc.type = 'triangle'
    osc.frequency.value = freq
    const g = ctx.createGain()
    g.gain.value = 0.06
    osc.connect(g)
    g.connect(master)
    osc.start()
    return osc
  })

  const arpNotes = [523.25, 659.26, 783.99, 880, 783.99, 659.26, 523.25, 440]
  let ni = 0
  const arpTimer = setInterval(() => {
    const t = ctx.currentTime
    const osc = ctx.createOscillator()
    osc.type = 'sine'
    osc.frequency.value = arpNotes[ni % arpNotes.length]
    ni++
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, t)
    g.gain.linearRampToValueAtTime(0.07, t + 0.06)
    g.gain.exponentialRampToValueAtTime(0.001, t + 2)
    osc.connect(g)
    g.connect(master)
    osc.start(t)
    osc.stop(t + 2.1)
  }, 1800)

  return () => {
    clearInterval(arpTimer)
    const now = ctx.currentTime
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 1.5)
    setTimeout(() => {
      try { bass.stop(); padOscs.forEach(o => o.stop()) } catch (_) { /* ignore */ }
    }, 2000)
  }
}

// ─── Browser chrome frame ─────────────────────────────────────────────────────
function BrowserFrame({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.08)' }}>
      <div style={{ background: '#1c1c2e', padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => (
            <div key={c} style={{ width: 12, height: 12, borderRadius: 6, background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, background: '#2a2a3e', borderRadius: 8, padding: '5px 12px', fontSize: 11, fontFamily: 'monospace', color: '#9CA3AF', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          🔒 {url}
        </div>
      </div>
      <div style={{ maxHeight: 420, overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// ─── Slide mockups ────────────────────────────────────────────────────────────

function RegisterMockup() {
  return (
    <div style={{ background: '#F8F5FF', padding: '24px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: 18 }}>
        <div style={{ width: 50, height: 50, borderRadius: 16, background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px', boxShadow: '0 8px 24px rgba(107,70,240,.35)' }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 22 }}>أ</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 16, color: '#1a1a2e', marginBottom: 3 }}>إنشاء حساب الولي</div>
        <div style={{ fontSize: 12, color: '#9CA3AF' }}>خطوتان فقط للبدء</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginBottom: 18 }}>
        {['معلوماتك', 'طفلك', 'تأكيد'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{ width: 22, height: 22, borderRadius: 11, background: i === 0 ? '#6B46F0' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 900, color: i === 0 ? 'white' : '#9CA3AF' }}>{i + 1}</div>
            <span style={{ fontSize: 11, color: i === 0 ? '#6B46F0' : '#9CA3AF', fontWeight: i === 0 ? 700 : 400 }}>{s}</span>
            {i < 2 && <div style={{ width: 14, height: 1, background: '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[
        { label: 'الاسم الكامل', ph: 'مثال: محمد العمري' },
        { label: 'البريد الإلكتروني', ph: 'email@example.com' },
        { label: 'كلمة المرور', ph: '••••••••' },
        { label: 'رقم الهاتف (واتساب)', ph: '+966 5X XXX XXXX' },
      ].map(({ label, ph }) => (
        <div key={label} style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#374151', marginBottom: 4 }}>{label}</div>
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 10, padding: '9px 12px', fontSize: 12, color: '#9CA3AF' }}>{ph}</div>
        </div>
      ))}
      <div style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', textAlign: 'center', padding: '12px 24px', borderRadius: 12, fontWeight: 900, fontSize: 13, marginTop: 10, boxShadow: '0 8px 24px rgba(107,70,240,.3)' }}>
        التالي — معلومات طفلك ←
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-gray-50">
      <div className="bg-brand-900 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-sm">أ</div>
          <span className="text-white font-bold text-xs">أكاديمية أمين — بوابة الأولياء</span>
        </div>
        <div className="w-7 h-7 bg-white/10 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-bold">م.ع</span>
        </div>
      </div>
      <div className="flex">
        <div className="w-40 bg-white border-l border-gray-100 p-3 hidden md:block">
          {[
            { icon: BarChart2, label: 'نظرة عامة', active: true },
            { icon: Calendar, label: 'جلساتي' },
            { icon: BookOpen, label: 'تمارين اليوم' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className={`flex items-center gap-2 px-2.5 py-2 rounded-xl mb-1 ${active ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}>
              <Icon className="w-3.5 h-3.5" /><span className="text-xs font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 p-4">
          <div className="mb-4">
            <h2 className="font-black text-gray-900 text-base mb-0.5">مرحباً، محمد 👋</h2>
            <p className="text-gray-400 text-xs">الجلسة القادمة لأمير: اليوم الساعة 5:00 مساءً</p>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {[
              { label: 'جلسات الشهر', value: '8', cls: 'bg-brand-50 text-brand-700' },
              { label: 'مستوى التركيز', value: '+64%', cls: 'bg-emerald-50 text-emerald-700' },
              { label: 'نقاط أمير', value: '1,240', cls: 'bg-amber-50 text-amber-700' },
            ].map(({ label, value, cls }) => (
              <div key={label} className={`${cls} rounded-xl p-2.5 text-center`}>
                <div className="font-black text-lg">{value}</div>
                <div className="text-[10px] mt-0.5 opacity-80">{label}</div>
              </div>
            ))}
          </div>
          <div className="bg-brand-900 text-white rounded-2xl p-3.5 mb-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 text-[10px]">الجلسة القادمة</span>
              <span className="bg-green-400 text-green-900 text-[10px] font-bold px-2 py-0.5 rounded-full">مُؤكَّدة</span>
            </div>
            <p className="font-black text-sm mb-1.5">جلسة الانتباه المستمر + تمارين APA</p>
            <div className="flex items-center gap-3 text-white/60 text-[10px]">
              <span>📅 اليوم 5:00 م</span><span>⏱️ 45 دقيقة</span>
            </div>
            <div className="mt-2.5 bg-white/20 rounded-xl py-1.5 px-3 text-center text-xs font-bold">
              ▶ انضم للجلسة الآن
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingMockup() {
  return (
    <div className="bg-white">
      <div className="bg-emerald-700 px-5 py-3.5">
        <h3 className="text-white font-black text-base">حجز جلسة جديدة</h3>
        <p className="text-white/70 text-xs">اختر الوقت المناسب لك</p>
      </div>
      <div className="p-5">
        <div className="flex items-center gap-2 mb-5">
          {['اختر النوع', 'اختر الوقت', 'تأكيد'].map((s, i) => (
            <div key={s} className="flex items-center gap-1.5">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${i === 1 ? 'bg-emerald-600 text-white' : i === 0 ? 'bg-gray-200 text-gray-500' : 'border-2 border-gray-200 text-gray-300'}`}>{i + 1}</div>
              <span className={`text-xs ${i === 1 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-6 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
        <p className="text-xs font-bold text-gray-500 mb-2">يونيو 2026</p>
        <div className="grid grid-cols-7 gap-1 mb-3 text-center">
          {['أح','إث','ثل','أر','خم','جم','سب'].map(d => (
            <div key={d} className="text-[10px] text-gray-400 font-bold py-1">{d}</div>
          ))}
          {Array.from({ length: 7 }, (_, i) => i + 1).map(d => (
            <div key={d} className={`text-xs py-1.5 rounded-lg cursor-pointer font-medium ${d === 4 ? 'bg-emerald-600 text-white font-black' : d === 5 || d === 6 ? 'text-gray-300' : 'text-gray-700'}`}>{d}</div>
          ))}
          {Array.from({ length: 7 }, (_, i) => i + 8).map(d => (
            <div key={d} className={`text-xs py-1.5 rounded-lg cursor-pointer font-medium ${d === 9 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'text-gray-700'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-4">
          {['10:00 ص','11:00 ص','02:00 م','03:00 م','05:00 م','06:00 م'].map((t, i) => (
            <div key={t} className={`text-center py-2 rounded-xl text-xs font-bold border-2 ${i === 4 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>{t}</div>
          ))}
        </div>
        <div className="bg-emerald-600 text-white text-center py-2.5 rounded-2xl font-black text-sm">تأكيد الحجز ←</div>
      </div>
    </div>
  )
}

function SessionMockup() {
  return (
    <div className="bg-gray-900">
      <div className="bg-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 bg-red-500 rounded-full" />
          <div className="w-2 h-2 bg-yellow-500 rounded-full" />
          <div className="w-2 h-2 bg-green-500 rounded-full" />
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/60 text-xs font-mono">مباشر — 23:14</span>
        </div>
        <div className="bg-red-600/20 text-red-400 text-[10px] font-bold px-2 py-0.5 rounded">● LIVE</div>
      </div>
      <div className="relative bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="text-center">
          <div className="w-16 h-16 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center">
            <span className="text-3xl">👨‍⚕️</span>
          </div>
          <p className="text-white font-bold text-sm">الأستاذ أمين</p>
          <p className="text-white/50 text-xs">يشرح تمرين التسلسل العكسي</p>
        </div>
        <div className="absolute top-2 right-2 bg-white/10 backdrop-blur rounded-xl p-2.5 max-w-[140px]">
          <p className="text-white/70 text-[10px] mb-1 font-bold">التمرين الحالي</p>
          <p className="text-white text-[10px] font-black leading-tight">تحدي التسلسل المعكوس</p>
          <div className="flex gap-1 mt-1.5">
            {[1,2,3,4,5].map(n => (
              <div key={n} className={`w-4 h-4 rounded flex items-center justify-center text-[9px] font-black ${n <= 3 ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>{n}</div>
            ))}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 w-20 h-14 bg-gray-700 rounded-xl flex items-center justify-center border border-white/20">
          <span className="text-2xl">👦</span>
        </div>
        <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 rounded-xl px-2.5 py-1.5 text-center">
          <div className="font-black text-base">+50</div>
          <div className="text-[10px] font-bold">نقطة 🌟</div>
        </div>
      </div>
      <div className="bg-gray-800 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {['🎤','📷','🖥️','💬'].map(icon => (
            <div key={icon} className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-sm">{icon}</div>
          ))}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
          <span className="text-white/60 text-xs">جلسة تفاعلية</span>
        </div>
        <div className="bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-xl">إنهاء</div>
      </div>
    </div>
  )
}

function ExercisesMockup() {
  return (
    <div className="bg-white">
      <div className="bg-purple-700 px-5 py-3.5">
        <h3 className="text-white font-black text-base">مكتبة التمارين العلمية</h3>
        <p className="text-white/70 text-xs">+32 تمريناً مُعتمداً — APA / ABA / CBT</p>
      </div>
      <div className="p-4">
        <div className="flex gap-1.5 mb-4">
          {[{ l:'الكل', a:true },{ l:'APA', a:false },{ l:'ABA', a:false },{ l:'CBT', a:false }].map(({ l, a }) => (
            <span key={l} className={`px-2.5 py-1 rounded-full text-xs font-bold ${a ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{l}</span>
          ))}
        </div>
        <div className="space-y-2.5">
          {[
            { name:'بروتوكول Zone of Regulation', type:'ABA', dur:'10 د', cls:'border-emerald-200 bg-emerald-50', tag:'bg-emerald-600' },
            { name:'تحدي التسلسل المعكوس', type:'CBT', dur:'15 د', cls:'border-purple-200 bg-purple-50', tag:'bg-purple-600' },
            { name:'تمرين Go/No-Go', type:'APA', dur:'8 د', cls:'border-blue-200 bg-blue-50', tag:'bg-blue-600' },
            { name:'تتبع الاتجاهات', type:'APA', dur:'10 د', cls:'border-sky-200 bg-sky-50', tag:'bg-sky-600' },
          ].map(({ name, type, dur, cls, tag }) => (
            <div key={name} className={`rounded-xl border-2 p-2.5 ${cls}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className={`text-white text-[10px] font-black px-1.5 py-0.5 rounded-full ${tag}`}>{type}</span>
                  <span className="text-gray-700 font-bold text-xs">{name}</span>
                </div>
                <span className="text-gray-400 text-[10px]">⏱ {dur}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-3 text-center">
          <span className="text-purple-600 text-xs font-bold">عرض جميع التمارين (32+) ←</span>
        </div>
      </div>
    </div>
  )
}

function ProgressMockup() {
  const bars = [
    { label:'الانتباه المستمر', value:78, color:'#6B46F0' },
    { label:'كبح التشتت', value:62, color:'#8B5CF6' },
    { label:'الضبط الذاتي', value:55, color:'#10B981' },
    { label:'المهارات الاجتماعية', value:70, color:'#3B82F6' },
  ]
  return (
    <div className="bg-white">
      <div className="bg-amber-600 px-5 py-3.5 flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-sm">تقرير التقدم — أمير (9 سنوات)</h3>
          <p className="text-white/70 text-xs">الشهر الثالث من البرنامج</p>
        </div>
        <div className="text-center">
          <div className="text-white font-black text-2xl">A+</div>
          <div className="text-white/70 text-[10px]">التقييم العام</div>
        </div>
      </div>
      <div className="p-4">
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Brain className="w-3.5 h-3.5 text-amber-600" />
            <span className="text-amber-700 font-bold text-xs">ملخص الأستاذ أمين</span>
          </div>
          <p className="text-gray-700 text-xs leading-relaxed">
            أمير يُظهر تحسناً ملحوظاً في الانتباه — ارتفع من 3 دقائق إلى 8 دقائق دون انقطاع.
            <strong className="text-amber-700"> أنصح بالتركيز على Zone of Regulation هذا الشهر.</strong>
          </p>
        </div>
        <div className="space-y-3 mb-4">
          {bars.map(({ label, value, color }) => (
            <div key={label}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-700">{label}</span>
                <span className="text-xs font-black text-gray-900">{value}%</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${value}%`, background: color }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { l:'الجلسات', v:'12', sub:'هذا الشهر', cls:'bg-brand-50 text-brand-700' },
            { l:'الإنجازات', v:'+8', sub:'شارة جديدة', cls:'bg-amber-50 text-amber-700' },
            { l:'نقاط', v:'3,240', sub:'إجمالي', cls:'bg-emerald-50 text-emerald-700' },
          ].map(({ l, v, sub, cls }) => (
            <div key={l} className={`${cls} rounded-xl p-2.5 text-center`}>
              <div className="font-black text-lg">{v}</div>
              <div className="text-[10px] font-bold">{l}</div>
              <div className="text-[9px] opacity-60">{sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hero visual ──────────────────────────────────────────────────────────────
function HeroVisual() {
  const items = ['🧠','⭐','🎯','🏆','💡','🌈','🎨','🔬']
  return (
    <div style={{ position: 'relative', width: 280, height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.25) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', width: 210, height: 210, borderRadius: '50%', border: '1px solid rgba(124,92,252,0.2)', animation: 'demo-spin 22s linear infinite' }} />
      <div style={{ position: 'absolute', width: 260, height: 260, borderRadius: '50%', border: '1px dashed rgba(192,132,252,0.12)', animation: 'demo-spin 35s linear infinite reverse' }} />
      {items.map((emoji, i) => {
        const angle = (i / items.length) * Math.PI * 2 - Math.PI / 2
        const r = 118
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        return (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -50%)', marginLeft: x, marginTop: y }}>
            <div style={{ fontSize: 22, animation: `demo-float ${2.5 + (i % 3) * 0.4}s ease-in-out ${i * 0.25}s infinite` }}>
              {emoji}
            </div>
          </div>
        )
      })}
      <div style={{ width: 108, height: 108, borderRadius: 36, background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(107,70,240,0.55)', animation: 'demo-float 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 52, lineHeight: 1 }}>أ</span>
      </div>
    </div>
  )
}

// ─── Slide definitions ────────────────────────────────────────────────────────
interface SlideData {
  tag: string
  title: string
  accentText: string
  accent: string
  subtitle: string
  url?: string
  mockup?: React.ReactNode
  isHero?: boolean
}

const SLIDES: SlideData[] = [
  {
    isHero: true,
    tag: '🌟 المنصة العلاجية الأولى في العالم العربي',
    title: 'أكاديمية أمين',
    accentText: 'APA • ABA • CBT',
    accent: '#C084FC',
    subtitle: 'برنامج علمي متكامل لأطفال ADHD والتوحد — جلسات تفاعلية مباشرة تُحسّن التركيز والسلوك والمهارات الاجتماعية',
  },
  {
    tag: '① التسجيل',
    title: 'ابدأ في دقيقتين',
    accentText: 'مجاني تماماً — بدون بطاقة بنكية',
    accent: '#34D399',
    subtitle: 'سجّل حساب الولي، أضف معلومات طفلك، واختر البرنامج المناسب — ثم انتظر تأكيد الأستاذ أمين',
    url: 'amine-academy.com/register',
    mockup: <RegisterMockup />,
  },
  {
    tag: '② بوابة الولي',
    title: 'كل شيء في مكان واحد',
    accentText: 'لوحة تحكم ذكية وسهلة الاستخدام',
    accent: '#818CF8',
    subtitle: 'تابع الجلسات القادمة، تمارين طفلك اليومية، ونقاطه — وانضم للجلسة بنقرة واحدة',
    url: 'amine-academy.com/parent/dashboard',
    mockup: <DashboardMockup />,
  },
  {
    tag: '③ حجز الجلسات',
    title: 'احجز بسهولة تامة',
    accentText: 'تأكيد فوري • تذكير تلقائي • إلغاء مجاني',
    accent: '#34D399',
    subtitle: 'تقويم متزامن لحظياً مع جدول الأستاذ أمين — اختر الوقت الأنسب لطفلك وأكّد في ثوانٍ',
    url: 'amine-academy.com/parent/appointments',
    mockup: <BookingMockup />,
  },
  {
    tag: '④ داخل الجلسة',
    title: 'جلسة تفاعلية مباشرة',
    accentText: 'تمارين APA + ABA + CBT • نقاط تحفيزية لحظية',
    accent: '#F87171',
    subtitle: 'ليست مجرد مكالمة فيديو — تجربة حركية ومعرفية متكاملة مع تتبع مستوى تركيز طفلك في الوقت الفعلي',
    url: 'amine-academy.com/session/live',
    mockup: <SessionMockup />,
  },
  {
    tag: '⑤ مكتبة التمارين',
    title: '+32 تمرين علمي',
    accentText: 'الانتباه • الاندفاعية • الذاكرة • الإدراك • التفكير',
    accent: '#C084FC',
    subtitle: 'تمارين منزلية مُصمَّمة وفق أحدث أبحاث ADHD والتوحد — مناسبة للأعمار 5-22 ومُحدَّثة شهرياً',
    url: 'amine-academy.com/parent/exercises',
    mockup: <ExercisesMockup />,
  },
  {
    tag: '⑥ تقارير التقدم',
    title: 'نتائج حقيقية بأرقام',
    accentText: 'تقرير شهري مفصّل + توصيات الأستاذ + مقارنة بالمعدلات المرجعية',
    accent: '#FBBF24',
    subtitle: 'قيّم التحسن في الانتباه والسلوك والمهارات الاجتماعية بمعايير علمية موضوعية — وشارك التقرير مع المدرسة أو الطبيب',
    url: 'amine-academy.com/parent/progress',
    mockup: <ProgressMockup />,
  },
]

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(true)

  const idxRef = useRef(0)
  idxRef.current = idx
  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopMusicRef = useRef<(() => void) | null>(null)

  const goTo = useCallback((target: number) => {
    setVisible(false)
    setProgress(0)
    setTimeout(() => {
      setIdx(target)
      setVisible(true)
    }, FADE_MS)
  }, [])

  const goNext = useCallback(() => {
    const next = (idxRef.current + 1) % SLIDES.length
    setVisible(false)
    setProgress(0)
    setTimeout(() => { setIdx(next); setVisible(true) }, FADE_MS)
  }, [])

  const goPrev = useCallback(() => {
    const prev = (idxRef.current - 1 + SLIDES.length) % SLIDES.length
    setVisible(false)
    setProgress(0)
    setTimeout(() => { setIdx(prev); setVisible(true) }, FADE_MS)
  }, [])

  // Auto-advance + progress bar
  useEffect(() => {
    if (!playing) return
    const start = Date.now()
    const tick = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / SLIDE_DURATION) * 100, 100))
    }, 30)
    const timer = setTimeout(goNext, SLIDE_DURATION)
    return () => { clearInterval(tick); clearTimeout(timer) }
  }, [playing, idx, goNext])

  // Cleanup music on unmount
  useEffect(() => {
    return () => {
      stopMusicRef.current?.()
      setTimeout(() => audioCtxRef.current?.close(), 2000)
    }
  }, [])

  const toggleMusic = useCallback(async () => {
    if (muted) {
      try {
        const AC = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? AudioContext
        const ctx = new AC()
        audioCtxRef.current = ctx
        stopMusicRef.current = createAmbientMusic(ctx)
        setMuted(false)
      } catch (_) { /* audio not supported */ }
    } else {
      stopMusicRef.current?.()
      stopMusicRef.current = null
      setTimeout(() => { audioCtxRef.current?.close(); audioCtxRef.current = null }, 2000)
      setMuted(true)
    }
  }, [muted])

  const slide = SLIDES[idx]

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(160deg, #0d0820 0%, #1a0f3a 50%, #0a1628 100%)', color: 'white', fontFamily: 'inherit' }}>
      <style>{`
        @keyframes demo-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-11px); }
        }
        @keyframes demo-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes demo-pulse-ring {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.04); }
        }
      `}</style>

      {/* ── Progress bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 100, background: 'rgba(255,255,255,0.08)' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #7C5CFC, #C084FC)', transition: 'width 0.03s linear', borderRadius: '0 2px 2px 0' }} />
      </div>

      {/* ── Top bar ── */}
      <div style={{ position: 'fixed', top: 10, left: 0, right: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', pointerEvents: 'none' }}>
        <button
          onClick={toggleMusic}
          style={{ pointerEvents: 'all', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, padding: '7px 13px', color: 'rgba(255,255,255,0.7)', fontSize: 12, fontWeight: 700, cursor: 'pointer', backdropFilter: 'blur(8px)' }}
        >
          {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          {muted ? 'تشغيل الموسيقى' : 'كتم الصوت'}
        </button>

        <Link
          href="/"
          style={{ pointerEvents: 'all', color: 'rgba(255,255,255,0.5)', fontSize: 12, fontWeight: 600, textDecoration: 'none' }}
        >
          ← الرئيسية
        </Link>
      </div>

      {/* ── Main slide area ── */}
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 20px 130px', transition: `opacity ${FADE_MS}ms ease`, opacity: visible ? 1 : 0 }}>

        {/* Tag */}
        <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.45)', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 18, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', padding: '5px 16px', borderRadius: 20 }}>
          {slide.tag}
        </div>

        {/* Title */}
        <h1 style={{ fontSize: 'clamp(30px, 5vw, 58px)', fontWeight: 900, color: 'white', textAlign: 'center', lineHeight: 1.15, marginBottom: 14, maxWidth: 700 }}>
          {slide.title}
        </h1>

        {/* Accent text */}
        <p style={{ fontSize: 'clamp(13px, 1.8vw, 17px)', fontWeight: 700, color: slide.accent, textAlign: 'center', marginBottom: 14, letterSpacing: 0.5 }}>
          {slide.accentText}
        </p>

        {/* Subtitle */}
        <p style={{ fontSize: 'clamp(13px, 1.5vw, 16px)', color: 'rgba(255,255,255,0.55)', textAlign: 'center', maxWidth: 560, lineHeight: 1.75, marginBottom: 48 }}>
          {slide.subtitle}
        </p>

        {/* Visual */}
        {slide.isHero ? (
          <HeroVisual />
        ) : slide.mockup && slide.url ? (
          <div style={{ width: '100%', maxWidth: 700 }}>
            <BrowserFrame url={slide.url}>{slide.mockup}</BrowserFrame>
          </div>
        ) : null}
      </div>

      {/* ── Bottom controls ── */}
      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, padding: '20px 24px 32px', background: 'linear-gradient(to top, rgba(13,8,32,0.98) 0%, rgba(13,8,32,0.7) 60%, transparent 100%)' }}>
        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 16 }}>
          {/* Prev */}
          <button
            onClick={goPrev}
            style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
          >
            ›
          </button>

          {/* Dots */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
            {SLIDES.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                style={{ height: 8, width: i === idx ? 24 : 8, borderRadius: 4, background: i === idx ? '#7C5CFC' : 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', transition: 'all 0.3s ease', padding: 0 }}
              />
            ))}
          </div>

          {/* Play / Pause */}
          <button
            onClick={() => setPlaying(p => !p)}
            style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(124,92,252,0.25)', border: '1px solid rgba(124,92,252,0.4)', color: '#C084FC', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            {playing ? <Pause size={16} /> : <Play size={16} />}
          </button>

          {/* Next */}
          <button
            onClick={goNext}
            style={{ width: 38, height: 38, borderRadius: 12, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}
          >
            ‹
          </button>
        </div>

        {/* CTA */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <Link
            href="/register"
            style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', fontWeight: 900, fontSize: 14, padding: '10px 28px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 8px 32px rgba(107,70,240,0.45)', display: 'inline-block' }}
          >
            ابدأ التسجيل المجاني ←
          </Link>
          <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>
            {idx + 1} / {SLIDES.length}
          </span>
        </div>
      </div>

      {/* ── Below-fold: stats + timeline + CTA ── */}
      <div style={{ background: 'rgba(0,0,0,0.3)', borderTop: '1px solid rgba(255,255,255,0.07)', padding: '80px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>

          {/* Stats */}
          <h2 style={{ textAlign: 'center', fontWeight: 900, fontSize: 28, marginBottom: 12 }}>نتائج حقيقية من عائلات حقيقية</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.5)', marginBottom: 48, fontSize: 15 }}>أرقام مُعتمدة من برامجنا منذ 2019</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 24, marginBottom: 80 }}>
            {[
              { value: '+200', label: 'طفل في البرنامج', icon: <Users size={22} /> },
              { value: '98%', label: 'رضا أولياء الأمور', icon: <Star size={22} /> },
              { value: '45 د', label: 'مدة الجلسة الواحدة', icon: <Clock size={22} /> },
              { value: '+5', label: 'سنوات خبرة', icon: <Award size={22} /> },
            ].map(({ value, label, icon }) => (
              <div key={label} style={{ textAlign: 'center', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: '28px 20px' }}>
                <div style={{ color: '#C084FC', display: 'flex', justifyContent: 'center', marginBottom: 12 }}>{icon}</div>
                <div style={{ fontWeight: 900, fontSize: 34, marginBottom: 6 }}>{value}</div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Session timeline */}
          <h2 style={{ textAlign: 'center', fontWeight: 900, fontSize: 24, marginBottom: 8 }}>كيف تسير الجلسة؟</h2>
          <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.45)', marginBottom: 40, fontSize: 14 }}>45 دقيقة مُهيكَلة بدقة لتحقيق أقصى تأثير</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 80 }}>
            {[
              { time:'0 — 5 د', title:'التحقق الحسي', desc:'الأستاذ يقيّم مستوى طاقة الطفل ويختار البروتوكول الأنسب لليوم.', emoji:'🔍', color:'rgba(59,130,246,0.12)', border:'rgba(59,130,246,0.2)' },
              { time:'5 — 20 د', title:'التمارين الحركية APA', desc:'تمارين جسدية مُصممة لرفع الدوبامين وتحضير الدماغ للتعلم.', emoji:'🏃', color:'rgba(107,70,240,0.12)', border:'rgba(107,70,240,0.25)' },
              { time:'20 — 35 د', title:'التدريب المعرفي والسلوكي', desc:'تطبيق بروتوكولات ABA / CBT — Zone of Regulation، Token Economy، تمارين الانتباه.', emoji:'🧠', color:'rgba(139,92,246,0.12)', border:'rgba(139,92,246,0.25)' },
              { time:'35 — 40 د', title:'الاسترخاء والتعزيز', desc:'تمارين تنفس هادئة، حساب النقاط، وشارة الإنجاز للطفل.', emoji:'⭐', color:'rgba(245,158,11,0.1)', border:'rgba(245,158,11,0.2)' },
              { time:'40 — 45 د', title:'إحاطة الولي', desc:'الأستاذ يشرح ما تحقق ويُعطي توصيات للمنزل حتى الجلسة القادمة.', emoji:'💬', color:'rgba(16,185,129,0.1)', border:'rgba(16,185,129,0.2)' },
            ].map(({ time, title, desc, emoji, color, border }) => (
              <div key={time} style={{ display: 'flex', alignItems: 'flex-start', gap: 16, background: color, border: `1px solid ${border}`, borderRadius: 16, padding: '18px 20px' }}>
                <div style={{ fontSize: 28, flexShrink: 0 }}>{emoji}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontFamily: 'monospace', color: 'rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.06)', padding: '2px 10px', borderRadius: 12 }}>{time}</span>
                    <span style={{ fontWeight: 900, fontSize: 15 }}>{title}</span>
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: 13, lineHeight: 1.7, margin: 0 }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div style={{ textAlign: 'center', background: 'linear-gradient(135deg, rgba(107,70,240,0.2), rgba(192,132,252,0.1))', border: '1px solid rgba(124,92,252,0.25)', borderRadius: 28, padding: '56px 32px' }}>
            <div style={{ fontSize: 42, marginBottom: 16 }}>🌟</div>
            <h2 style={{ fontWeight: 900, fontSize: 'clamp(22px, 4vw, 36px)', marginBottom: 12 }}>هل أنت مستعد للبدء؟</h2>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 15, maxWidth: 440, margin: '0 auto 36px', lineHeight: 1.7 }}>
              الجلسة التقييمية الأولى مجانية — يحدد فيها الأستاذ أمين نوع البرنامج المناسب لطفلك.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
              <Link
                href="/register"
                style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', fontWeight: 900, fontSize: 16, padding: '14px 36px', borderRadius: 16, textDecoration: 'none', boxShadow: '0 12px 40px rgba(107,70,240,0.5)' }}
              >
                احجز الجلسة التقييمية المجانية ←
              </Link>
              <Link
                href="/"
                style={{ color: 'rgba(255,255,255,0.45)', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}
              >
                العودة للرئيسية ↑
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
