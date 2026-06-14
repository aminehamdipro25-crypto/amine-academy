'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Pause, Volume2, VolumeX, SkipForward, SkipBack, Maximize2, Minimize2, BarChart2, Calendar, BookOpen, Brain } from 'lucide-react'

const SLIDE_DURATION = 7000

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

// ─── Browser chrome ───────────────────────────────────────────────────────────
function BrowserFrame({ url, glow, children }: { url: string; glow: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07), 0 0 60px ${glow}` }}>
      <div style={{ background: '#18182a', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5, flexShrink: 0 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: 6, background: c }} />)}
        </div>
        <div style={{ flex: 1, background: '#26263a', borderRadius: 7, padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', color: '#6B7280', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          🔒 {url}
        </div>
        <div style={{ display: 'flex', gap: 5, opacity: 0.3 }}>
          {[0, 1, 2].map(i => <div key={i} style={{ width: 18, height: 18, borderRadius: 5, background: '#fff3' }} />)}
        </div>
      </div>
      <div style={{ maxHeight: '52vh', overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// ─── Mockup components ────────────────────────────────────────────────────────
function RegisterMockup() {
  return (
    <div style={{ background: '#F8F5FF', padding: '20px 18px' }}>
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ width: 46, height: 46, borderRadius: 15, background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 8px 20px rgba(107,70,240,.35)' }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>أ</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#1a1a2e', marginBottom: 2 }}>إنشاء حساب الولي</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>خطوتان فقط للبدء — مجاناً</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, marginBottom: 14 }}>
        {['معلوماتك', 'طفلك', 'تأكيد'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: i === 0 ? '#6B46F0' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: i === 0 ? 'white' : '#9CA3AF' }}>{i + 1}</div>
            <span style={{ fontSize: 10, color: i === 0 ? '#6B46F0' : '#9CA3AF', fontWeight: i === 0 ? 700 : 400 }}>{s}</span>
            {i < 2 && <div style={{ width: 12, height: 1, background: '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[{ l: 'الاسم الكامل', p: 'محمد العمري' }, { l: 'البريد الإلكتروني', p: 'email@example.com' }, { l: 'كلمة المرور', p: '••••••••' }, { l: 'رقم الهاتف (واتساب)', p: '+966 5X XXX XXXX' }].map(({ l, p }) => (
        <div key={l} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 3 }}>{l}</div>
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '8px 11px', fontSize: 11, color: '#9CA3AF' }}>{p}</div>
        </div>
      ))}
      <div style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', textAlign: 'center', padding: '11px 20px', borderRadius: 11, fontWeight: 900, fontSize: 12, marginTop: 8, boxShadow: '0 8px 20px rgba(107,70,240,.3)' }}>
        التالي — معلومات طفلك ←
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-gray-50">
      <div className="bg-brand-900 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-white/20 rounded-lg flex items-center justify-center text-white font-black text-xs">أ</div>
          <span className="text-white font-bold text-xs">أكاديمية أمين</span>
        </div>
        <div className="w-6 h-6 bg-white/10 rounded-full flex items-center justify-center">
          <span className="text-white text-[9px] font-bold">م.ع</span>
        </div>
      </div>
      <div className="flex">
        <div className="w-36 bg-white border-l border-gray-100 p-2.5 hidden md:block">
          {[{ icon: BarChart2, label: 'نظرة عامة', a: true }, { icon: Calendar, label: 'جلساتي' }, { icon: BookOpen, label: 'تمارين اليوم' }].map(({ icon: Icon, label, a }) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl mb-1 ${a ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}>
              <Icon className="w-3 h-3" /><span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 p-3.5">
          <div className="mb-3">
            <h2 className="font-black text-gray-900 text-sm mb-0.5">مرحباً، محمد 👋</h2>
            <p className="text-gray-400 text-[10px]">الجلسة القادمة لأمير: اليوم 5:00 م</p>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[{ l: 'جلسات الشهر', v: '8', c: 'bg-brand-50 text-brand-700' }, { l: 'مستوى التركيز', v: '+64%', c: 'bg-emerald-50 text-emerald-700' }, { l: 'نقاط أمير', v: '1,240', c: 'bg-amber-50 text-amber-700' }].map(({ l, v, c }) => (
              <div key={l} className={`${c} rounded-xl p-2 text-center`}>
                <div className="font-black text-base">{v}</div>
                <div className="text-[9px] mt-0.5 opacity-80">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-brand-900 text-white rounded-xl p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-white/60 text-[9px]">الجلسة القادمة</span>
              <span className="bg-green-400 text-green-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">مُؤكَّدة</span>
            </div>
            <p className="font-black text-xs mb-1">جلسة الانتباه المستمر + تمارين APA</p>
            <div className="flex items-center gap-2 text-white/50 text-[9px] mb-2">
              <span>📅 اليوم 5:00 م</span><span>⏱️ 45 دقيقة</span>
            </div>
            <div className="bg-white/20 rounded-lg py-1.5 text-center text-[10px] font-bold">▶ انضم للجلسة الآن</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingMockup() {
  return (
    <div className="bg-white">
      <div className="bg-emerald-700 px-4 py-3">
        <h3 className="text-white font-black text-sm">حجز جلسة جديدة</h3>
        <p className="text-white/70 text-[10px]">اختر الوقت المناسب لك</p>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-4">
          {['اختر النوع', 'اختر الوقت', 'تأكيد'].map((s, i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i === 1 ? 'bg-emerald-600 text-white' : i === 0 ? 'bg-gray-200 text-gray-500' : 'border border-gray-200 text-gray-300'}`}>{i + 1}</div>
              <span className={`text-[10px] ${i === 1 ? 'text-emerald-700 font-bold' : 'text-gray-400'}`}>{s}</span>
              {i < 2 && <div className="w-4 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-2 text-center">
          {['أح', 'إث', 'ثل', 'أر', 'خم', 'جم', 'سب'].map(d => <div key={d} className="text-[9px] text-gray-400 font-bold py-0.5">{d}</div>)}
          {Array.from({ length: 14 }, (_, i) => i + 1).map(d => (
            <div key={d} className={`text-[10px] py-1 rounded-md ${d === 4 ? 'bg-emerald-600 text-white font-black' : d === 5 || d === 6 || d === 12 || d === 13 ? 'text-gray-300' : 'text-gray-700'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 mb-3">
          {['10:00 ص', '11:00 ص', '02:00 م', '03:00 م', '05:00 م', '06:00 م'].map((t, i) => (
            <div key={t} className={`text-center py-1.5 rounded-lg text-[10px] font-bold border ${i === 4 ? 'bg-emerald-600 text-white border-emerald-600' : 'border-gray-200 text-gray-600'}`}>{t}</div>
          ))}
        </div>
        <div className="bg-emerald-600 text-white text-center py-2 rounded-xl font-black text-xs">تأكيد الحجز ←</div>
      </div>
    </div>
  )
}

function SessionMockup() {
  return (
    <div className="bg-gray-900">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {['bg-red-500', 'bg-yellow-500', 'bg-green-500'].map(c => <div key={c} className={`w-2 h-2 rounded-full ${c}`} />)}
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
          <span className="text-white/60 text-[10px] font-mono">مباشر — 23:14</span>
        </div>
        <div className="bg-red-600/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded">● LIVE</div>
      </div>
      <div className="relative bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center" style={{ aspectRatio: '16/9' }}>
        <div className="text-center">
          <div className="w-14 h-14 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-2xl">👨‍⚕️</span></div>
          <p className="text-white font-bold text-xs">الأستاذ أمين</p>
          <p className="text-white/50 text-[10px]">يشرح تمرين التسلسل العكسي</p>
        </div>
        <div className="absolute top-2 right-2 bg-white/10 backdrop-blur rounded-xl p-2 max-w-[130px]">
          <p className="text-white/70 text-[9px] mb-1 font-bold">التمرين الحالي</p>
          <p className="text-white text-[9px] font-black">تحدي التسلسل المعكوس</p>
          <div className="flex gap-0.5 mt-1">
            {[1,2,3,4,5].map(n => <div key={n} className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${n <= 3 ? 'bg-green-400 text-green-900' : 'bg-white/20 text-white'}`}>{n}</div>)}
          </div>
        </div>
        <div className="absolute bottom-2 left-2 w-16 h-11 bg-gray-700 rounded-lg flex items-center justify-center border border-white/20"><span className="text-xl">👦</span></div>
        <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 rounded-lg px-2 py-1 text-center">
          <div className="font-black text-sm">+50</div><div className="text-[9px] font-bold">نقطة 🌟</div>
        </div>
      </div>
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1.5">
          {['🎤','📷','🖥️','💬'].map(icon => <div key={icon} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-xs">{icon}</div>)}
        </div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /><span className="text-white/60 text-[10px]">جلسة تفاعلية</span></div>
        <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">إنهاء</div>
      </div>
    </div>
  )
}

function ExercisesMockup() {
  return (
    <div className="bg-white">
      <div className="bg-purple-700 px-4 py-3">
        <h3 className="text-white font-black text-sm">مكتبة التمارين العلمية</h3>
        <p className="text-white/70 text-[10px]">+32 تمريناً مُعتمداً — APA / ABA / CBT</p>
      </div>
      <div className="p-3.5">
        <div className="flex gap-1.5 mb-3">
          {[{ l:'الكل', a:true },{ l:'APA' },{ l:'ABA' },{ l:'CBT' }].map(({ l, a }) => (
            <span key={l} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{l}</span>
          ))}
        </div>
        <div className="space-y-2">
          {[
            { n:'بروتوكول Zone of Regulation', t:'ABA', d:'10 د', c:'border-emerald-200 bg-emerald-50', g:'bg-emerald-600' },
            { n:'تحدي التسلسل المعكوس', t:'CBT', d:'15 د', c:'border-purple-200 bg-purple-50', g:'bg-purple-600' },
            { n:'تمرين Go/No-Go', t:'APA', d:'8 د', c:'border-blue-200 bg-blue-50', g:'bg-blue-600' },
            { n:'مرآة المشاعر', t:'ABA', d:'12 د', c:'border-pink-200 bg-pink-50', g:'bg-pink-600' },
          ].map(({ n, t, d, c, g }) => (
            <div key={n} className={`rounded-lg border ${c} px-2.5 py-2 flex items-center justify-between`}>
              <div className="flex items-center gap-1.5">
                <span className={`text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ${g}`}>{t}</span>
                <span className="text-gray-700 font-bold text-[10px]">{n}</span>
              </div>
              <span className="text-gray-400 text-[9px]">⏱ {d}</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 text-center">
          <span className="text-purple-600 text-[10px] font-bold">عرض جميع التمارين (32+) ←</span>
        </div>
      </div>
    </div>
  )
}

function ProgressMockup() {
  return (
    <div className="bg-white">
      <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
        <div>
          <h3 className="text-white font-black text-xs">تقرير التقدم — أمير (9 سنوات)</h3>
          <p className="text-white/70 text-[10px]">الشهر الثالث من البرنامج</p>
        </div>
        <div className="text-center">
          <div className="text-white font-black text-xl">A+</div>
          <div className="text-white/70 text-[9px]">التقييم العام</div>
        </div>
      </div>
      <div className="p-3.5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Brain className="w-3 h-3 text-amber-600" />
            <span className="text-amber-700 font-bold text-[10px]">ملخص الأستاذ أمين</span>
          </div>
          <p className="text-gray-700 text-[10px] leading-relaxed">أمير يُظهر تحسناً ملحوظاً في الانتباه — من 3 إلى 8 دقائق. <strong className="text-amber-700">أنصح بالتركيز على Zone of Regulation.</strong></p>
        </div>
        <div className="space-y-2.5 mb-3">
          {[{ l:'الانتباه المستمر', v:78, c:'#6B46F0' },{ l:'كبح التشتت', v:62, c:'#8B5CF6' },{ l:'الضبط الذاتي', v:55, c:'#10B981' },{ l:'المهارات الاجتماعية', v:70, c:'#3B82F6' }].map(({ l, v, c }) => (
            <div key={l}>
              <div className="flex justify-between mb-0.5">
                <span className="text-[10px] text-gray-700">{l}</span>
                <span className="text-[10px] font-black text-gray-900">{v}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${v}%`, background: c }} />
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[{ l:'الجلسات', v:'12', c:'bg-brand-50 text-brand-700' },{ l:'الإنجازات', v:'+8', c:'bg-amber-50 text-amber-700' },{ l:'نقاط', v:'3,240', c:'bg-emerald-50 text-emerald-700' }].map(({ l, v, c }) => (
            <div key={l} className={`${c} rounded-lg p-2 text-center`}>
              <div className="font-black text-base">{v}</div>
              <div className="text-[9px] font-bold">{l}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hero visual for slide 0 ──────────────────────────────────────────────────
function HeroVisual() {
  const emojis = ['🧠', '⭐', '🎯', '🏆', '💡', '🌈', '🎨', '🔬']
  return (
    <div style={{ position: 'relative', width: 240, height: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle, rgba(124,92,252,0.3) 0%, transparent 65%)' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1px solid rgba(124,92,252,0.18)', animation: 'demo-spin 22s linear infinite' }} />
      <div style={{ position: 'absolute', width: 234, height: 234, borderRadius: '50%', border: '1px dashed rgba(192,132,252,0.1)', animation: 'demo-spin 35s linear infinite reverse' }} />
      {emojis.map((emoji, i) => {
        const angle = (i / emojis.length) * Math.PI * 2 - Math.PI / 2
        const r = 105
        const x = Math.cos(angle) * r
        const y = Math.sin(angle) * r
        return (
          <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: x - 12, marginTop: y - 12 }}>
            <div style={{ fontSize: 20, animation: `demo-float ${2.5 + (i % 3) * 0.4}s ease-in-out ${i * 0.28}s infinite` }}>{emoji}</div>
          </div>
        )
      })}
      <div style={{ width: 92, height: 92, borderRadius: 30, background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 50px rgba(107,70,240,0.6)', animation: 'demo-float 4s ease-in-out infinite', position: 'relative', zIndex: 1 }}>
        <span style={{ color: 'white', fontWeight: 900, fontSize: 44, lineHeight: 1 }}>أ</span>
      </div>
    </div>
  )
}

// ─── Slides ───────────────────────────────────────────────────────────────────
interface SlideData {
  tag: string
  title: string
  caption: string
  accent: string
  glow: string
  url?: string
  mockup?: React.ReactNode
  isHero?: boolean
}

const SLIDES: SlideData[] = [
  { isHero: true, tag: '🌟 المنصة العلاجية الأولى عربياً', title: 'أكاديمية أمين', caption: 'برنامج علمي لأطفال ADHD والتوحد — APA • ABA • CBT', accent: '#C084FC', glow: 'rgba(124,92,252,0.2)' },
  { tag: '① التسجيل', title: 'ابدأ في دقيقتين', caption: 'سجّل بياناتك وبيانات طفلك — مجاني بدون بطاقة بنكية', accent: '#34D399', glow: 'rgba(52,211,153,0.2)', url: 'amine-academy.com/register', mockup: <RegisterMockup /> },
  { tag: '② لوحة التحكم', title: 'كل شيء في مكان واحد', caption: 'جلساتك القادمة، تمارين طفلك، ونقاطه — وانضم للجلسة بنقرة', accent: '#818CF8', glow: 'rgba(129,140,248,0.2)', url: 'amine-academy.com/parent/dashboard', mockup: <DashboardMockup /> },
  { tag: '③ حجز الجلسات', title: 'احجز بسهولة تامة', caption: 'تقويم متزامن لحظياً — تأكيد فوري وتذكير تلقائي', accent: '#34D399', glow: 'rgba(52,211,153,0.2)', url: 'amine-academy.com/parent/appointments', mockup: <BookingMockup /> },
  { tag: '④ داخل الجلسة', title: 'تجربة تفاعلية مباشرة', caption: 'تمارين APA+ABA+CBT مع نقاط تحفيزية — تتبع التركيز لحظياً', accent: '#F87171', glow: 'rgba(248,113,113,0.2)', url: 'amine-academy.com/session/live', mockup: <SessionMockup /> },
  { tag: '⑤ مكتبة التمارين', title: '+32 تمرين علمي', caption: 'للانتباه والاندفاعية والذاكرة والإدراك والتفكير — أعمار 5-22', accent: '#C084FC', glow: 'rgba(192,132,252,0.2)', url: 'amine-academy.com/parent/exercises', mockup: <ExercisesMockup /> },
  { tag: '⑥ تقارير التقدم', title: 'نتائج بأرقام حقيقية', caption: 'تقرير شهري مفصّل + توصيات الأستاذ + مقارنة بالمعدلات المرجعية', accent: '#FBBF24', glow: 'rgba(251,191,36,0.2)', url: 'amine-academy.com/parent/progress', mockup: <ProgressMockup /> },
]

const TOTAL_SEC = Math.round(SLIDES.length * SLIDE_DURATION / 1000)
const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

// ─── Main page ────────────────────────────────────────────────────────────────
type Stage = 'splash' | 'playing'

export default function DemoPage() {
  const [stage, setStage] = useState<Stage>('splash')
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [muted, setMuted] = useState(true)
  const [progress, setProgress] = useState(0)
  const [direction, setDirection] = useState<'next' | 'prev'>('next')
  const [animKey, setAnimKey] = useState(0)
  const [fullscreen, setFullscreen] = useState(false)

  const idxRef = useRef(0)
  idxRef.current = idx
  const containerRef = useRef<HTMLDivElement>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopMusicRef = useRef<(() => void) | null>(null)

  const navigate = useCallback((dir: 'next' | 'prev') => {
    setDirection(dir)
    setProgress(0)
    setAnimKey(k => k + 1)
    setIdx(i => dir === 'next' ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  const goNext = useCallback(() => navigate('next'), [navigate])
  const goPrev = useCallback(() => navigate('prev'), [navigate])

  const goTo = useCallback((target: number) => {
    const dir = target > idxRef.current ? 'next' : 'prev'
    setDirection(dir)
    setProgress(0)
    setAnimKey(k => k + 1)
    setIdx(target)
  }, [])

  // Start tour
  const startTour = useCallback(() => {
    setStage('playing')
    setPlaying(true)
    setIdx(0)
    setProgress(0)
  }, [])

  // Auto-advance + progress bar
  useEffect(() => {
    if (stage !== 'playing' || !playing) return
    const start = Date.now()
    const tick = setInterval(() => {
      setProgress(Math.min(((Date.now() - start) / SLIDE_DURATION) * 100, 100))
    }, 30)
    const timer = setTimeout(goNext, SLIDE_DURATION)
    return () => { clearInterval(tick); clearTimeout(timer) }
  }, [stage, playing, idx, goNext])

  // Keyboard controls
  useEffect(() => {
    if (stage !== 'playing') return
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p) }
      if (e.code === 'ArrowRight') goPrev()
      if (e.code === 'ArrowLeft') goNext()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [stage, goNext, goPrev])

  // Fullscreen
  useEffect(() => {
    const onChange = () => setFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', onChange)
    return () => document.removeEventListener('fullscreenchange', onChange)
  }, [])

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }, [])

  // Music
  const toggleMusic = useCallback(async () => {
    if (muted) {
      try {
        const AC = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? AudioContext
        const ctx = new AC()
        audioCtxRef.current = ctx
        stopMusicRef.current = createAmbientMusic(ctx)
        setMuted(false)
      } catch (_) { /* ignore */ }
    } else {
      stopMusicRef.current?.()
      stopMusicRef.current = null
      setTimeout(() => { audioCtxRef.current?.close(); audioCtxRef.current = null }, 2000)
      setMuted(true)
    }
  }, [muted])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusicRef.current?.()
      setTimeout(() => audioCtxRef.current?.close(), 2000)
    }
  }, [])

  const slide = SLIDES[idx]
  const currentSec = Math.round(idx * SLIDE_DURATION / 1000 + progress / 100 * SLIDE_DURATION / 1000)

  // ── Splash screen ────────────────────────────────────────────────────────────
  if (stage === 'splash') {
    return (
      <div dir="rtl" style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0d0820 0%,#1a0f3a 55%,#0a1628 100%)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', position: 'relative', overflow: 'hidden' }}>
        <style>{`
          @keyframes demo-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
          @keyframes demo-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
          @keyframes demo-fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
          @keyframes demo-slide-next { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
          @keyframes demo-slide-prev { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
        `}</style>

        {/* Bg particles */}
        {[...Array(12)].map((_, i) => (
          <div key={i} style={{ position: 'absolute', width: 4 + (i % 3) * 3, height: 4 + (i % 3) * 3, borderRadius: '50%', background: i % 2 === 0 ? 'rgba(124,92,252,0.35)' : 'rgba(192,132,252,0.25)', left: `${8 + (i * 7.5) % 85}%`, top: `${10 + (i * 11) % 75}%`, animation: `demo-float ${3 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }} />
        ))}

        <div style={{ textAlign: 'center', maxWidth: 640, position: 'relative', zIndex: 1 }}>
          <HeroVisual />

          <div style={{ animation: 'demo-fade-up 0.8s ease 0.2s both' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 3, marginBottom: 14, marginTop: 28 }}>
              🌟 المنصة العلاجية الأولى في العالم العربي
            </div>
            <h1 style={{ fontSize: 'clamp(36px,6vw,68px)', fontWeight: 900, lineHeight: 1.1, marginBottom: 12 }}>
              أكاديمية{' '}
              <span style={{ background: 'linear-gradient(135deg,#7C5CFC,#C084FC)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>أمين</span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.55)', marginBottom: 36, lineHeight: 1.7 }}>
              برنامج علمي متكامل لأطفال ADHD والتوحد — جلسات تفاعلية مباشرة تُحسّن التركيز والسلوك والمهارات الاجتماعية
            </p>
          </div>

          <div style={{ animation: 'demo-fade-up 0.8s ease 0.5s both' }}>
            <button
              onClick={startTour}
              style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', fontWeight: 900, fontSize: 18, padding: '16px 48px', borderRadius: 18, border: 'none', cursor: 'pointer', boxShadow: '0 16px 48px rgba(107,70,240,0.5)', display: 'inline-flex', alignItems: 'center', gap: 12, marginBottom: 20 }}
            >
              <Play size={22} fill="white" />
              شاهد الجولة التفاعلية
            </button>

            <div>
              <Link href="/" style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}>
                ← العودة للرئيسية
              </Link>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: 32, marginTop: 48, animation: 'demo-fade-up 0.8s ease 0.7s both' }}>
            {[{ v: '+200', l: 'طفل في البرنامج' }, { v: '98%', l: 'رضا الأولياء' }, { v: '+32', l: 'تمرين علمي' }].map(({ v, l }) => (
              <div key={l} style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 900, fontSize: 28, color: '#C084FC' }}>{v}</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // ── Playing view ─────────────────────────────────────────────────────────────
  return (
    <div ref={containerRef} dir="rtl" style={{ height: '100vh', background: 'linear-gradient(160deg,#0d0820 0%,#1a0f3a 55%,#0a1628 100%)', color: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>
      <style>{`
        @keyframes demo-float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-11px)} }
        @keyframes demo-spin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes demo-slide-next { from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes demo-slide-prev { from{opacity:0;transform:translateX(28px)} to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── Top bar ── */}
      <div style={{ flexShrink: 0, height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <button onClick={() => setStage('splash')} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.45)', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          ← الرئيسية
        </button>
        <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
          {SLIDES.map((_, i) => (
            <button key={i} onClick={() => goTo(i)} style={{ width: i === idx ? 20 : 6, height: 6, borderRadius: 3, background: i === idx ? '#7C5CFC' : 'rgba(255,255,255,0.18)', border: 'none', cursor: 'pointer', transition: 'all 0.3s', padding: 0 }} />
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: 1 }}>{slide.tag}</div>
          <Link href="/register" style={{ background: 'rgba(107,70,240,0.3)', border: '1px solid rgba(107,70,240,0.5)', color: '#C084FC', fontWeight: 900, fontSize: 12, padding: '5px 14px', borderRadius: 8, textDecoration: 'none' }}>
            سجّل مجاناً
          </Link>
        </div>
      </div>

      {/* ── Slide content ── */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '16px 20px 8px' }}>
        <div
          key={animKey}
          style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, animation: `${direction === 'next' ? 'demo-slide-next' : 'demo-slide-prev'} 0.4s ease both` }}
        >
          <h2 style={{ fontSize: 'clamp(22px,4vw,42px)', fontWeight: 900, textAlign: 'center', margin: 0, lineHeight: 1.15 }}>
            {slide.title}
          </h2>

          <p style={{ fontSize: 'clamp(12px,1.5vw,15px)', color: slide.accent, fontWeight: 700, textAlign: 'center', margin: 0, letterSpacing: 0.3 }}>
            {slide.caption}
          </p>

          {slide.isHero ? (
            <HeroVisual />
          ) : slide.mockup && slide.url ? (
            <div style={{ width: '100%' }}>
              <BrowserFrame url={slide.url} glow={slide.glow}>{slide.mockup}</BrowserFrame>
            </div>
          ) : null}
        </div>
      </div>

      {/* ── Video player controls ── */}
      <div style={{ flexShrink: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        {/* Progress bar */}
        <div
          style={{ height: 4, background: 'rgba(255,255,255,0.08)', cursor: 'pointer', position: 'relative' }}
          onClick={e => {
            const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect()
            const pct = (e.clientX - rect.left) / rect.width
            const targetIdx = Math.min(Math.floor(pct * SLIDES.length), SLIDES.length - 1)
            goTo(targetIdx)
          }}
        >
          <div style={{ height: '100%', width: `${(idx * 100 / SLIDES.length) + progress / SLIDES.length}%`, background: 'linear-gradient(90deg,#7C5CFC,#C084FC)', transition: 'width 0.03s linear' }} />
          <div style={{ position: 'absolute', top: -3, left: `${(idx * 100 / SLIDES.length) + progress / SLIDES.length}%`, width: 10, height: 10, borderRadius: 5, background: '#C084FC', transform: 'translateX(-50%)', marginTop: -3 }} />
        </div>

        {/* Controls row */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '10px 16px', gap: 8 }}>
          {/* Left controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={goPrev} style={btnStyle} title="السابق"><SkipBack size={16} /></button>
            <button onClick={() => setPlaying(p => !p)} style={{ ...btnStyle, width: 40, height: 40, background: 'rgba(124,92,252,0.25)', border: '1px solid rgba(124,92,252,0.4)' }}>
              {playing ? <Pause size={18} /> : <Play size={18} fill="white" />}
            </button>
            <button onClick={goNext} style={btnStyle} title="التالي"><SkipForward size={16} /></button>
          </div>

          {/* Time */}
          <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
            {fmt(currentSec)} / {fmt(TOTAL_SEC)}
          </div>

          {/* Spacer */}
          <div style={{ flex: 1 }} />

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <button onClick={toggleMusic} style={btnStyle} title={muted ? 'تشغيل الموسيقى' : 'كتم الصوت'}>
              {muted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
            <button onClick={toggleFullscreen} style={btnStyle} title="ملء الشاشة">
              {fullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const btnStyle: React.CSSProperties = {
  width: 34, height: 34, borderRadius: 9,
  background: 'rgba(255,255,255,0.07)',
  border: '1px solid rgba(255,255,255,0.1)',
  color: 'rgba(255,255,255,0.75)',
  cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}
