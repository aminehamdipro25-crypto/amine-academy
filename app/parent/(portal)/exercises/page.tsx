'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import { Clock, CheckCircle, Play, X, Info, Volume2, Trophy, Flame, Zap } from 'lucide-react'
import type { Exercise, Student, ExerciseResult } from '@/lib/types'

// ── Lazy-load interactive game components ─────────────────────
const BreathingGuide   = dynamic(() => import('@/components/session/exercises/BreathingGuide'),   { ssr: false })
const SimonSays        = dynamic(() => import('@/components/session/exercises/SimonSays'),        { ssr: false })
const TargetTracking   = dynamic(() => import('@/components/session/exercises/TargetTracking'),   { ssr: false })
const PhysicalExercise = dynamic(() => import('@/components/session/exercises/PhysicalExercise'), { ssr: false })
const BalloonControl   = dynamic(() => import('@/components/session/exercises/BalloonControl'),   { ssr: false })
const ReactionGame     = dynamic(() => import('@/components/session/exercises/ReactionGame'),     { ssr: false })
const StopSignal       = dynamic(() => import('@/components/session/exercises/StopSignal'),       { ssr: false })
const BodyScan         = dynamic(() => import('@/components/session/exercises/BodyScan'),         { ssr: false })

// ── Types ─────────────────────────────────────────────────────
type Phase = 'grid' | 'prestart' | 'game' | 'complete'
type InteractiveKind =
  | 'breathing' | 'simon-says' | 'target-tracking' | 'physical'
  | 'balloon-control' | 'reaction-game' | 'stop-signal' | 'body-scan'
  | null
type PhysId = 'jumping-jacks' | 'obstacle-circuit' | 'balance-walk' | 'tiger-crawl' | 'ball-throw' | 'stretching' | 'body-percussion'

// ── Category config ───────────────────────────────────────────
const CAT_LABELS: Record<string, string> = {
  motor: 'حركي', focus: 'تركيز', balance: 'توازن',
  energy: 'طاقة', sensory: 'حسي', social: 'اجتماعي',
}
const CAT_CFG: Record<string, { gradient: string; icon: string; light: string; shadow: string; dark: string }> = {
  motor:   { gradient: 'linear-gradient(135deg,#FF8C65,#E05A2A)', icon: '🏃', light: '#FFF5F0', shadow: 'rgba(255,107,53,0.30)', dark: '#7A2000' },
  focus:   { gradient: 'linear-gradient(135deg,#7C5CFC,#5A32D9)', icon: '🎯', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.30)', dark: '#2E1065' },
  balance: { gradient: 'linear-gradient(135deg,#2ABFA3,#0D9488)', icon: '⚖️', light: '#F0FDFA', shadow: 'rgba(42,191,163,0.30)', dark: '#042F2E' },
  energy:  { gradient: 'linear-gradient(135deg,#FFBA44,#E07B00)', icon: '⚡', light: '#FFFBEB', shadow: 'rgba(255,186,68,0.30)', dark: '#451A03' },
  sensory: { gradient: 'linear-gradient(135deg,#EC4899,#BE185D)', icon: '🌈', light: '#FDF2F8', shadow: 'rgba(236,72,153,0.30)', dark: '#500724' },
  social:  { gradient: 'linear-gradient(135deg,#10B981,#047857)', icon: '🤝', light: '#ECFDF5', shadow: 'rgba(16,185,129,0.30)', dark: '#022C22' },
}
const DEFAULT_CFG = { gradient: 'linear-gradient(135deg,#7C5CFC,#9A7BFD)', icon: '⭐', light: '#F3EEFF', shadow: 'rgba(124,92,252,0.25)', dark: '#2E1065' }

const DIFF_MAP: Record<string, 1|2|3> = { beginner: 1, intermediate: 2, advanced: 3 }
const AGE_MAP: Record<string, number> = { '5-11': 8, '12-17': 14, '18-22': 20 }

// ── Interactive component detector ────────────────────────────
function detectInteractive(ex: Exercise): { kind: InteractiveKind; physId?: PhysId } {
  const t = ex.title.toLowerCase()
  // Breathing
  if (t.includes('bubble breath') || t.includes('box breath') || t.includes('breathing')) return { kind: 'breathing' }
  // Cognitive games
  if (t.includes('simon says')) return { kind: 'simon-says' }
  if (t.includes('stop') && t.includes('listen')) return { kind: 'stop-signal' }
  // Visual tracking — screen game (NOT "target toss" which is physical throwing)
  if (t.includes('digital tracking') || t.includes('visual tracking trail')) return { kind: 'target-tracking' }
  // Balloon control — inhibition game
  if (t.includes('balloon keep') || t.includes('balloon control')) return { kind: 'balloon-control' }
  // Reaction time
  if (t.includes('reaction time')) return { kind: 'reaction-game' }
  // Body scan / muscle relaxation
  if (t.includes('body scan') || t.includes('muscle relax') || t.includes('progressive muscle')) return { kind: 'body-scan' }
  // Physical exercises with timer component
  if (t.includes('jumping jack')) return { kind: 'physical', physId: 'jumping-jacks' }
  if (t.includes('obstacle navigation') || t.includes('obstacle circuit')) return { kind: 'physical', physId: 'obstacle-circuit' }
  if (t.includes('balance walk') || t.includes('balance beam')) return { kind: 'physical', physId: 'balance-walk' }
  if (t.includes('cross-lateral')) return { kind: 'physical', physId: 'tiger-crawl' }
  if (t.includes('ball throw')) return { kind: 'physical', physId: 'ball-throw' }
  if (t.includes('stretching') || t.includes('flexibility')) return { kind: 'physical', physId: 'stretching' }
  if (t.includes('body percussion')) return { kind: 'physical', physId: 'body-percussion' }
  return { kind: null }
}

// ── Step helpers ──────────────────────────────────────────────
function stepEmoji(text: string, cat: string): string {
  if (text.includes('تنفس') || text.includes('نفساً') || text.includes('زفير') || text.includes('شهيق')) return '💨'
  if (text.includes('فقاعة') || text.includes('نفخ')) return '🫧'
  if (text.includes('دب')) return '🐻'
  if (text.includes('ضفدع') || text.includes('اقفز') || text.includes('قفز')) return '🐸'
  if (text.includes('أفعى') || text.includes('ازحف') || text.includes('زحف')) return '🐍'
  if (text.includes('حصان') || text.includes('اركض') || text.includes('اجرِ')) return '🐴'
  if (text.includes('بالون')) return '🎈'
  if (text.includes('كرة')) return '⚽'
  if (text.includes('موسيقى') || text.includes('إيقاع') || text.includes('ميترونوم')) return '🎵'
  // Vision BEFORE audio
  if (text.includes('انظر') || text.includes('عين') || text.includes('بصر') || text.includes('ترى') || text.includes('تراها') || text.includes('شاهد')) return '👁️'
  if ((text.includes('استمع') || text.includes('اسمع') || text.includes('صوت')) && !text.includes('بصوت')) return '👂'
  if (text.includes('لمس') || text.includes('الملس') || text.includes('تلمس')) return '🤚'
  if (text.includes('شمّ') || text.includes('تشمه') || text.includes('رائحة')) return '👃'
  if (text.includes('تذوق') || text.includes('طعم')) return '👅'
  if (text.includes('امشِ') || text.includes('مشي') || text.includes('خطوة')) return '🚶'
  if (text.includes('تصفيق') || text.includes('صفق')) return '👏'
  if (text.includes('قف') || text.includes('تجمّد') || text.includes('اثبت') || text.includes('لا تتحرك')) return '🧍'
  if (text.includes('اجلس') || text.includes('جلوس')) return '🧘'
  if (text.includes('ارفع') || text.includes('رفع')) return '💪'
  if (text.includes('ارمِ') || text.includes('رمي') || text.includes('قذف')) return '🎯'
  if (text.includes('استرح') || text.includes('راحة')) return '😮‍💨'
  if (text.includes('ابدأ') || text.includes('استعد')) return '🚀'
  if (text.includes('كرر') || text.includes('تكرار')) return '🔄'
  if (text.includes('توازن')) return '⚖️'
  if (text.includes('سيمون') || text.includes('سايمون')) return '🎮'
  if (text.includes('هدف') || text.includes('رقم')) return '🎯'
  if (text.includes('تأمل') || text.includes('يقظ')) return '🌟'
  if (text.includes('ماء') || text.includes('سباح')) return '🌊'
  if (text.includes('كتاب') || text.includes('اقرأ')) return '📖'
  return { motor: '🏃', focus: '🎯', balance: '⚖️', energy: '⚡', sensory: '🌈', social: '🤝' }[cat] || '⭐'
}

function keyTitle(text: string): string {
  const clean = text.replace(/\([^)]*\)/g, '').trim()
  const parts = clean.split(/\s*[—:؛،]\s*/)
  const first = parts[0].trim()
  // "المرحلة N / الجولة N / الجلسة N" are stage labels, not useful alone — append name
  if (/^(المرحلة|الجولة|الجلسة)\s+\d/.test(first) && parts.length > 1) {
    const label = first
    const name  = parts[1].trim().split(' ').slice(0, 3).join(' ')
    return `${label}: ${name}`
  }
  if (first.length <= 28) return first
  return first.split(' ').slice(0, 5).join(' ')
}

function extractCount(text: string): number | null {
  const m = text.match(/^(\d+)\s+أشياء|^(\d+)\s+أشي|^(\d+)\s+شيء/)
  if (m) return parseInt(m[1] || m[2] || m[3])
  return null
}

function extractTimer(text: string): number | null {
  const m = text.match(/لعد\s+(\d+)|(\d+)\s+ثانية|(\d+)\s+ث[^و]|لمدة\s+(\d+)/)
  if (m) return parseInt(m[1] || m[2] || m[3] || m[4])
  return null
}

function speakAr(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utt = new SpeechSynthesisUtterance(text)
  utt.lang = 'ar-SA'; utt.rate = 0.85; utt.pitch = 1.1
  window.speechSynthesis.speak(utt)
}

// ── Web Audio SFX engine (no external files) ──────────────────
let _sfxCtx: AudioContext | null = null
function _sfxCtone(freq: number, dur: number, type: OscillatorType = 'sine', vol = 0.22) {
  if (typeof window === 'undefined') return
  try {
    if (!_sfxCtx) _sfxCtx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    if (_sfxCtx.state === 'suspended') _sfxCtx.resume()
    const osc = _sfxCtx.createOscillator()
    const g   = _sfxCtx.createGain()
    osc.connect(g); g.connect(_sfxCtx.destination)
    osc.frequency.value = freq; osc.type = type
    g.gain.setValueAtTime(0, _sfxCtx.currentTime)
    g.gain.linearRampToValueAtTime(vol, _sfxCtx.currentTime + 0.01)
    g.gain.exponentialRampToValueAtTime(0.001, _sfxCtx.currentTime + dur)
    osc.start(_sfxCtx.currentTime)
    osc.stop(_sfxCtx.currentTime + dur + 0.05)
  } catch { /* audio not supported */ }
}

const sfx = {
  step:     () => _sfxCtone(660, 0.09, 'sine', 0.18),
  back:     () => _sfxCtone(440, 0.07, 'sine', 0.14),
  start:    () => { _sfxCtone(440,0.1); setTimeout(()=>_sfxCtone(550,0.1),100); setTimeout(()=>_sfxCtone(660,0.15),200) },
  complete: () => [523,659,784,1047].forEach((f,i)=>setTimeout(()=>_sfxCtone(f,0.22,'sine',0.22),i*130)),
  tap:      () => _sfxCtone(900, 0.06, 'square', 0.08),
  tick:     () => _sfxCtone(1300, 0.04, 'sine', 0.05),
  pop:      () => _sfxCtone(700, 0.05, 'sine', 0.12),
  done:     () => { _sfxCtone(660,0.1,'sine',0.2); setTimeout(()=>_sfxCtone(880,0.15,'sine',0.18),100) },
}

function equipEmoji(eq: string): string {
  if (eq.includes('بالون')) return '🎈'
  if (eq.includes('كرة')) return '⚽'
  if (eq.includes('ماء')) return '🌊'
  if (eq.includes('حصير') || eq.includes('mat')) return '🟣'
  if (eq.includes('موسيق')) return '🎵'
  if (eq.includes('ورق')) return '📄'
  if (eq.includes('شريط')) return '🖊️'
  if (eq.includes('كرسي')) return '🪑'
  return '📦'
}

// ── Exercise pose SVG illustrations (filled cartoon style) ───
function StepIllustration({ text, color }: { text: string; color: string }) {
  const t = text

  // ── Cat-Cow yoga pose ──
  if (t.includes('قطة') || t.includes('بقرة'))
    return <svg viewBox="0 0 220 145" width={210} height={138}><g opacity={0.96}>
      {/* floor shadow */}
      <ellipse cx={110} cy={137} rx={88} ry={8} fill={color} opacity={0.12}/>
      {/* body (filled oval) */}
      <ellipse cx={120} cy={86} rx={62} ry={30} fill={color} transform="rotate(-3 120 86)"/>
      {/* arch indicator */}
      <path d="M72 72 Q120 44 168 72" stroke="white" strokeWidth={3.5} fill="none" opacity={0.45} strokeDasharray="8 5"/>
      {/* neck */}
      <ellipse cx={60} cy={82} rx={20} ry={13} fill={color} transform="rotate(-15 60 82)"/>
      {/* head */}
      <circle cx={40} cy={75} r={26} fill={color}/>
      {/* ears */}
      <path d="M25 54 L18 36 L36 50" fill={color}/>
      <path d="M27 53 L22 40 L34 49" fill="white" opacity={0.25}/>
      <path d="M50 50 L53 33 L64 48" fill={color}/>
      <path d="M51 50 L54 37 L62 47" fill="white" opacity={0.25}/>
      {/* eyes */}
      <ellipse cx={30} cy={71} rx={6} ry={7} fill="white"/>
      <ellipse cx={30} cy={72} rx={3.5} ry={4.5} fill="#1a1a2e"/>
      <circle cx={31} cy={69} r={1.5} fill="white"/>
      <ellipse cx={50} cy={71} rx={6} ry={7} fill="white"/>
      <ellipse cx={50} cy={72} rx={3.5} ry={4.5} fill="#1a1a2e"/>
      <circle cx={51} cy={69} r={1.5} fill="white"/>
      {/* nose */}
      <ellipse cx={40} cy={83} rx={5} ry={3.5} fill="white" opacity={0.55}/>
      {/* whiskers */}
      <line x1={8}  y1={78} x2={22} y2={80} stroke="white" strokeWidth={1.5} opacity={0.5}/>
      <line x1={8}  y1={83} x2={22} y2={83} stroke="white" strokeWidth={1.5} opacity={0.5}/>
      <line x1={58} y1={80} x2={72} y2={78} stroke="white" strokeWidth={1.5} opacity={0.5}/>
      <line x1={58} y1={83} x2={72} y2={83} stroke="white" strokeWidth={1.5} opacity={0.5}/>
      {/* front legs (filled rounded rects) */}
      <rect x={76} y={106} width={20} height={34} rx={10} fill={color}/>
      <rect x={100} y={108} width={20} height={32} rx={10} fill={color} opacity={0.8}/>
      {/* back legs */}
      <rect x={130} y={106} width={20} height={34} rx={10} fill={color}/>
      <rect x={153} y={108} width={20} height={32} rx={10} fill={color} opacity={0.8}/>
      {/* tail */}
      <path d="M180 82 Q202 60 198 38 Q196 26 188 29" stroke={color} strokeWidth={13} fill="none" strokeLinecap="round"/>
      <circle cx={186} cy={30} r={10} fill={color}/>
    </g></svg>

  // ── Tree pose ──
  if (t.includes('شجرة'))
    return <svg viewBox="0 0 120 195" width={110} height={188}><g>
      <ellipse cx={62} cy={188} rx={36} ry={7} fill={color} opacity={0.12}/>
      {/* standing leg */}
      <rect x={52} y={122} width={22} height={64} rx={11} fill={color}/>
      {/* raised leg bent outward */}
      <path d="M52 148 Q32 140 26 118 Q24 106 34 102" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={36} cy={100} r={12} fill={color}/>
      {/* body */}
      <rect x={49} y={58} width={28} height={68} rx={14} fill={color}/>
      {/* arms raised like branches */}
      <path d="M49 80 L14 52" stroke={color} strokeWidth={19} fill="none" strokeLinecap="round"/>
      <circle cx={11} cy={50} r={11} fill={color}/>
      <path d="M77 80 L110 52" stroke={color} strokeWidth={19} fill="none" strokeLinecap="round"/>
      <circle cx={113} cy={50} r={11} fill={color}/>
      {/* head */}
      <circle cx={63} cy={36} r={26} fill={color}/>
      <ellipse cx={54} cy={34} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={54} cy={35} r={3} fill="#1a1a2e"/>
      <circle cx={55} cy={32} r={1.5} fill="white"/>
      <ellipse cx={72} cy={34} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={72} cy={35} r={3} fill="#1a1a2e"/>
      <circle cx={73} cy={32} r={1.5} fill="white"/>
      <path d="M57 44 Q63 49 69 44" stroke="white" strokeWidth={2.5} fill="none" opacity={0.75}/>
    </g></svg>

  // ── Warrior pose ──
  if (t.includes('محارب'))
    return <svg viewBox="0 0 210 165" width={200} height={158}><g>
      <ellipse cx={100} cy={158} rx={65} ry={7} fill={color} opacity={0.12}/>
      {/* back leg straight */}
      <path d="M88 118 L52 158" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      {/* front leg bent */}
      <path d="M88 118 L124 126 L128 158" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      {/* body */}
      <rect x={75} y={58} width={28} height={64} rx={14} fill={color}/>
      {/* arms spread wide */}
      <path d="M75 82 L18 72" stroke={color} strokeWidth={19} fill="none" strokeLinecap="round"/>
      <circle cx={14} cy={71} r={11} fill={color}/>
      <path d="M103 82 L172 72" stroke={color} strokeWidth={19} fill="none" strokeLinecap="round"/>
      <circle cx={176} cy={71} r={11} fill={color}/>
      {/* head */}
      <circle cx={89} cy={36} r={26} fill={color}/>
      <ellipse cx={80} cy={34} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={81} cy={35} r={3} fill="#1a1a2e"/>
      <circle cx={82} cy={32} r={1.5} fill="white"/>
      <ellipse cx={98} cy={34} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={99} cy={35} r={3} fill="#1a1a2e"/>
      <circle cx={100} cy={32} r={1.5} fill="white"/>
      <path d="M83 44 Q89 49 95 44" stroke="white" strokeWidth={2.5} fill="none" opacity={0.75}/>
    </g></svg>

  // ── Bridge pose ──
  if (t.includes('جسر'))
    return <svg viewBox="0 0 225 115" width={215} height={108}><g>
      <ellipse cx={112} cy={108} rx={92} ry={7} fill={color} opacity={0.12}/>
      {/* head lying on floor */}
      <circle cx={26} cy={84} r={24} fill={color}/>
      <circle cx={18} cy={82} r={5} fill="white" opacity={0.85}/>
      <circle cx={19} cy={83} r={3} fill="#1a1a2e"/>
      <path d="M20 90 Q25 94 30 90" stroke="white" strokeWidth={2} fill="none" opacity={0.6}/>
      {/* body arched up (bridge shape) */}
      <path d="M48 84 Q62 70 82 52 Q106 30 135 52 Q155 68 168 84" stroke={color} strokeWidth={26} fill="none" strokeLinecap="round"/>
      {/* arm on ground */}
      <path d="M44 86 L26 100" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={24} cy={102} r={10} fill={color}/>
      {/* feet planted */}
      <path d="M168 84 L180 100" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      <ellipse cx={184} cy={104} rx={16} ry={9} fill={color}/>
      <path d="M156 84 L164 102" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      <ellipse cx={167} cy={105} rx={14} ry={8} fill={color} opacity={0.8}/>
    </g></svg>

  // ── Child's pose ──
  if ((t.includes('طفل') && (t.includes('وضع') || t.includes('انحن'))) || t.includes('مسترخ'))
    return <svg viewBox="0 0 230 115" width={218} height={108}><g>
      <ellipse cx={115} cy={108} rx={95} ry={7} fill={color} opacity={0.12}/>
      {/* head resting on floor */}
      <circle cx={42} cy={76} r={26} fill={color}/>
      <circle cx={32} cy={82} r={5} fill="white" opacity={0.8}/>
      {/* arms stretched forward on ground */}
      <path d="M42 80 L12 76" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={8} cy={75} r={10} fill={color}/>
      {/* curved body (kneeling, bent forward) */}
      <path d="M64 76 Q90 70 116 84 Q136 94 148 90" stroke={color} strokeWidth={28} fill="none" strokeLinecap="round"/>
      {/* hips / bottom */}
      <ellipse cx={154} cy={90} rx={28} ry={20} fill={color} opacity={0.9}/>
      {/* feet folded back */}
      <path d="M152 108 Q172 112 192 106" stroke={color} strokeWidth={16} fill="none" strokeLinecap="round"/>
    </g></svg>

  // ── Seated butterfly / cross-legged ──
  if (t.includes('فراشة') || t.includes('اجلس') || t.includes('جلوس'))
    return <svg viewBox="0 0 145 155" width={135} height={148}><g>
      <ellipse cx={72} cy={148} rx={52} ry={7} fill={color} opacity={0.12}/>
      {/* left leg (bent, knee out) */}
      <path d="M72 110 Q44 122 24 112 Q16 106 22 98 Q32 88 52 96" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      {/* right leg */}
      <path d="M72 110 Q100 122 120 112 Q128 106 122 98 Q112 88 92 96" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      {/* body */}
      <rect x={58} y={54} width={30} height={60} rx={15} fill={color}/>
      {/* arms resting on knees */}
      <path d="M58 80 L34 96" stroke={color} strokeWidth={17} fill="none" strokeLinecap="round"/>
      <circle cx={30} cy={98} r={10} fill={color}/>
      <path d="M88 80 L110 96" stroke={color} strokeWidth={17} fill="none" strokeLinecap="round"/>
      <circle cx={114} cy={98} r={10} fill={color}/>
      {/* head */}
      <circle cx={73} cy={30} r={28} fill={color}/>
      <ellipse cx={63} cy={28} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={63} cy={29} r={3} fill="#1a1a2e"/>
      <circle cx={64} cy={26} r={1.5} fill="white"/>
      <ellipse cx={83} cy={28} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={83} cy={29} r={3} fill="#1a1a2e"/>
      <circle cx={84} cy={26} r={1.5} fill="white"/>
      <path d="M66 40 Q73 45 80 40" stroke="white" strokeWidth={2.5} fill="none" opacity={0.75}/>
    </g></svg>

  // ── Swimming ──
  if (t.includes('سباح') || t.includes('عوم') || t.includes('سباح'))
    return <svg viewBox="0 0 240 120" width={225} height={112}><g>
      {/* water */}
      <path d="M0 90 Q30 80 60 90 Q90 100 120 90 Q150 80 180 90 Q210 100 240 90 L240 120 L0 120" fill={color} opacity={0.14}/>
      <path d="M0 95 Q30 85 60 95 Q90 105 120 95 Q150 85 180 95 Q210 105 240 95" stroke={color} strokeWidth={3} fill="none" opacity={0.38}/>
      {/* body horizontal */}
      <rect x={65} y={56} width={115} height={30} rx={15} fill={color}/>
      {/* head (side view) */}
      <circle cx={188} cy={62} r={28} fill={color}/>
      <circle cx={202} cy={58} r={6} fill="white" opacity={0.9}/>
      <circle cx={204} cy={59} r={3.5} fill="#1a1a2e"/>
      <circle cx={205} cy={56} r={1.5} fill="white"/>
      <path d="M200 70 Q205 74 212 70" stroke="white" strokeWidth={2} fill="none" opacity={0.6}/>
      {/* arm forward */}
      <path d="M65 66 Q38 52 14 48" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={10} cy={46} r={12} fill={color}/>
      {/* arm back / recovering */}
      <path d="M100 68 Q112 90 104 108" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={104} cy={112} r={11} fill={color}/>
      {/* legs kicking */}
      <path d="M65 72 Q44 86 24 80" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <path d="M65 60 Q45 46 28 52" stroke={color} strokeWidth={17} fill="none" strokeLinecap="round" opacity={0.75}/>
    </g></svg>

  // ── Jumping (star jump) ──
  if (t.includes('اقفز') || t.includes('قفز') || t.includes('ضفدع'))
    return <svg viewBox="0 0 175 195" width={162} height={185}><g>
      <ellipse cx={88} cy={188} rx={48} ry={7} fill={color} opacity={0.12}/>
      {/* legs spread diagonally */}
      <path d="M88 128 L42 178" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={38} cy={183} rx={18} ry={10} fill={color}/>
      <path d="M88 128 L134 178" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={138} cy={183} rx={18} ry={10} fill={color}/>
      {/* body */}
      <rect x={74} y={58} width={28} height={74} rx={14} fill={color}/>
      {/* arms spread up-diagonally */}
      <path d="M74 84 L18 46" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={13} cy={43} r={12} fill={color}/>
      <path d="M102 84 L158 46" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={163} cy={43} r={12} fill={color}/>
      {/* head */}
      <circle cx={88} cy={33} r={28} fill={color}/>
      <ellipse cx={79} cy={31} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={79} cy={32} r={3} fill="#1a1a2e"/>
      <circle cx={80} cy={29} r={1.5} fill="white"/>
      <ellipse cx={97} cy={31} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={97} cy={32} r={3} fill="#1a1a2e"/>
      <circle cx={98} cy={29} r={1.5} fill="white"/>
      <path d="M81 42 Q88 48 95 42" stroke="white" strokeWidth={2.5} fill="none" opacity={0.8}/>
    </g></svg>

  // ── Walking ──
  if (t.includes('امشِ') || t.includes('مشي') || t.includes('تمشي') || t.includes('خطوة'))
    return <svg viewBox="0 0 140 195" width={128} height={185}><g>
      <ellipse cx={72} cy={188} rx={42} ry={7} fill={color} opacity={0.12}/>
      {/* legs in stride */}
      <path d="M78 128 L46 178" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={43} cy={182} rx={18} ry={10} fill={color}/>
      <path d="M78 128 L100 168" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={103} cy={172} rx={18} ry={10} fill={color}/>
      {/* body slightly angled */}
      <rect x={64} y={56} width={28} height={76} rx={14} fill={color} transform="rotate(4 78 94)"/>
      {/* arms swinging opposite to legs */}
      <path d="M66 80 L28 58" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={23} cy={55} r={12} fill={color}/>
      <path d="M96 82 L122 105" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={125} cy={108} r={11} fill={color}/>
      {/* head */}
      <circle cx={82} cy={32} r={28} fill={color}/>
      <ellipse cx={73} cy={30} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={73} cy={31} r={3} fill="#1a1a2e"/>
      <circle cx={74} cy={28} r={1.5} fill="white"/>
      <ellipse cx={91} cy={30} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={91} cy={31} r={3} fill="#1a1a2e"/>
      <circle cx={92} cy={28} r={1.5} fill="white"/>
      <path d="M76 41 Q82 46 88 41" stroke="white" strokeWidth={2.5} fill="none" opacity={0.75}/>
    </g></svg>

  // ── Throwing / lifting ──
  if (t.includes('ارمِ') || t.includes('رمي') || t.includes('ارفع') || t.includes('رمية'))
    return <svg viewBox="0 0 190 195" width={178} height={185}><g>
      <ellipse cx={75} cy={188} rx={50} ry={7} fill={color} opacity={0.12}/>
      {/* ball in air */}
      <circle cx={162} cy={32} r={22} fill={color} opacity={0.35}/>
      <circle cx={162} cy={32} r={16} fill={color} opacity={0.65}/>
      {/* motion trail */}
      <path d="M108 74 Q136 52 150 40" stroke={color} strokeWidth={3.5} fill="none" opacity={0.3} strokeDasharray="7 5"/>
      {/* legs planted wide */}
      <path d="M78 128 L44 178" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={41} cy={182} rx={18} ry={10} fill={color}/>
      <path d="M78 128 L104 166" stroke={color} strokeWidth={24} fill="none" strokeLinecap="round"/>
      <ellipse cx={107} cy={170} rx={18} ry={10} fill={color}/>
      {/* body rotated in throw */}
      <rect x={64} y={52} width={28} height={80} rx={14} fill={color} transform="rotate(10 78 92)"/>
      {/* throwing arm high */}
      <path d="M84 72 L118 58" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={122} cy={56} r={12} fill={color}/>
      {/* other arm back */}
      <path d="M68 82 L30 100" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={26} cy={102} r={11} fill={color}/>
      {/* head */}
      <circle cx={82} cy={28} r={28} fill={color}/>
      <ellipse cx={73} cy={26} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={74} cy={27} r={3} fill="#1a1a2e"/>
      <circle cx={76} cy={24} r={1.5} fill="white"/>
      <ellipse cx={91} cy={26} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={92} cy={27} r={3} fill="#1a1a2e"/>
      <circle cx={94} cy={24} r={1.5} fill="white"/>
    </g></svg>

  // ── Clapping / body percussion ──
  if (t.includes('تصفيق') || t.includes('صفق') || t.includes('إيقاع'))
    return <svg viewBox="0 0 155 195" width={143} height={185}><g>
      <ellipse cx={78} cy={188} rx={44} ry={7} fill={color} opacity={0.12}/>
      {/* sound rings */}
      <path d="M42 96 Q22 108 22 120 Q22 132 42 142" stroke={color} strokeWidth={3.5} fill="none" opacity={0.28} strokeLinecap="round"/>
      <path d="M113 96 Q133 108 133 120 Q133 132 113 142" stroke={color} strokeWidth={3.5} fill="none" opacity={0.28} strokeLinecap="round"/>
      {/* legs together */}
      <rect x={60} y={130} width={22} height={56} rx={11} fill={color}/>
      <rect x={84} y={130} width={22} height={56} rx={11} fill={color}/>
      {/* body */}
      <rect x={57} y={58} width={42} height={76} rx={21} fill={color}/>
      {/* hands clapping (meeting at center) */}
      <path d="M57 90 L26 110" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={62} cy={116} r={18} fill={color}/>
      <circle cx={82} cy={116} r={18} fill={color}/>
      <path d="M99 90 L130 110" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      {/* head */}
      <circle cx={78} cy={33} r={28} fill={color}/>
      <ellipse cx={69} cy={31} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={69} cy={32} r={3} fill="#1a1a2e"/>
      <circle cx={70} cy={29} r={1.5} fill="white"/>
      <ellipse cx={87} cy={31} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={87} cy={32} r={3} fill="#1a1a2e"/>
      <circle cx={88} cy={29} r={1.5} fill="white"/>
      <path d="M72 42 Q78 48 84 42" stroke="white" strokeWidth={2.5} fill="none" opacity={0.85}/>
    </g></svg>

  // ── Lying flat / stretch / relaxation ──
  if (t.includes('مد') || t.includes('تمدد') || t.includes('استرخ') || t.includes('ارقد') || t.includes('استلقِ'))
    return <svg viewBox="0 0 230 95" width={218} height={88}><g>
      <ellipse cx={115} cy={88} rx={98} ry={7} fill={color} opacity={0.12}/>
      {/* head */}
      <circle cx={28} cy={60} r={26} fill={color}/>
      {/* closed eyes (relaxing) */}
      <path d="M20 58 Q24 62 28 58" stroke="white" strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round"/>
      <path d="M30 58 Q34 62 38 58" stroke="white" strokeWidth={2.5} fill="none" opacity={0.7} strokeLinecap="round"/>
      <path d="M22 68 Q28 72 34 68" stroke="white" strokeWidth={2} fill="none" opacity={0.5}/>
      {/* body lying flat */}
      <rect x={50} y={50} width={136} height={28} rx={14} fill={color}/>
      {/* arm above head */}
      <path d="M50 58 L22 42" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={18} cy={40} r={12} fill={color}/>
      {/* other arm alongside body */}
      <path d="M148} y1={68} L188 72" stroke={color} strokeWidth={18} fill="none" strokeLinecap="round"/>
      <circle cx={192} cy={73} r={11} fill={color}/>
      {/* legs straight together */}
      <path d="M186 64 L215 62" stroke={color} strokeWidth={22} fill="none" strokeLinecap="round"/>
      <ellipse cx={219} cy={62} rx={14} ry={10} fill={color}/>
      <path d="M186 72 L215 74" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
    </g></svg>

  // ── Breathing / standing calm ──
  if (t.includes('تنفس') || t.includes('استنشق') || t.includes('زفير') || t.includes('شهيق') || t.includes('نفس'))
    return <svg viewBox="0 0 145 195" width={133} height={185}><g>
      <ellipse cx={72} cy={188} rx={40} ry={7} fill={color} opacity={0.12}/>
      {/* breath glow rings */}
      <circle cx={72} cy={80} r={62} fill={color} opacity={0.07}/>
      <circle cx={72} cy={80} r={46} fill={color} opacity={0.09}/>
      {/* legs */}
      <rect x={54} y={130} width={22} height={56} rx={11} fill={color}/>
      <rect x={78} y={130} width={22} height={56} rx={11} fill={color}/>
      {/* body */}
      <rect x={50} y={62} width={44} height={72} rx={22} fill={color}/>
      {/* arms slightly lifted */}
      <path d="M50 88 L14 72" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={10} cy={70} r={12} fill={color}/>
      <path d="M94 88 L130 72" stroke={color} strokeWidth={20} fill="none" strokeLinecap="round"/>
      <circle cx={134} cy={70} r={12} fill={color}/>
      {/* head */}
      <circle cx={72} cy={37} r={28} fill={color}/>
      <ellipse cx={63} cy={35} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={63} cy={36} r={3} fill="#1a1a2e"/>
      <circle cx={64} cy={33} r={1.5} fill="white"/>
      <ellipse cx={81} cy={35} rx={5} ry={6} fill="white" opacity={0.9}/>
      <circle cx={81} cy={36} r={3} fill="#1a1a2e"/>
      <circle cx={82} cy={33} r={1.5} fill="white"/>
      <path d="M66 47 Q72 52 78 47" stroke="white" strokeWidth={2.5} fill="none" opacity={0.75}/>
      {/* breath dots above head */}
      <circle cx={72} cy={12} r={5} fill={color} opacity={0.4}/>
      <circle cx={60} cy={7}  r={3.5} fill={color} opacity={0.28}/>
      <circle cx={84} cy={7}  r={3.5} fill={color} opacity={0.28}/>
    </g></svg>

  return null
}

// ── Guided Step Timer sub-component ──────────────────────────
function StepTimer({ seconds, onDone }: { seconds: number; onDone: () => void }) {
  const [left, setLeft] = useState(seconds)
  useEffect(() => {
    const id = setInterval(() => setLeft(l => {
      if (l <= 1) { clearInterval(id); sfx.done(); onDone(); return 0 }
      if (l <= 4) sfx.tick()
      return l - 1
    }), 1000)
    return () => clearInterval(id)
  }, [onDone, seconds])
  const pct = ((seconds - left) / seconds) * 100
  const r = 36, circ = 2 * Math.PI * r
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={90} height={90} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={6} />
        <circle cx={45} cy={45} r={r} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth={6}
          strokeDasharray={circ} strokeDashoffset={circ * (1 - pct / 100)}
          style={{ transition: 'stroke-dashoffset 0.9s linear' }} strokeLinecap="round" />
      </svg>
      <div className="font-black text-white text-2xl -mt-14 mb-10">{left}</div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────────
export default function ExercisesPage() {
  const [exercises,  setExercises]  = useState<Exercise[]>([])
  const [child,      setChild]      = useState<Student | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [filter,     setFilter]     = useState('all')
  const [selected,   setSelected]   = useState<Exercise | null>(null)
  const [phase,      setPhase]      = useState<Phase>('grid')
  const [step,       setStep]       = useState(0)
  const [stepTimer,  setStepTimer]  = useState(false)
  const [groundTaps, setGroundTaps] = useState(0)   // for grounding 5-4-3-2-1
  const [completed,  setCompleted]  = useState<Set<string>>(new Set())
  const [result,     setResult]     = useState<ExerciseResult | null>(null)
  const [showInfo,   setShowInfo]   = useState(false)
  const [sessionSec, setSessionSec] = useState(0)
  const [timerOn,    setTimerOn]    = useState(false)
  const [zoneSelected, setZoneSelected] = useState<number | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    fetch('/api/parent/me').then(r => r.json()).then(d => {
      const c = d.children?.[0] || null
      setChild(c)
      const q = c ? `age=${c.ageGroup}&diagnosis=${c.diagnosis}` : ''
      return fetch(`/api/exercises?${q}`)
    }).then(r => r.json()).then(d => setExercises(d.exercises || []))
    .finally(() => setLoading(false))
  }, [])

  // Session timer
  useEffect(() => {
    if (timerOn) {
      timerRef.current = setInterval(() => setSessionSec(s => s + 1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timerOn])

  // Auto-speak guided step
  useEffect(() => {
    if (phase !== 'game' || !selected) return
    const { kind } = detectInteractive(selected)
    if (kind) return
    const steps = selected.instructionsAr || selected.instructions || []
    if (!steps[step]) return
    const id = setTimeout(() => speakAr(keyTitle(steps[step])), 450)
    return () => { clearTimeout(id); window.speechSynthesis?.cancel() }
  }, [step, phase, selected])

  const openExercise = useCallback((ex: Exercise) => {
    setSelected(ex); setPhase('prestart'); setStep(0)
    setResult(null); setShowInfo(false); setStepTimer(false); setGroundTaps(0)
    sfx.pop()
  }, [])

  function startExercise() {
    sfx.start()
    setPhase('game'); setTimerOn(true)
  }

  function handleComplete(r?: ExerciseResult) {
    if (!selected) return
    setTimerOn(false)
    sfx.complete()
    setCompleted(prev => new Set([...prev, selected.id]))
    setResult(r || {
      exerciseType: selected.title, exerciseLabelAr: selected.titleAr,
      score: 100, accuracy: 100, duration: sessionSec, errors: 0,
      metadata: {}, completedAt: new Date().toISOString(),
    })
    setPhase('complete')
  }

  function handleCancel() {
    setTimerOn(false)
    window.speechSynthesis?.cancel()
    setPhase('prestart')
  }

  function closeAll() {
    setTimerOn(false)
    window.speechSynthesis?.cancel()
    setSelected(null); setPhase('grid')
  }

  const filtered  = filter === 'all' ? exercises : exercises.filter(e => e.category === filter)
  const cats      = ['all', ...Object.keys(CAT_LABELS)]
  const fmt       = (s: number) => `${String(Math.floor(s / 60)).padStart(2,'0')}:${String(s % 60).padStart(2,'0')}`
  const totalPts  = Array.from(completed).reduce((s, id) => s + (exercises.find(e => e.id === id)?.points || 0), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-20" dir="rtl">
      <div className="text-6xl" style={{ animation: 'spin 1s linear infinite' }}>🎮</div>
    </div>
  )

  return (
    <div dir="rtl" className="space-y-5">

      {/* ── Header ── */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-black text-2xl text-gray-900">التمارين 🎮</h1>
          {child && (
            <p className="text-gray-400 text-sm mt-0.5">
              {child.firstName} • {child.ageGroup} سنة
            </p>
          )}
        </div>
        {child?.streak ? (
          <div className="flex items-center gap-1.5 px-3 py-2 rounded-2xl"
            style={{ background: '#FFFBEB', border: '1.5px solid #FDE68A' }}>
            <Flame className="w-4 h-4 text-orange-500" />
            <span className="font-black text-sm text-orange-700">{child.streak} يوم</span>
          </div>
        ) : null}
      </div>

      {/* ── Stats row ── */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'متاح',  value: exercises.length, bg: '#F3EEFF', color: '#5A32D9', icon: '📚' },
          { label: 'أنجزت', value: completed.size,   bg: '#ECFDF5', color: '#059669', icon: '✅' },
          { label: 'نقاط',  value: totalPts,         bg: '#FFFBEB', color: '#B45309', icon: '⭐' },
        ].map(({ label, value, bg, color, icon }) => (
          <div key={label} className="rounded-2xl p-3 text-center" style={{ background: bg }}>
            <div className="text-lg mb-0.5">{icon}</div>
            <div className="font-black text-xl" style={{ color }}>{value}</div>
            <div className="text-xs font-bold" style={{ color }}>{label}</div>
          </div>
        ))}
      </div>

      {/* ── Category pills ── */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {cats.map(cat => {
          const active = filter === cat
          const cfg    = CAT_CFG[cat]
          return (
            <button key={cat} onClick={() => setFilter(cat)}
              className="px-4 py-2 rounded-full text-xs font-black whitespace-nowrap flex-shrink-0 transition-all"
              style={active
                ? { background: cfg?.gradient || '#6B46F0', color: '#FFF', boxShadow: `0 2px 8px ${cfg?.shadow || 'rgba(124,92,252,0.3)'}` }
                : { background: '#FFF', color: '#9CA3AF', border: '1.5px solid #E5E7EB' }}>
              {cat === 'all' ? '✨ الكل' : `${cfg?.icon} ${CAT_LABELS[cat]}`}
            </button>
          )
        })}
      </div>

      {/* ── Exercise grid ── */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">🔍</div>
          <p>لا توجد تمارين في هذه الفئة</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 pb-4">
          {filtered.map(ex => {
            const done   = completed.has(ex.id)
            const cfg    = CAT_CFG[ex.category] || DEFAULT_CFG
            const { kind } = detectInteractive(ex)
            const hasGame = kind !== null
            return (
              <button key={ex.id} onClick={() => !done && openExercise(ex)} disabled={done}
                className="relative rounded-3xl overflow-hidden text-right transition-all duration-200 active:scale-95"
                style={{ boxShadow: done ? 'none' : `0 6px 20px ${cfg.shadow}`, opacity: done ? 0.75 : 1,
                  border: done ? '2px solid #D1FAE5' : 'none' }}>
                <div className="p-4 h-48 flex flex-col justify-between"
                  style={{ background: done ? '#F0FFF4' : cfg.gradient }}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(255,255,255,0.25)', color: done ? '#065F46' : '#FFF' }}>
                      {CAT_LABELS[ex.category]}
                    </span>
                    <span style={{ fontSize: 36, lineHeight: 1 }}>{done ? '✅' : cfg.icon}</span>
                  </div>

                  <div>
                    {/* Game badge */}
                    {hasGame && !done && (
                      <div className="flex items-center gap-1 mb-1.5">
                        <Zap style={{ width: 10, height: 10, color: 'rgba(255,255,255,0.9)' }} />
                        <span className="text-[10px] font-black" style={{ color: 'rgba(255,255,255,0.9)' }}>
                          تفاعلي
                        </span>
                      </div>
                    )}
                    <p className="font-black text-sm leading-snug line-clamp-2 mb-1.5"
                      style={{ color: done ? '#065F46' : '#FFF' }}>
                      {ex.titleAr}
                    </p>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold flex items-center gap-0.5"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        <Clock style={{ width: 10, height: 10 }} /> {ex.durationMinutes}د
                      </span>
                      <span className="text-xs font-bold"
                        style={{ color: done ? '#6EE7B7' : 'rgba(255,255,255,0.8)' }}>
                        ⭐ {ex.points}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* ══════════════════════════════════════════
          EXERCISE MODAL
      ══════════════════════════════════════════ */}
      {selected && phase !== 'grid' && (() => {
        const cfg     = CAT_CFG[selected.category] || DEFAULT_CFG
        const steps   = selected.instructionsAr || selected.instructions || []
        const equip   = (selected.equipment || []).filter(e => e && e !== 'none')
        const { kind, physId } = detectInteractive(selected)
        const diff    = DIFF_MAP[selected.difficulty] || 1
        const age     = AGE_MAP[child?.ageGroup || '5-11'] || 8
        const isGame  = kind !== null

        return (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) closeAll() }}>

            {/* ─── PRESTART SHEET ─── */}
            {phase === 'prestart' && (
              <div className="w-full sm:max-w-md flex flex-col overflow-hidden"
                style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '95vh' }}>

                {/* Gradient hero */}
                <div className="px-5 pt-6 pb-5 flex-shrink-0 relative" style={{ background: cfg.gradient }}>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-7xl leading-none drop-shadow-lg">{cfg.icon}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setShowInfo(v => !v)}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.22)' }}>
                        <Info className="w-4 h-4 text-white" />
                      </button>
                      <button onClick={closeAll}
                        className="w-10 h-10 rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(255,255,255,0.22)' }}>
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  </div>
                  <h2 className="text-white font-black text-2xl leading-snug mb-1">{selected.titleAr}</h2>
                  <div className="flex items-center gap-4 text-white/80 text-xs font-bold">
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{selected.durationMinutes} دقيقة</span>
                    <span>⭐ {selected.points} نقطة</span>
                    {isGame && (
                      <span className="flex items-center gap-1 font-black text-yellow-200">
                        <Zap className="w-3 h-3" /> ألعاب تفاعلية
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Parent info toggle */}
                  {showInfo && (
                    <div className="rounded-2xl p-4" style={{ background: '#F3EEFF', border: '1px solid #E8DBFF' }}>
                      <p className="text-xs font-black mb-1" style={{ color: '#5A32D9' }}>🔬 الهدف العلمي (للأهل)</p>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        {selected.psychologyObjectiveAr || selected.psychologyObjective}
                      </p>
                    </div>
                  )}

                  {/* What to expect card */}
                  <div className="rounded-3xl p-5 text-center"
                    style={{ background: cfg.light, border: `2px solid ${cfg.shadow.replace('0.30','0.12')}` }}>
                    <div style={{ fontSize: 68, lineHeight: 1, marginBottom: 10 }}>
                      {kind === 'breathing' ? '🌬️' :
                       kind === 'simon-says' ? '🎮' :
                       kind === 'target-tracking' ? '🌟' :
                       kind === 'balloon-control' ? '🎈' :
                       kind === 'reaction-game' ? '⚡' :
                       kind === 'stop-signal' ? '🛑' :
                       kind === 'body-scan' ? '🧘' :
                       cfg.icon}
                    </div>
                    {isGame ? (
                      <>
                        <p className="font-black text-gray-800 text-base mb-1">
                          {kind === 'breathing' && 'تمرين تنفس تفاعلي'}
                          {kind === 'simon-says' && 'لعبة التسلسل اللوني'}
                          {kind === 'target-tracking' && 'لعبة تتبع الهدف المتحرك'}
                          {kind === 'balloon-control' && 'لعبة التحكم في البالون'}
                          {kind === 'reaction-game' && 'لعبة رد الفعل'}
                          {kind === 'stop-signal' && 'لعبة توقف أو اكمل'}
                          {kind === 'body-scan' && 'فحص عضلات الجسم'}
                          {kind === 'physical' && 'تمرين جسدي موجّه'}
                        </p>
                        <p className="text-sm text-gray-500 leading-relaxed">
                          {kind === 'breathing' && 'حلقة تنفس حية — استنشق، احبس، أخرج — مع عداد مرئي'}
                          {kind === 'simon-says' && 'شاهد تسلسل الألوان ثم كرّره بنفس الترتيب'}
                          {kind === 'target-tracking' && 'اضغط النجمة 🌟 المتحركة ولا تضغط الدوائر الحمراء 🔴'}
                          {kind === 'balloon-control' && 'البالون يكبر ببطء — اضغط عند المنطقة الخضراء!'}
                          {kind === 'reaction-game' && 'اضغط الهدف الأخضر فور ظهوره — قِس سرعتك!'}
                          {kind === 'stop-signal' && 'أخضر = اضغط بسرعة • أحمر = لا تضغط! تحدٍّ للتحكم'}
                          {kind === 'body-scan' && 'شدّ وأرخِ كل عضلة واحدة بعد الأخرى مع مؤقت تلقائي'}
                          {kind === 'physical' && (selected.descriptionAr?.split(/[—–]/)[0].trim() || selected.titleAr)}
                        </p>
                      </>
                    ) : (
                      <p className="font-bold text-gray-700 text-sm leading-relaxed">
                        {selected.descriptionAr?.split(/[—–]/)[0].trim() || selected.titleAr}
                      </p>
                    )}
                  </div>

                  {/* Equipment */}
                  {equip.length > 0 && (
                    <div className="rounded-2xl p-4" style={{ background: '#FFFBEB', border: '1px solid #FDE68A' }}>
                      <p className="text-xs font-black text-amber-700 mb-3">📦 ستحتاج إلى:</p>
                      <div className="flex flex-wrap gap-2">
                        {equip.map((eq, i) => (
                          <span key={i} className="flex items-center gap-1 text-sm font-bold px-3 py-1.5 rounded-xl"
                            style={{ background: '#FEF3C7', color: '#92400E' }}>
                            {equipEmoji(eq)} {eq}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Steps preview (guided) or game preview */}
                  {isGame ? (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #E5E7EB' }}>
                      <div className="px-4 py-3 flex items-center gap-2" style={{ background: cfg.light }}>
                        <Zap className="w-4 h-4 text-violet-500" />
                        <p className="text-xs font-black text-gray-700">كيف تعمل اللعبة</p>
                      </div>
                      <div className="px-4 py-3 text-sm text-gray-600 leading-relaxed">
                        {kind === 'breathing' && '🌬️ اختر نمط التنفس ثم اتبع الحلقة المتحركة — استنشق مع توسعها، وأخرج مع انكماشها'}
                        {kind === 'simon-says' && '🔴🔵🟢🟡 يومض التسلسل — شاهد جيداً ثم كرّره باللمس بنفس الترتيب'}
                        {kind === 'target-tracking' && '🌟 النجمة تتحرك بسرعة — الملسها! الدوائر الحمراء 🔴 خسارة نقطة'}
                        {kind === 'balloon-control' && '🎈 البالون يكبر تدريجياً — اضغط "الآن!" في المنطقة الخضراء فقط — قبلها = اندفاع!'}
                        {kind === 'reaction-game' && '⚡ انتظر النجمة الخضراء تظهر فجأة... اضغطها فوراً! لا تضغط قبل ظهورها'}
                        {kind === 'stop-signal' && '🛑 دائرة خضراء = اضغط | دائرة حمراء = اثبت لا تتحرك! تحدٍّ 24 محاولة'}
                        {kind === 'body-scan' && '🧘 5 مناطق في الجسم — شدّ كل منطقة 4 ثوانٍ ثم أرخِها — مؤقت تلقائي'}
                        {kind === 'physical' && '▶️ اضغط ابدأ وتابع الخطوات مع المؤقت — المنبّه ينتقل تلقائياً'}
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid #F0E8FF' }}>
                      <div className="px-4 py-2.5" style={{ background: '#F3EEFF' }}>
                        <p className="text-xs font-black" style={{ color: '#5A32D9' }}>📋 الخطوات ({steps.length})</p>
                      </div>
                      {steps.slice(0, 4).map((s, i) => (
                        <div key={i} className="flex items-center gap-3 px-4 py-3"
                          style={{ borderTop: i > 0 ? '1px solid #F0E8FF' : 'none' }}>
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0"
                            style={{ background: '#7C5CFC', color: '#FFF' }}>{i + 1}</div>
                          <p className="text-sm text-gray-700 font-bold line-clamp-1">{keyTitle(s)}</p>
                        </div>
                      ))}
                      {steps.length > 4 && (
                        <div className="px-4 py-3 text-center text-xs text-gray-400 font-bold"
                          style={{ borderTop: '1px solid #F0E8FF' }}>
                          + {steps.length - 4} خطوات أخرى
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="p-4 flex-shrink-0" style={{ borderTop: '1px solid #F0E8FF' }}>
                  <button onClick={startExercise}
                    className="w-full text-white font-black py-4 rounded-2xl text-xl flex items-center justify-center gap-3 transition-all active:scale-95"
                    style={{ background: cfg.gradient, boxShadow: `0 6px 18px ${cfg.shadow}` }}>
                    <Play className="w-6 h-6 fill-white" />
                    {isGame ? '🎮 ابدأ اللعبة!' : '🚀 ابدأ!'}
                  </button>
                </div>
              </div>
            )}

            {/* ─── GAME MODE: Interactive component ─── */}
            {phase === 'game' && isGame && (
              <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl flex flex-col"
                style={{ background: `linear-gradient(160deg, ${cfg.dark}, #0f172a)`,
                  height: '92vh', maxHeight: 680, overflowY: 'auto' }}>
                {/* Dark header */}
                <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
                  <button onClick={handleCancel}
                    className="flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    ← رجوع
                  </button>
                  <h3 className="text-white font-black text-sm">{selected.titleAr}</h3>
                  <div className="text-white/50 text-xs font-bold">{fmt(sessionSec)}</div>
                </div>

                {/* Component */}
                {kind === 'breathing' && (
                  <BreathingGuide onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'simon-says' && (
                  <SimonSays onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'target-tracking' && (
                  <TargetTracking onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'balloon-control' && (
                  <BalloonControl onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'reaction-game' && (
                  <ReactionGame onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'stop-signal' && (
                  <StopSignal onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'body-scan' && (
                  <BodyScan onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
                {kind === 'physical' && physId && (
                  <PhysicalExercise id={physId} onComplete={handleComplete} onCancel={handleCancel} studentAge={age} difficulty={diff} />
                )}
              </div>
            )}

            {/* ─── GAME MODE: Guided steps ─── */}
            {phase === 'game' && !isGame && (() => {
              // ── Special exercise detection ──
              const isGrounding = selected.title.toLowerCase().includes('grounding')
              const isZoneCheck = selected.title.toLowerCase().includes('zone of regulation')
              const isAnimal    = selected.title.toLowerCase().includes('animal walk')

              // Grounding exercise data
              const GROUND_SENSES = [
                { count: 5, icon: '👁️', color: '#7C5CFC', label: 'أشياء تراها',  hint: 'انظر حولك وسمِّها بصوت عالٍ' },
                { count: 4, icon: '🤚', color: '#2ABFA3', label: 'أشياء تلمسها', hint: 'الملسها واحدة تلو الأخرى' },
                { count: 3, icon: '👂', color: '#FFBA44', label: 'أشياء تسمعها', hint: 'استمع جيداً للأصوات من حولك' },
                { count: 2, icon: '👃', color: '#EC4899', label: 'أشياء تشمهما', hint: 'خذ أنفاساً عميقة وركّز على الرائحة' },
                { count: 1, icon: '👅', color: '#10B981', label: 'شيء تتذوقه',   hint: 'ما الطعم الموجود في فمك الآن؟' },
                { count: 3, icon: '💨', color: '#5A32D9', label: 'أنفاس هادئة',  hint: 'استنشق ببطء... ثم أخرج ببطء' },
              ]
              const curSense = GROUND_SENSES[Math.min(step, GROUND_SENSES.length - 1)]

              // Zone of Regulation data
              const ZONES = [
                { color: '#3B82F6', label: 'المنطقة الزرقاء', emoji: '😴', desc: 'بطيء، متعب، حزين', tools: ['القفز', 'الموسيقى الصاخبة', 'ماء بارد'] },
                { color: '#22C55E', label: 'المنطقة الخضراء', emoji: '😊', desc: 'مستعد، سعيد، هادئ', tools: ['ابدأ النشاط مباشرة!'] },
                { color: '#EAB308', label: 'المنطقة الصفراء', emoji: '😤', desc: 'متوتر، مثار، قلق',  tools: ['التنفس العميق', 'التمدد', 'مضغ'] },
                { color: '#EF4444', label: 'المنطقة الحمراء', emoji: '😡', desc: 'خارج السيطرة، غاضب', tools: ['مكان هادئ', 'ضغط عميق', 'كرة ضغط'] },
              ]
              return (
              <div className="w-full sm:max-w-md flex flex-col overflow-hidden"
                style={{ background: '#FFF', borderRadius: '1.75rem 1.75rem 0 0', maxHeight: '95vh' }}>

                {/* Header strip */}
                <div className="px-5 pt-4 pb-4 flex-shrink-0 flex items-center gap-3"
                  style={{ background: cfg.gradient }}>
                  <button onClick={() => { sfx.back(); handleCancel() }}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: 'rgba(255,255,255,0.22)' }}>
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-black text-base truncate">{selected.titleAr}</h3>
                    <p className="text-white/70 text-xs font-bold">
                      {fmt(sessionSec)} •{' '}
                      {isGrounding ? `الحاسة ${step + 1} من ${GROUND_SENSES.length}` : `خطوة ${step + 1} من ${steps.length}`}
                    </p>
                  </div>
                  <div className="font-black text-white/90 text-sm">
                    {Math.round(((step + 1) / (isGrounding ? GROUND_SENSES.length : steps.length)) * 100)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div className="h-2 flex-shrink-0" style={{ background: '#F1F5F9' }}>
                  <div className="h-full transition-all duration-500"
                    style={{
                      width: `${((step + 1) / (isGrounding ? GROUND_SENSES.length : steps.length)) * 100}%`,
                      background: cfg.gradient
                    }} />
                </div>

                {/* ══ GROUNDING 5-4-3-2-1 INTERACTIVE MODE ══ */}
                {isGrounding ? (
                  <div className="flex-1 overflow-y-auto flex flex-col items-center text-center px-6 py-6 gap-4">

                    {/* Sense dots */}
                    <div className="flex gap-2">
                      {GROUND_SENSES.map((s, i) => (
                        <div key={i} className="w-3 h-3 rounded-full transition-all duration-300"
                          style={{ background: i < step ? '#4ADE80' : i === step ? s.color : '#E5E7EB',
                            transform: i === step ? 'scale(1.4)' : 'scale(1)' }} />
                      ))}
                    </div>

                    {/* Big sense icon */}
                    <div key={step} style={{ fontSize: 96, lineHeight: 1,
                      animation: 'popIn 0.4s cubic-bezier(.34,1.56,.64,1)',
                      filter: `drop-shadow(0 6px 20px ${curSense.color}50)` }}>
                      {curSense.icon}
                    </div>

                    {/* Count + label */}
                    <div>
                      <div className="font-black leading-none mb-1" style={{ fontSize: 52, color: curSense.color }}>
                        {curSense.count}
                      </div>
                      <p className="font-black text-xl text-gray-800">{curSense.label}</p>
                      <p className="text-sm text-gray-400 mt-1">{curSense.hint}</p>
                    </div>

                    {/* Tap bubbles */}
                    <div className="flex gap-3 flex-wrap justify-center">
                      {Array.from({ length: curSense.count }).map((_, i) => (
                        <button key={i}
                          onClick={() => {
                            if (groundTaps <= i) {
                              sfx.tap()
                              const newTaps = groundTaps + 1
                              setGroundTaps(newTaps)
                              speakAr(String(newTaps))
                              if (newTaps >= curSense.count) {
                                setTimeout(() => {
                                  sfx.done()
                                  if (step >= GROUND_SENSES.length - 1) { handleComplete() }
                                  else { setStep(s => s + 1); setGroundTaps(0); speakAr(GROUND_SENSES[step + 1].label) }
                                }, 700)
                              }
                            }
                          }}
                          className="w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-black transition-all duration-200 active:scale-90"
                          style={{
                            background: groundTaps > i ? curSense.color : '#F3F4F6',
                            color: groundTaps > i ? '#FFF' : '#CBD5E1',
                            boxShadow: groundTaps > i ? `0 4px 16px ${curSense.color}50` : 'none',
                            transform: groundTaps > i ? 'scale(1.08)' : 'scale(1)',
                          }}>
                          {groundTaps > i ? '✓' : i + 1}
                        </button>
                      ))}
                    </div>

                    <p className="text-sm font-bold" style={{ color: curSense.color }}>
                      {groundTaps < curSense.count
                        ? `اضغط ${curSense.count - groundTaps} ${curSense.count - groundTaps === 1 ? 'مرة' : 'مرات'} بعد`
                        : '✨ رائع! الانتقال للحاسة التالية...'}
                    </p>

                    {/* Parent note */}
                    <div className="w-full rounded-2xl p-3 text-right"
                      style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', maxWidth: 320 }}>
                      <p className="text-xs font-black mb-1 text-gray-400">💡 للأهل</p>
                      <p className="text-xs text-gray-400">{steps[Math.min(step, steps.length - 1)]}</p>
                    </div>
                  </div>

                ) : isZoneCheck ? (
                /* ══ ZONE OF REGULATION MODE ══ */
                  <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                    <p className="text-center font-black text-gray-700 text-base">كيف تشعر الآن؟</p>
                    <div className="grid grid-cols-2 gap-3">
                      {ZONES.map((z, i) => (
                        <button key={i} onClick={() => { sfx.tap(); setZoneSelected(i); speakAr(z.label) }}
                          className="rounded-2xl p-4 text-center transition-all active:scale-95"
                          style={{
                            background: zoneSelected === i ? z.color : z.color + '18',
                            border: `2px solid ${z.color}${zoneSelected === i ? '' : '40'}`,
                            transform: zoneSelected === i ? 'scale(1.04)' : 'scale(1)',
                          }}>
                          <div className="text-4xl mb-2">{z.emoji}</div>
                          <p className="font-black text-sm" style={{ color: zoneSelected === i ? '#FFF' : z.color }}>{z.label}</p>
                          <p className="text-xs mt-1" style={{ color: zoneSelected === i ? 'rgba(255,255,255,0.8)' : '#6B7280' }}>{z.desc}</p>
                        </button>
                      ))}
                    </div>

                    {zoneSelected !== null && (
                      <div className="rounded-2xl p-4" style={{ background: ZONES[zoneSelected].color + '15', border: `1.5px solid ${ZONES[zoneSelected].color}40` }}>
                        <p className="text-xs font-black mb-2" style={{ color: ZONES[zoneSelected].color }}>🛠 أدوات مقترحة</p>
                        <div className="flex flex-wrap gap-2">
                          {ZONES[zoneSelected].tools.map((t, i) => (
                            <span key={i} className="text-sm font-bold px-3 py-1.5 rounded-xl text-white"
                              style={{ background: ZONES[zoneSelected].color }}>{t}</span>
                          ))}
                        </div>
                        <button onClick={() => handleComplete()}
                          className="mt-4 w-full font-black py-3 rounded-2xl text-white transition-all active:scale-95"
                          style={{ background: ZONES[zoneSelected].color }}>
                          <CheckCircle className="w-4 h-4 inline ml-1" /> سجّلت حالتي ✓
                        </button>
                      </div>
                    )}
                  </div>

                ) : (
                /* ══ STANDARD GUIDED STEPS ══ */
                  <div className="flex-1 overflow-y-auto flex flex-col items-center text-center px-6 py-8 gap-5">
                    {/* SVG illustration OR animal emoji OR category emoji */}
                    {(() => {
                      const illustColor = cfg.gradient.match(/#[0-9A-Fa-f]{6}/)?.[0] || '#7C5CFC'
                      const svgIllust = !isAnimal ? StepIllustration({ text: steps[step], color: illustColor }) : null
                      if (svgIllust) return (
                        <div key={step} style={{
                          animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                          filter: `drop-shadow(0 8px 24px ${illustColor}55)`,
                          background: illustColor + '12',
                          borderRadius: 24, padding: '16px 24px',
                        }}>
                          {svgIllust}
                        </div>
                      )
                      return (
                        <div key={step} style={{ fontSize: 110, lineHeight: 1,
                          animation: 'popIn 0.35s cubic-bezier(.34,1.56,.64,1)',
                          filter: 'drop-shadow(0 8px 20px rgba(0,0,0,0.12))' }}>
                          {isAnimal
                            ? (steps[step].includes('دب') ? '🐻' : steps[step].includes('ضفدع') ? '🐸'
                              : steps[step].includes('أفعى') ? '🐍' : steps[step].includes('حصان') ? '🐴' : '🐾')
                            : stepEmoji(steps[step], selected.category)}
                        </div>
                      )
                    })()}

                    {/* Count badge */}
                    {extractCount(steps[step]) && (
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center font-black text-3xl text-white -mt-2 -mb-2"
                        style={{ background: cfg.gradient }}>
                        {extractCount(steps[step])}
                      </div>
                    )}

                    {/* Key action title */}
                    <p className="font-black leading-tight" style={{ fontSize: 26, color: '#1e293b', maxWidth: 280 }}>
                      {keyTitle(steps[step])}
                    </p>

                    {/* Step timer */}
                    {stepTimer && extractTimer(steps[step]) ? (
                      <StepTimer seconds={extractTimer(steps[step])!}
                        onDone={() => { setStepTimer(false); speakAr('أحسنت!') }} />
                    ) : extractTimer(steps[step]) ? (
                      <button onClick={() => { sfx.tap(); setStepTimer(true) }}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-black text-sm transition-all active:scale-95"
                        style={{ background: cfg.light, color: '#5A32D9', border: '1.5px solid rgba(124,92,252,0.2)' }}>
                        ⏱ ابدأ العد {extractTimer(steps[step])} ثانية
                      </button>
                    ) : null}

                    {/* Speak button */}
                    <button onClick={() => { sfx.pop(); speakAr(steps[step]) }}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl font-bold text-sm transition-all active:scale-95"
                      style={{ background: '#F8FAFC', color: '#64748B', border: '1px solid #E2E8F0' }}>
                      <Volume2 className="w-4 h-4" /> اسمع مرة أخرى
                    </button>

                    {/* Parent guidance */}
                    <div className="w-full rounded-2xl p-4 text-right"
                      style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', maxWidth: 340 }}>
                      <p className="text-xs font-black mb-1" style={{ color: '#94A3B8' }}>💡 للأهل والمشرف</p>
                      <p className="text-sm text-gray-500 leading-relaxed">{steps[step]}</p>
                    </div>
                  </div>
                )}

                {/* Step dots (not shown for zone check) */}
                {!isZoneCheck && (
                  <div className="flex justify-center gap-1.5 py-3 flex-shrink-0">
                    {(isGrounding ? GROUND_SENSES : steps).map((_, i) => (
                      <div key={i} className="rounded-full transition-all duration-300"
                        style={{ width: i === step ? 24 : 8, height: 8,
                          background: i === step ? (isGrounding ? curSense.color : '#7C5CFC') : i < step ? '#4ADE80' : '#E5E7EB' }} />
                    ))}
                  </div>
                )}

                {/* Bottom nav — hidden for grounding (tap-driven) and zone check */}
                {!isGrounding && !isZoneCheck && (
                <div className="p-4 flex-shrink-0 flex gap-3" style={{ borderTop: '1px solid #F0E8FF' }}>
                  <button onClick={() => { sfx.back(); setStep(s => Math.max(0, s - 1)); setStepTimer(false) }}
                    disabled={step === 0}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                    style={{ background: '#F3F4F6' }}>
                    ›
                  </button>

                  {step < steps.length - 1 ? (
                    <button onClick={() => { sfx.step(); setStep(s => s + 1); setStepTimer(false) }}
                      className="flex-1 text-white font-black py-3 rounded-2xl text-lg transition-all active:scale-95"
                      style={{ background: cfg.gradient, boxShadow: `0 4px 14px ${cfg.shadow}` }}>
                      التالي ←
                    </button>
                  ) : (
                    <button onClick={() => handleComplete()}
                      className="flex-1 text-white font-black py-3 rounded-2xl text-lg flex items-center justify-center gap-2 transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)', boxShadow: '0 4px 14px rgba(16,185,129,0.35)' }}>
                      <CheckCircle className="w-5 h-5" /> انتهيت! 🎉
                    </button>
                  )}

                  <button onClick={() => { sfx.step(); setStep(s => Math.min(steps.length - 1, s + 1)); setStepTimer(false) }}
                    disabled={step === steps.length - 1}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center disabled:opacity-25 transition-all active:scale-95"
                    style={{ background: '#F3F4F6' }}>
                    ‹
                  </button>
                </div>
                )}
              </div>
              )
            })()}

            {/* ─── COMPLETE SCREEN ─── */}
            {phase === 'complete' && result && (
              <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl overflow-hidden"
                style={{ background: 'linear-gradient(160deg,#1e1b4b,#312e81,#0f172a)', maxHeight: '95vh' }}>
                <div className="flex flex-col items-center text-center px-6 py-10 gap-5">
                  {/* Trophy */}
                  <div style={{ fontSize: 90, animation: 'popIn 0.5s cubic-bezier(.34,1.56,.64,1)' }}>🏆</div>

                  <div>
                    <h2 className="text-white font-black text-3xl mb-1">أحسنت!</h2>
                    <p className="text-white/60 text-sm">{selected.titleAr}</p>
                  </div>

                  {/* Score cards */}
                  <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-yellow-400">{result.score}</div>
                      <div className="text-white/40 text-xs mt-0.5">نتيجة</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-emerald-400">{selected.points}</div>
                      <div className="text-white/40 text-xs mt-0.5">نقاط ⭐</div>
                    </div>
                    <div className="rounded-2xl p-3" style={{ background: 'rgba(255,255,255,0.08)' }}>
                      <div className="text-2xl font-black text-cyan-400">{fmt(result.duration)}</div>
                      <div className="text-white/40 text-xs mt-0.5">وقت</div>
                    </div>
                  </div>

                  {/* Total points banner */}
                  <div className="w-full max-w-xs rounded-2xl p-4 text-center"
                    style={{ background: 'linear-gradient(135deg,#7C5CFC,#5A32D9)' }}>
                    <div className="text-xs text-white/70 font-bold mb-1">مجموع نقاطك</div>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-2">
                      <Trophy className="w-6 h-6 text-yellow-300" />
                      {totalPts + selected.points}
                    </div>
                  </div>

                  <div className="flex gap-3 w-full max-w-xs">
                    <button onClick={closeAll}
                      className="flex-1 font-black py-3.5 rounded-2xl text-base transition-all active:scale-95"
                      style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)' }}>
                      رجوع
                    </button>
                    <button onClick={() => {
                        const next = filtered.find(e => !completed.has(e.id) && e.id !== selected.id)
                        if (next) openExercise(next)
                        else closeAll()
                      }}
                      className="flex-1 font-black py-3.5 rounded-2xl text-base text-white transition-all active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#10B981,#059669)' }}>
                      التمرين التالي ←
                    </button>
                  </div>
                </div>
              </div>
            )}

          </div>
        )
      })()}

      <style jsx global>{`
        @keyframes popIn {
          0%   { transform: scale(0.4); opacity: 0 }
          70%  { transform: scale(1.12) }
          100% { transform: scale(1);   opacity: 1 }
        }
        @keyframes spin { to { transform: rotate(360deg) } }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  )
}
