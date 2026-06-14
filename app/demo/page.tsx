'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Pause, Volume2, VolumeX, ChevronLeft, ChevronRight, BarChart2, Calendar, BookOpen, Brain } from 'lucide-react'

const SLIDE_DURATION = 4500

// ─── Ambient music ─────────────────────────────────────────────────────────────
function createAmbientMusic(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 3)
  master.connect(ctx.destination)

  const bass = ctx.createOscillator()
  bass.type = 'sine'; bass.frequency.value = 110
  const bassG = ctx.createGain(); bassG.gain.value = 0.4
  bass.connect(bassG); bassG.connect(master); bass.start()

  const padFreqs = [220, 261.63, 329.63, 392]
  const padOscs = padFreqs.map(f => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f
    const g = ctx.createGain(); g.gain.value = 0.055
    o.connect(g); g.connect(master); o.start(); return o
  })

  const arp = [523.25, 659.26, 783.99, 880, 783.99, 659.26, 523.25, 440]
  let ni = 0
  const t = setInterval(() => {
    const now = ctx.currentTime
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = arp[ni++ % arp.length]
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.07, now + 0.06); g.gain.exponentialRampToValueAtTime(0.001, now + 2)
    o.connect(g); g.connect(master); o.start(now); o.stop(now + 2.1)
  }, 1800)

  return () => {
    clearInterval(t)
    const now = ctx.currentTime
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 1.5)
    setTimeout(() => { try { bass.stop(); padOscs.forEach(o => o.stop()) } catch (_) {} }, 2000)
  }
}

// ─── Browser frame ─────────────────────────────────────────────────────────────
function Frame({ url, color, children }: { url: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', boxShadow: `0 0 0 1px rgba(255,255,255,0.04), 0 30px 70px rgba(0,0,0,0.65), 0 0 80px ${color}22` }}>
      <div style={{ background: '#16162a', padding: '9px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {['#FF5F57','#FEBC2E','#28C840'].map(c => <div key={c} style={{ width: 11, height: 11, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: '#22223a', borderRadius: 7, padding: '4px 10px', fontSize: 10, fontFamily: 'monospace', color: '#555577', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
          🔒 {url}
        </div>
      </div>
      <div style={{ maxHeight: '45vh', overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// ─── Mockups ───────────────────────────────────────────────────────────────────
function RegisterMockup() {
  return (
    <div style={{ background: '#F8F5FF', padding: '20px 18px' }} dir="rtl">
      <div style={{ textAlign: 'center', marginBottom: 14 }}>
        <div style={{ width: 44, height: 44, borderRadius: 14, background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', boxShadow: '0 6px 18px rgba(107,70,240,.35)' }}>
          <span style={{ color: 'white', fontWeight: 900, fontSize: 20 }}>أ</span>
        </div>
        <div style={{ fontWeight: 900, fontSize: 15, color: '#1a1a2e', marginBottom: 2 }}>إنشاء حساب الولي</div>
        <div style={{ fontSize: 11, color: '#9CA3AF' }}>مجاني — دقيقتان فقط</div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, marginBottom: 14 }}>
        {['معلوماتك','طفلك','تأكيد'].map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <div style={{ width: 20, height: 20, borderRadius: 10, background: i === 0 ? '#6B46F0' : '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 900, color: i === 0 ? 'white' : '#9CA3AF' }}>{i+1}</div>
            <span style={{ fontSize: 10, color: i === 0 ? '#6B46F0' : '#9CA3AF', fontWeight: i === 0 ? 700 : 400 }}>{s}</span>
            {i < 2 && <div style={{ width: 10, height: 1, background: '#E5E7EB' }} />}
          </div>
        ))}
      </div>
      {[{l:'الاسم الكامل',p:'مثال: محمد العمري'},{l:'البريد الإلكتروني',p:'email@example.com'},{l:'كلمة المرور',p:'••••••••'},{l:'رقم الهاتف (واتساب)',p:'+966 5X XXX XXXX'}].map(({l,p}) => (
        <div key={l} style={{ marginBottom: 8 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#374151', marginBottom: 3 }}>{l}</div>
          <div style={{ background: 'white', border: '1.5px solid #E5E7EB', borderRadius: 9, padding: '8px 11px', fontSize: 11, color: '#9CA3AF' }}>{p}</div>
        </div>
      ))}
      <div style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', textAlign: 'center', padding: '11px', borderRadius: 11, fontWeight: 900, fontSize: 13, marginTop: 8, boxShadow: '0 6px 18px rgba(107,70,240,.3)' }}>
        التالي — معلومات طفلك ←
      </div>
    </div>
  )
}

function DashboardMockup() {
  return (
    <div className="bg-gray-50" dir="rtl">
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
          {[{icon:BarChart2,label:'نظرة عامة',a:true},{icon:Calendar,label:'جلساتي'},{icon:BookOpen,label:'تمارين اليوم'}].map(({icon:Icon,label,a}) => (
            <div key={label} className={`flex items-center gap-1.5 px-2 py-1.5 rounded-xl mb-1 ${a ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}>
              <Icon className="w-3 h-3" /><span className="text-[10px] font-medium">{label}</span>
            </div>
          ))}
        </div>
        <div className="flex-1 p-3">
          <div className="mb-3">
            <div className="font-black text-gray-900 text-sm mb-0.5">مرحباً، محمد 👋</div>
            <div className="text-gray-400 text-[10px]">الجلسة القادمة لأمير: اليوم 5:00 م</div>
          </div>
          <div className="grid grid-cols-3 gap-1.5 mb-3">
            {[{l:'الجلسات',v:'8',c:'bg-brand-50 text-brand-700'},{l:'التركيز',v:'+64%',c:'bg-emerald-50 text-emerald-700'},{l:'النقاط',v:'1,240',c:'bg-amber-50 text-amber-700'}].map(({l,v,c}) => (
              <div key={l} className={`${c} rounded-xl p-2 text-center`}>
                <div className="font-black text-base">{v}</div>
                <div className="text-[9px] opacity-80">{l}</div>
              </div>
            ))}
          </div>
          <div className="bg-brand-900 text-white rounded-xl p-3">
            <div className="flex justify-between mb-1.5">
              <span className="text-white/60 text-[9px]">الجلسة القادمة</span>
              <span className="bg-green-400 text-green-900 text-[9px] font-bold px-1.5 py-0.5 rounded-full">مُؤكَّدة</span>
            </div>
            <div className="font-black text-xs mb-1">جلسة الانتباه المستمر + APA</div>
            <div className="flex gap-3 text-white/50 text-[9px] mb-2"><span>📅 اليوم 5:00 م</span><span>⏱ 45 دقيقة</span></div>
            <div className="bg-white/20 rounded-lg py-1.5 text-center text-[10px] font-bold">▶ انضم للجلسة الآن</div>
          </div>
        </div>
      </div>
    </div>
  )
}

function BookingMockup() {
  return (
    <div className="bg-white" dir="rtl">
      <div className="bg-emerald-700 px-4 py-3">
        <div className="text-white font-black text-sm">حجز جلسة جديدة</div>
        <div className="text-white/70 text-[10px]">اختر الوقت المناسب لك</div>
      </div>
      <div className="p-4">
        <div className="flex items-center gap-1.5 mb-4">
          {['اختر النوع','اختر الوقت','تأكيد'].map((s,i) => (
            <div key={s} className="flex items-center gap-1">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black ${i===1?'bg-emerald-600 text-white':i===0?'bg-gray-200 text-gray-500':'border border-gray-200 text-gray-300'}`}>{i+1}</div>
              <span className={`text-[10px] ${i===1?'text-emerald-700 font-bold':'text-gray-400'}`}>{s}</span>
              {i<2 && <div className="w-4 h-px bg-gray-200" />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5 mb-2 text-center">
          {['أح','إث','ثل','أر','خم','جم','سب'].map(d => <div key={d} className="text-[9px] text-gray-400 font-bold">{d}</div>)}
          {Array.from({length:14},(_,i)=>i+1).map(d => (
            <div key={d} className={`text-[10px] py-1 rounded-md ${d===4?'bg-emerald-600 text-white font-black':d===5||d===6||d===12||d===13?'text-gray-300':'text-gray-700'}`}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1 mb-3">
          {['10:00 ص','11:00 ص','02:00 م','03:00 م','05:00 م','06:00 م'].map((t,i) => (
            <div key={t} className={`text-center py-1.5 rounded-lg text-[10px] font-bold border ${i===4?'bg-emerald-600 text-white border-emerald-600':'border-gray-200 text-gray-600'}`}>{t}</div>
          ))}
        </div>
        <div className="bg-emerald-600 text-white text-center py-2 rounded-xl font-black text-xs">تأكيد الحجز ←</div>
      </div>
    </div>
  )
}

function SessionMockup() {
  return (
    <div className="bg-gray-900" dir="rtl">
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1.5">{['bg-red-500','bg-yellow-500','bg-green-500'].map(c=><div key={c} className={`w-2 h-2 rounded-full ${c}`}/>)}</div>
        <div className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"/><span className="text-white/60 text-[10px] font-mono">مباشر — 23:14</span></div>
        <div className="bg-red-600/20 text-red-400 text-[9px] font-bold px-1.5 py-0.5 rounded">● LIVE</div>
      </div>
      <div className="relative bg-gradient-to-br from-brand-900 to-brand-950 flex items-center justify-center" style={{aspectRatio:'16/9'}}>
        <div className="text-center">
          <div className="w-14 h-14 bg-white/10 rounded-full mx-auto mb-2 flex items-center justify-center"><span className="text-2xl">👨‍⚕️</span></div>
          <div className="text-white font-bold text-xs">الأستاذ أمين</div>
          <div className="text-white/50 text-[10px]">يشرح تمرين التسلسل العكسي</div>
        </div>
        <div className="absolute top-2 right-2 bg-white/10 backdrop-blur rounded-xl p-2 max-w-[130px]">
          <div className="text-white/70 text-[9px] mb-1 font-bold">التمرين الحالي</div>
          <div className="text-white text-[9px] font-black leading-tight">تحدي التسلسل المعكوس</div>
          <div className="flex gap-0.5 mt-1">{[1,2,3,4,5].map(n=><div key={n} className={`w-4 h-4 rounded flex items-center justify-center text-[8px] font-black ${n<=3?'bg-green-400 text-green-900':'bg-white/20 text-white'}`}>{n}</div>)}</div>
        </div>
        <div className="absolute bottom-2 left-2 w-16 h-11 bg-gray-700 rounded-lg flex items-center justify-center border border-white/20"><span className="text-xl">👦</span></div>
        <div className="absolute top-2 left-2 bg-amber-400 text-amber-900 rounded-lg px-2 py-1 text-center">
          <div className="font-black text-sm">+50</div><div className="text-[9px] font-bold">نقطة 🌟</div>
        </div>
      </div>
      <div className="bg-gray-800 px-4 py-2 flex items-center justify-between">
        <div className="flex gap-1.5">{['🎤','📷','🖥️','💬'].map(icon=><div key={icon} className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center text-xs">{icon}</div>)}</div>
        <div className="flex items-center gap-1"><div className="w-1.5 h-1.5 bg-emerald-400 rounded-full"/><span className="text-white/60 text-[10px]">جلسة تفاعلية</span></div>
        <div className="bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg">إنهاء</div>
      </div>
    </div>
  )
}

function ExercisesMockup() {
  return (
    <div className="bg-white" dir="rtl">
      <div className="bg-purple-700 px-4 py-3">
        <div className="text-white font-black text-sm">مكتبة التمارين العلمية</div>
        <div className="text-white/70 text-[10px]">+32 تمريناً — APA / ABA / CBT</div>
      </div>
      <div className="p-3.5">
        <div className="flex gap-1.5 mb-3">
          {[{l:'الكل',a:true},{l:'APA'},{l:'ABA'},{l:'CBT'}].map(({l,a})=>(
            <span key={l} className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${a?'bg-purple-600 text-white':'bg-gray-100 text-gray-500'}`}>{l}</span>
          ))}
        </div>
        <div className="space-y-2">
          {[{n:'Zone of Regulation',t:'ABA',c:'border-emerald-200 bg-emerald-50',g:'bg-emerald-600'},{n:'التسلسل المعكوس',t:'CBT',c:'border-purple-200 bg-purple-50',g:'bg-purple-600'},{n:'تمرين Go/No-Go',t:'APA',c:'border-blue-200 bg-blue-50',g:'bg-blue-600'},{n:'مرآة المشاعر',t:'ABA',c:'border-pink-200 bg-pink-50',g:'bg-pink-600'}].map(({n,t,c,g})=>(
            <div key={n} className={`rounded-lg border ${c} px-2.5 py-2 flex items-center justify-between`}>
              <div className="flex items-center gap-1.5">
                <span className={`text-white text-[9px] font-black px-1.5 py-0.5 rounded-full ${g}`}>{t}</span>
                <span className="text-gray-700 font-bold text-[10px]">{n}</span>
              </div>
              <span className="text-green-500 text-[10px]">▶</span>
            </div>
          ))}
        </div>
        <div className="mt-2.5 text-center text-purple-600 text-[10px] font-bold">عرض جميع التمارين (32+) ←</div>
      </div>
    </div>
  )
}

function ProgressMockup() {
  return (
    <div className="bg-white" dir="rtl">
      <div className="bg-amber-600 px-4 py-3 flex items-center justify-between">
        <div>
          <div className="text-white font-black text-xs">تقرير التقدم — أمير (9 سنوات)</div>
          <div className="text-white/70 text-[10px]">الشهر الثالث من البرنامج</div>
        </div>
        <div className="text-center"><div className="text-white font-black text-xl">A+</div><div className="text-white/70 text-[9px]">التقييم</div></div>
      </div>
      <div className="p-3.5">
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mb-3">
          <div className="flex items-center gap-1.5 mb-1"><Brain className="w-3 h-3 text-amber-600"/><span className="text-amber-700 font-bold text-[10px]">ملخص الأستاذ أمين</span></div>
          <p className="text-gray-700 text-[10px] leading-relaxed">أمير تحسّن في الانتباه من 3 دقائق إلى 8 دقائق. <strong className="text-amber-700">أنصح بـ Zone of Regulation.</strong></p>
        </div>
        <div className="space-y-2.5 mb-3">
          {[{l:'الانتباه المستمر',v:78,c:'#6B46F0'},{l:'كبح التشتت',v:62,c:'#8B5CF6'},{l:'الضبط الذاتي',v:55,c:'#10B981'},{l:'المهارات الاجتماعية',v:70,c:'#3B82F6'}].map(({l,v,c})=>(
            <div key={l}>
              <div className="flex justify-between mb-0.5"><span className="text-[10px] text-gray-700">{l}</span><span className="text-[10px] font-black text-gray-900">{v}%</span></div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:`${v}%`,background:c}}/></div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {[{l:'الجلسات',v:'12',c:'bg-brand-50 text-brand-700'},{l:'الإنجازات',v:'+8',c:'bg-amber-50 text-amber-700'},{l:'النقاط',v:'3,240',c:'bg-emerald-50 text-emerald-700'}].map(({l,v,c})=>(
            <div key={l} className={`${c} rounded-lg p-2 text-center`}><div className="font-black text-base">{v}</div><div className="text-[9px] font-bold">{l}</div></div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Hero visual ───────────────────────────────────────────────────────────────
function HeroVisual() {
  const items = ['🧠','⭐','🎯','🏆','💡','🌈','🎨','🔬']
  return (
    <div style={{position:'relative',width:220,height:220,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{position:'absolute',inset:0,borderRadius:'50%',background:'radial-gradient(circle,rgba(124,92,252,0.3) 0%,transparent 65%)'}}/>
      <div style={{position:'absolute',width:190,height:190,borderRadius:'50%',border:'1px solid rgba(124,92,252,0.18)',animation:'dspin 22s linear infinite'}}/>
      <div style={{position:'absolute',width:216,height:216,borderRadius:'50%',border:'1px dashed rgba(192,132,252,0.1)',animation:'dspin 32s linear infinite reverse'}}/>
      {items.map((e,i)=>{
        const a=(i/items.length)*Math.PI*2-Math.PI/2, r=95
        return (
          <div key={i} style={{position:'absolute',left:'50%',top:'50%',marginLeft:Math.cos(a)*r-10,marginTop:Math.sin(a)*r-10}}>
            <div style={{fontSize:18,animation:`dfloat ${2.5+(i%3)*0.4}s ease-in-out ${i*0.28}s infinite`}}>{e}</div>
          </div>
        )
      })}
      <div style={{width:84,height:84,borderRadius:28,background:'linear-gradient(135deg,#6B46F0,#9A7BFD)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 14px 45px rgba(107,70,240,0.6)',animation:'dfloat 4s ease-in-out infinite',position:'relative',zIndex:1}}>
        <span style={{color:'white',fontWeight:900,fontSize:40,lineHeight:1}}>أ</span>
      </div>
    </div>
  )
}

// ─── Slide data ────────────────────────────────────────────────────────────────
interface Slide { tag:string; title:string; sub:string; accent:string; color:string; url?:string; mockup?:React.ReactNode; isHero?:boolean }

const SLIDES: Slide[] = [
  { isHero:true, tag:'🌟 قطر • تونس • العالم العربي', title:'أكاديمية أمين', sub:'طفلك يفكّر بطريقة مختلفة — ونحن نتحدّث لغته', accent:'#C084FC', color:'#7C5CFC' },
  { tag:'① التسجيل', title:'ابدأ في دقيقتين', sub:'سجّل حسابك وبيانات طفلك — مجاني تماماً بدون بطاقة بنكية', accent:'#34D399', color:'#10B981', url:'amine-academy.com/register', mockup:<RegisterMockup/> },
  { tag:'② بوابة الولي', title:'كل شيء في مكان واحد', sub:'جلساتك القادمة، تمارين طفلك اليومية، ونقاطه — انضم بنقرة واحدة', accent:'#818CF8', color:'#6366F1', url:'amine-academy.com/parent/dashboard', mockup:<DashboardMockup/> },
  { tag:'③ حجز الجلسات', title:'احجز بثوانٍ', sub:'تقويم متزامن مع الأستاذ أمين — تأكيد فوري وتذكير تلقائي قبل الجلسة', accent:'#34D399', color:'#10B981', url:'amine-academy.com/parent/appointments', mockup:<BookingMockup/> },
  { tag:'④ الجلسة المباشرة', title:'ليست مجرد مكالمة', sub:'جلسة حركية ومعرفية تفاعلية — مع تتبع مستوى تركيز طفلك لحظياً', accent:'#F87171', color:'#EF4444', url:'amine-academy.com/session/live', mockup:<SessionMockup/> },
  { tag:'⑤ مكتبة التمارين', title:'+32 تمرين تفاعلي', sub:'للتركيز والذاكرة والمهارات الاجتماعية والحركة — أعمار 5 إلى 22 سنة', accent:'#C084FC', color:'#9333EA', url:'amine-academy.com/parent/exercises', mockup:<ExercisesMockup/> },
  { tag:'⑥ تقارير التقدم', title:'شاهد تطور طفلك بأرقام', sub:'تقرير شهري مفصّل مع توصيات الأستاذ ومقارنة بالمستويات المرجعية', accent:'#FBBF24', color:'#F59E0B', url:'amine-academy.com/parent/progress', mockup:<ProgressMockup/> },
]

// ─── Demo page ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [idx, setIdx]       = useState(0)
  const [playing, setPlaying] = useState(true) // auto-start
  const [muted, setMuted]   = useState(true)
  const [progress, setProgress] = useState(0)
  const [animKey, setAnimKey] = useState(0)

  const idxRef = useRef(0); idxRef.current = idx
  const audioCtxRef = useRef<AudioContext | null>(null)
  const stopMusicRef = useRef<(() => void) | null>(null)

  const navigate = useCallback((dir: 'next'|'prev') => {
    setProgress(0)
    setAnimKey(k => k + 1)
    setIdx(i => dir === 'next' ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  const goNext = useCallback(() => navigate('next'), [navigate])
  const goPrev = useCallback(() => navigate('prev'), [navigate])
  const goTo   = useCallback((t: number) => { setProgress(0); setAnimKey(k=>k+1); setIdx(t) }, [])

  // Auto-advance + smooth progress
  useEffect(() => {
    if (!playing) return
    const start = Date.now()
    const tick = setInterval(() => setProgress(Math.min(((Date.now()-start)/SLIDE_DURATION)*100, 100)), 30)
    const timer = setTimeout(goNext, SLIDE_DURATION)
    return () => { clearInterval(tick); clearTimeout(timer) }
  }, [playing, idx, goNext])

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code==='Space') { e.preventDefault(); setPlaying(p=>!p) }
      if (e.code==='ArrowLeft') goNext()
      if (e.code==='ArrowRight') goPrev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goNext, goPrev])

  // Music
  const toggleMusic = useCallback(async () => {
    if (muted) {
      try {
        const AC = (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ?? AudioContext
        const ctx = new AC()
        audioCtxRef.current = ctx
        stopMusicRef.current = createAmbientMusic(ctx)
        setMuted(false)
      } catch (_) {}
    } else {
      stopMusicRef.current?.(); stopMusicRef.current = null
      setTimeout(() => { audioCtxRef.current?.close(); audioCtxRef.current = null }, 2000)
      setMuted(true)
    }
  }, [muted])

  useEffect(() => () => { stopMusicRef.current?.(); setTimeout(()=>audioCtxRef.current?.close(),2000) }, [])

  const slide = SLIDES[idx]

  return (
    <div dir="rtl" style={{ minHeight:'100vh', background:'linear-gradient(160deg,#0c0818 0%,#180e38 55%,#091424 100%)', color:'white', display:'flex', flexDirection:'column' }}>
      <style>{`
        @keyframes dfloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)} }
        @keyframes dspin  { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dappear { from{opacity:0;transform:translateY(14px) scale(0.98)} to{opacity:1;transform:translateY(0) scale(1)} }
      `}</style>

      {/* ── Progress bar (top) ── */}
      <div style={{position:'fixed',top:0,left:0,right:0,height:3,zIndex:100,background:'rgba(255,255,255,0.06)'}}>
        <div style={{height:'100%',background:`linear-gradient(90deg,${slide.color},${slide.accent})`,width:`${(idx/SLIDES.length)*100 + progress/SLIDES.length}%`,transition:'width 0.03s linear',borderRadius:'0 2px 2px 0'}}/>
      </div>

      {/* ── Header ── */}
      <header style={{flexShrink:0,display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 20px',borderBottom:'1px solid rgba(255,255,255,0.05)',marginTop:3}}>
        <Link href="/" style={{color:'rgba(255,255,255,0.4)',fontSize:12,fontWeight:600,textDecoration:'none'}}>← الرئيسية</Link>
        <div style={{display:'flex',alignItems:'center',gap:6}}>
          <div style={{width:28,height:28,borderRadius:9,background:'linear-gradient(135deg,#6B46F0,#9A7BFD)',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <span style={{color:'white',fontWeight:900,fontSize:13}}>أ</span>
          </div>
          <span style={{fontWeight:900,fontSize:13,color:'white'}}>أكاديمية أمين</span>
        </div>
        <Link href="/register" style={{background:'linear-gradient(135deg,#6B46F0,#9A7BFD)',color:'white',fontWeight:900,fontSize:12,padding:'7px 16px',borderRadius:10,textDecoration:'none',boxShadow:'0 4px 16px rgba(107,70,240,.4)'}}>
          سجّل مجاناً ←
        </Link>
      </header>

      {/* ── Slide content ── */}
      <main style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:'20px 20px 10px',overflow:'hidden'}}>
        <div key={animKey} style={{width:'100%',maxWidth:700,display:'flex',flexDirection:'column',alignItems:'center',gap:12,animation:'dappear 0.55s cubic-bezier(0.22,1,0.36,1) both'}}>

          {/* Tag */}
          <div style={{fontSize:10,fontWeight:700,color:slide.accent,letterSpacing:2,textTransform:'uppercase',background:`${slide.color}18`,border:`1px solid ${slide.color}30`,padding:'4px 14px',borderRadius:20}}>
            {slide.tag}
          </div>

          {/* Title */}
          <h1 style={{fontSize:'clamp(24px,4.5vw,46px)',fontWeight:900,textAlign:'center',margin:0,lineHeight:1.15,color:'white'}}>
            {slide.title}
          </h1>

          {/* Subtitle */}
          <p style={{fontSize:'clamp(12px,1.6vw,15px)',color:'rgba(255,255,255,0.55)',textAlign:'center',margin:0,lineHeight:1.7,maxWidth:520}}>
            {slide.sub}
          </p>

          {/* Visual */}
          {slide.isHero
            ? <HeroVisual />
            : slide.mockup && slide.url
              ? <div style={{width:'100%'}}><Frame url={slide.url} color={slide.color}>{slide.mockup}</Frame></div>
              : null
          }
        </div>
      </main>

      {/* ── Controls bar ── */}
      <footer style={{flexShrink:0,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(16px)',borderTop:'1px solid rgba(255,255,255,0.05)',padding:'12px 20px 16px'}}>
        {/* Dots */}
        <div style={{display:'flex',justifyContent:'center',gap:6,marginBottom:10}}>
          {SLIDES.map((_,i) => (
            <button key={i} onClick={()=>goTo(i)} style={{height:6,width:i===idx?22:6,borderRadius:3,background:i===idx?slide.color:'rgba(255,255,255,0.2)',border:'none',cursor:'pointer',transition:'all 0.35s ease',padding:0}}/>
          ))}
        </div>

        {/* Buttons row */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10}}>
          <button onClick={goPrev} style={CB}><ChevronLeft size={16}/></button>

          <button
            onClick={()=>setPlaying(p=>!p)}
            style={{...CB,width:46,height:46,borderRadius:14,background:`${slide.color}30`,border:`1px solid ${slide.color}60`,color:slide.accent}}
          >
            {playing ? <Pause size={18}/> : <Play size={18} fill={slide.accent}/>}
          </button>

          <button onClick={goNext} style={CB}><ChevronRight size={16}/></button>

          <div style={{width:1,height:24,background:'rgba(255,255,255,0.1)',margin:'0 4px'}}/>

          <button
            onClick={toggleMusic}
            style={{...CB,color:muted?'rgba(255,255,255,0.35)':slide.accent}}
            title={muted?'تشغيل الموسيقى':'كتم الصوت'}
          >
            {muted ? <VolumeX size={15}/> : <Volume2 size={15}/>}
          </button>

          <div dir="ltr" style={{color:'rgba(255,255,255,0.3)',fontSize:11,fontWeight:700,fontFamily:'monospace',minWidth:32,textAlign:'center'}}>
            {idx+1}/{SLIDES.length}
          </div>
        </div>
      </footer>
    </div>
  )
}

const CB: React.CSSProperties = {
  width:38,height:38,borderRadius:11,
  background:'rgba(255,255,255,0.07)',
  border:'1px solid rgba(255,255,255,0.1)',
  color:'rgba(255,255,255,0.65)',
  cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
  flexShrink:0,
}
