'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { Play, Pause, ChevronLeft, ChevronRight, Star, Zap, CheckCircle } from 'lucide-react'
import AcademyLogo from '@/components/shared/AcademyLogo'

const SLIDE_DURATION = 5500

// ─── Ambient music ─────────────────────────────────────────────────────────────
function createAmbientMusic(ctx: AudioContext): () => void {
  const master = ctx.createGain()
  master.gain.setValueAtTime(0, ctx.currentTime)
  master.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 3)
  master.connect(ctx.destination)
  const bass = ctx.createOscillator()
  bass.type = 'sine'; bass.frequency.value = 110
  const bassG = ctx.createGain(); bassG.gain.value = 0.35
  bass.connect(bassG); bassG.connect(master); bass.start()
  const padFreqs = [220, 261.63, 329.63, 392]
  const padOscs = padFreqs.map(f => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f
    const g = ctx.createGain(); g.gain.value = 0.045
    o.connect(g); g.connect(master); o.start(); return o
  })
  const arp = [523.25, 659.26, 783.99, 880, 783.99, 659.26]
  let ni = 0
  const t = setInterval(() => {
    const now = ctx.currentTime
    const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = arp[ni++ % arp.length]
    const g = ctx.createGain()
    g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(0.06, now + 0.08); g.gain.exponentialRampToValueAtTime(0.001, now + 2.2)
    o.connect(g); g.connect(master); o.start(now); o.stop(now + 2.5)
  }, 2000)
  return () => {
    clearInterval(t)
    const now = ctx.currentTime
    master.gain.setValueAtTime(master.gain.value, now)
    master.gain.linearRampToValueAtTime(0, now + 1.5)
    setTimeout(() => { try { bass.stop(); padOscs.forEach(o => o.stop()) } catch (_) {} }, 2000)
  }
}

// ─── Browser frame ──────────────────────────────────────────────────────────────
function Frame({ url, color, children }: { url: string; color: string; children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: 16, overflow: 'hidden', border: '1.5px solid rgba(124,92,252,0.13)', boxShadow: `0 24px 60px rgba(0,0,0,0.13), 0 0 0 1px rgba(124,92,252,0.06), 0 0 70px ${color}14` }}>
      <div style={{ background: '#EDECF2', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid rgba(0,0,0,0.06)' }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {['#FF5F57', '#FEBC2E', '#28C840'].map(c => <div key={c} style={{ width: 12, height: 12, borderRadius: '50%', background: c }} />)}
        </div>
        <div style={{ flex: 1, background: 'white', borderRadius: 8, padding: '4px 12px', fontSize: 10, fontFamily: 'monospace', color: '#9CA3AF', textAlign: 'center', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', border: '1px solid rgba(0,0,0,0.07)' }}>
          🔒 {url}
        </div>
      </div>
      <div style={{ maxHeight: '52vh', overflow: 'hidden' }}>{children}</div>
    </div>
  )
}

// ─── Hero visual ─────────────────────────────────────────────────────────────────
function HeroVisual() {
  const pillars = [
    { label: 'APA', sub: 'رياضة معدّلة', emoji: '🏃', color: '#6B46F0', angle: -60 },
    { label: 'ABA', sub: 'تعديل سلوك', emoji: '🎯', color: '#0891B2', angle: 60 },
    { label: 'CBT', sub: 'تدريب معرفي', emoji: '🧠', color: '#16A34A', angle: 180 },
  ]
  return (
    <div style={{ position: 'relative', width: 260, height: 260, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle,rgba(124,92,252,0.12) 0%,transparent 70%)' }} />
      <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', border: '1.5px solid rgba(124,92,252,0.18)', animation: 'dspin 24s linear infinite' }} />
      <div style={{ position: 'absolute', width: 245, height: 245, borderRadius: '50%', border: '1px dashed rgba(124,92,252,0.09)', animation: 'dspin 36s linear infinite reverse' }} />
      {pillars.map(({ label, sub, emoji, color, angle }) => {
        const r = 110
        const rad = (angle - 90) * Math.PI / 180
        return (
          <div key={label} style={{ position: 'absolute', left: '50%', top: '50%', marginLeft: Math.cos(rad) * r - 36, marginTop: Math.sin(rad) * r - 28, animation: `dfloat ${3 + Math.abs(angle) * 0.003}s ease-in-out ${angle * 0.005}s infinite` }}>
            <div style={{ background: 'white', border: `1.5px solid ${color}30`, borderRadius: 14, padding: '6px 10px', textAlign: 'center', boxShadow: `0 4px 16px ${color}20`, minWidth: 72 }}>
              <div style={{ fontSize: 18 }}>{emoji}</div>
              <div style={{ fontSize: 9, fontWeight: 900, color, marginTop: 2 }}>{label}</div>
              <div style={{ fontSize: 8, color: '#9CA3AF', marginTop: 1, whiteSpace: 'nowrap' }}>{sub}</div>
            </div>
          </div>
        )
      })}
      <div style={{ animation: 'dfloat 4.5s ease-in-out infinite', position: 'relative', zIndex: 2 }}>
        <AcademyLogo size={90} />
      </div>
    </div>
  )
}

// ─── Session mockup — real exercise UI ─────────────────────────────────────────
function SessionMockup() {
  const cards = ['🐶','🐱','🦋','🌟','🐶','🐱','🦋','🌟','🎯','🌈','🎯','🌈']
  const revealed = [0,4,1,5] // indices that are face-up (matched pairs)
  return (
    <div style={{ background: '#0F0F1A', fontFamily: 'inherit' }} dir="rtl">
      {/* Session header */}
      <div style={{ background: '#1A1A2E', borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 9, background: '#6B46F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AcademyLogo size={20} />
          </div>
          <div>
            <div style={{ color: 'white', fontSize: 10, fontWeight: 900 }}>جلسة أمير — الذاكرة والتركيز</div>
            <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: 8 }}>المرحلة ٢ من ٤ · التمرين ٣</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ background: '#7C3AED20', border: '1px solid #7C3AED50', borderRadius: 8, padding: '3px 8px' }}>
            <span style={{ color: '#A78BFA', fontSize: 9, fontWeight: 700 }}>🎯 متوسط</span>
          </div>
          <div style={{ background: '#DC262620', border: '1px solid #DC262650', borderRadius: 8, padding: '3px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#EF4444', animation: 'dpulse 1s ease-in-out infinite' }} />
            <span style={{ color: '#FCA5A5', fontSize: 9, fontWeight: 700, fontFamily: 'monospace' }}>08:45</span>
          </div>
        </div>
      </div>
      {/* Phase bar */}
      <div style={{ background: '#15152A', padding: '6px 14px', display: 'flex', gap: 4 }}>
        {['تمهيد','نشاط ✓','الذاكرة ←','تهدئة'].map((p, i) => (
          <div key={p} style={{ flex: 1, height: 4, borderRadius: 4, background: i < 2 ? '#6B46F0' : i === 2 ? '#A78BFA' : 'rgba(255,255,255,0.1)', position: 'relative' }}>
            {i === 2 && <div style={{ position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)', color: '#A78BFA', fontSize: 7, fontWeight: 700, whiteSpace: 'nowrap' }}>{p}</div>}
          </div>
        ))}
      </div>
      {/* Exercise area */}
      <div style={{ padding: '14px', textAlign: 'center' }}>
        <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 9, marginBottom: 8 }}>بطاقات الذاكرة — 6 أزواج · 3 مطابقات ✓</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, marginBottom: 10 }}>
          {cards.map((emoji, i) => {
            const matched = revealed.includes(i)
            const isFlipped = i === 8 // one currently flipped
            return (
              <div key={i} style={{
                aspectRatio: '1', borderRadius: 8,
                background: matched ? 'linear-gradient(135deg,#16A34A20,#16A34A10)' : isFlipped ? '#6B46F030' : '#1E1E3A',
                border: matched ? '1.5px solid #16A34A50' : isFlipped ? '1.5px solid #6B46F080' : '1px solid rgba(255,255,255,0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13,
                boxShadow: matched ? '0 0 8px #16A34A30' : 'none',
              }}>
                {matched || isFlipped ? emoji : <span style={{ color: 'rgba(255,255,255,0.15)', fontSize: 10 }}>؟</span>}
              </div>
            )
          })}
        </div>
        {/* Score row */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
          {[{l:'المطابقات',v:'3/6',c:'#16A34A'},{l:'الدقة',v:'75%',c:'#6B46F0'},{l:'النقاط',c:'#F59E0B',v:'🌟 150'}].map(({l,v,c})=>(
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ color: c, fontSize: 12, fontWeight: 900 }}>{v}</div>
              <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 8 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Specialist toolbar */}
      <div style={{ background: '#1A1A2E', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 6 }}>
        {['🎙','📺','🖥','🎵','🖊','⚡'].map(icon => (
          <div key={icon} style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{icon}</div>
        ))}
        <div style={{ flex: 1 }} />
        <div style={{ background: 'rgba(124,92,252,0.15)', border: '1px solid rgba(124,92,252,0.3)', borderRadius: 8, padding: '4px 10px', color: '#A78BFA', fontSize: 9, fontWeight: 700 }}>
          ذكاء الجلسة: الطفل متركّز ✓
        </div>
      </div>
    </div>
  )
}

// ─── Exercises library mockup ───────────────────────────────────────────────────
function ExercisesMockup() {
  const categories = [
    { key: 'all', label: 'الكل', active: true },
    { key: 'focus', label: '🎯 التركيز' },
    { key: 'memory', label: '🧠 الذاكرة' },
    { key: 'emotion', label: '💛 المشاعر' },
    { key: 'apa', label: '🏃 APA' },
  ]
  const exercises = [
    { name: 'بطاقات الذاكرة', cat: 'ذاكرة', emoji: '🃏', color: '#7C5CFC', bg: '#F3EEFF' },
    { name: 'ضرب النجمة', cat: 'تركيز', emoji: '⭐', color: '#F59E0B', bg: '#FFFBEB' },
    { name: 'بطاقات المشاعر', cat: 'اجتماعي', emoji: '😊', color: '#EC4899', bg: '#FDF2F8' },
    { name: 'دليل التنفس', cat: 'استرخاء', emoji: '🌬', color: '#06B6D4', bg: '#ECFEFF' },
    { name: 'سيمون يقول', cat: 'APA', emoji: '🟢', color: '#16A34A', bg: '#F0FDF4' },
    { name: 'تسلسل الأصوات', cat: 'سمعي', emoji: '🔊', color: '#8B5CF6', bg: '#F5F3FF' },
    { name: 'النطق والتهجئة', cat: 'لغة', emoji: '✏️', color: '#0891B2', bg: '#ECFEFF' },
    { name: 'مرآة المشاعر', cat: 'اجتماعي', emoji: '🪞', color: '#E11D48', bg: '#FFF1F2' },
  ]
  return (
    <div style={{ background: 'white', fontFamily: 'inherit' }} dir="rtl">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#6B46F0,#4F46E5)', padding: '12px 14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AcademyLogo size={24} />
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 11 }}>مكتبة التمارين</div>
            <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 9 }}>67 تمريناً تفاعلياً — APA · ABA · CBT</div>
          </div>
        </div>
      </div>
      {/* Filter chips */}
      <div style={{ padding: '8px 12px', display: 'flex', gap: 5, overflowX: 'auto', borderBottom: '1px solid #F3F4F6' }}>
        {categories.map(c => (
          <span key={c.key} style={{ flexShrink: 0, padding: '3px 10px', borderRadius: 20, fontSize: 9, fontWeight: 700, background: c.active ? '#6B46F0' : '#F3F4F6', color: c.active ? 'white' : '#6B7280', border: c.active ? 'none' : '1px solid #E5E7EB' }}>
            {c.label}
          </span>
        ))}
      </div>
      {/* Exercise grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 6, padding: '10px 12px' }}>
        {exercises.map(ex => (
          <div key={ex.name} style={{ background: ex.bg, border: `1.5px solid ${ex.color}20`, borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: `${ex.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{ex.emoji}</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900, fontSize: 9, color: '#1F2937', marginBottom: 2 }}>{ex.name}</div>
              <span style={{ fontSize: 8, fontWeight: 700, color: ex.color, background: `${ex.color}15`, padding: '1px 6px', borderRadius: 10 }}>{ex.cat}</span>
            </div>
          </div>
        ))}
      </div>
      <div style={{ textAlign: 'center', padding: '4px 0 10px', color: '#6B46F0', fontSize: 9, fontWeight: 700 }}>
        + 59 تمريناً آخر ← عرض الكل
      </div>
    </div>
  )
}

// ─── Progress map mockup (Duolingo-style) ──────────────────────────────────────
function ProgressMapMockup() {
  const steps = [
    { label: 'التركيز الأساسي', stars: 3, done: true },
    { label: 'الذاكرة البصرية', stars: 3, done: true },
    { label: 'التسلسل السمعي', stars: 2, done: true },
    { label: 'بطاقات المشاعر', stars: 0, active: true },
    { label: 'كبح الاندفاع', stars: 0 },
    { label: 'التفكير المنطقي', stars: 0 },
  ]
  return (
    <div style={{ background: 'white', fontFamily: 'inherit' }} dir="rtl">
      {/* Header */}
      <div style={{ background: '#1A1A2E', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AcademyLogo size={22} />
          <span style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>خريطة تقدّم أمير</span>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {[{l:'النقاط',v:'1,240',e:'⭐'},{l:'الجلسات',v:'8',e:'📅'},{l:'الدقة',v:'76%',e:'🎯'}].map(({l,v,e}) => (
            <div key={l} style={{ textAlign: 'center' }}>
              <div style={{ color: 'white', fontSize: 11, fontWeight: 900 }}>{e} {v}</div>
              <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 7 }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Map */}
      <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10, background: 'linear-gradient(180deg,#F8F5FF,white)' }}>
        {steps.map((s, i) => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 10, flexDirection: i % 2 === 0 ? 'row' : 'row-reverse' }}>
            {/* Node */}
            <div style={{
              width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
              background: s.done ? 'linear-gradient(135deg,#6B46F0,#9A7BFD)' : s.active ? 'linear-gradient(135deg,#F59E0B,#FBBF24)' : '#E5E7EB',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: s.done ? '0 6px 20px rgba(107,70,240,0.35)' : s.active ? '0 6px 20px rgba(245,158,11,0.4)' : 'none',
              border: s.active ? '3px solid #FBBF24' : 'none',
            }}>
              {s.done ? <span style={{ fontSize: 20 }}>✓</span> : s.active ? <span style={{ fontSize: 20 }}>▶</span> : <span style={{ fontSize: 18, opacity: 0.4 }}>🔒</span>}
            </div>
            {/* Stars + label */}
            <div>
              <div style={{ fontSize: 9, fontWeight: 900, color: s.done ? '#1F2937' : s.active ? '#B45309' : '#9CA3AF', marginBottom: 3 }}>{s.label}</div>
              <div style={{ display: 'flex', gap: 2 }}>
                {[0,1,2].map(n => (
                  <Star key={n} size={10} style={{ fill: n < s.stars ? '#F59E0B' : 'none', color: n < s.stars ? '#F59E0B' : '#D1D5DB' }} />
                ))}
              </div>
            </div>
            {/* Connector */}
            {i < steps.length - 1 && (
              <div style={{ position: 'absolute', left: i % 2 === 0 ? undefined : 20, right: i % 2 === 0 ? 20 : undefined }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Specialist dashboard mockup ────────────────────────────────────────────────
function SpecialistMockup() {
  const clients = [
    { name: 'أمير السعيد', age: '9 سنوات', diag: 'ADHD', status: 'جلسة اليوم 5م', statusColor: '#16A34A', avatar: '👦' },
    { name: 'ليلى المنصوري', age: '7 سنوات', diag: 'توحد', status: 'مكتملة ✓', statusColor: '#6B46F0', avatar: '👧' },
    { name: 'فارس النجار', age: '12 سنة', diag: 'عسر قراءة', status: 'غداً 3م', statusColor: '#F59E0B', avatar: '🧑' },
  ]
  return (
    <div style={{ background: 'white', fontFamily: 'inherit' }} dir="rtl">
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1px solid #F3F4F6', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AcademyLogo size={28} />
          <div>
            <div style={{ fontWeight: 900, fontSize: 11, color: '#1F2937' }}>أكاديمية أمين</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Zap size={8} style={{ color: '#6B46F0' }} />
              <span style={{ fontSize: 8, fontWeight: 900, color: '#6B46F0', textTransform: 'uppercase', letterSpacing: 1 }}>Admin Panel</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {[{l:'المشتركون',v:'24'},{l:'هذا الشهر',v:'12'},{l:'معدل التحسّن',v:'84%'}].map(({l,v}) => (
            <div key={l} style={{ textAlign: 'center', background: '#F8F5FF', borderRadius: 10, padding: '4px 8px' }}>
              <div style={{ fontWeight: 900, fontSize: 11, color: '#6B46F0' }}>{v}</div>
              <div style={{ fontSize: 7, color: '#9CA3AF' }}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      {/* Nav + content */}
      <div style={{ display: 'flex' }}>
        {/* Sidebar */}
        <div style={{ width: 100, borderLeft: '1px solid #F3F4F6', padding: '10px 6px', background: '#FAFAF9' }}>
          {[{e:'🏠',l:'الرئيسية'},{e:'👥',l:'المشتركون',a:true},{e:'📅',l:'المواعيد'},{e:'📋',l:'البرامج'},{e:'📊',l:'التقارير'}].map(({e,l,a})=>(
            <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 8px', borderRadius: 10, marginBottom: 2, background: a ? '#F3EEFF' : 'transparent' }}>
              <span style={{ fontSize: 11 }}>{e}</span>
              <span style={{ fontSize: 8, fontWeight: a ? 900 : 500, color: a ? '#6B46F0' : '#9CA3AF' }}>{l}</span>
            </div>
          ))}
        </div>
        {/* Content */}
        <div style={{ flex: 1, padding: '10px 12px' }}>
          <div style={{ fontWeight: 900, fontSize: 10, color: '#1F2937', marginBottom: 8 }}>المشتركون — اليوم</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {clients.map(c => (
              <div key={c.name} style={{ background: '#FAFAF9', border: '1px solid #F3F4F6', borderRadius: 12, padding: '8px 10px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#F3EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{c.avatar}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 900, fontSize: 9, color: '#1F2937' }}>{c.name}</div>
                  <div style={{ display: 'flex', gap: 4, marginTop: 2 }}>
                    <span style={{ fontSize: 7, color: '#9CA3AF' }}>{c.age}</span>
                    <span style={{ fontSize: 7, fontWeight: 700, color: '#6B46F0', background: '#F3EEFF', padding: '1px 5px', borderRadius: 8 }}>{c.diag}</span>
                  </div>
                </div>
                <div style={{ fontSize: 8, fontWeight: 700, color: c.statusColor, background: `${c.statusColor}15`, padding: '3px 7px', borderRadius: 8, flexShrink: 0 }}>{c.status}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Session report mockup ───────────────────────────────────────────────────────
function ReportMockup() {
  const skills = [
    { label: 'الانتباه المستمر', before: 35, after: 78, color: '#6B46F0' },
    { label: 'الذاكرة العاملة',  before: 42, after: 68, color: '#0891B2' },
    { label: 'الضبط الذاتي',     before: 28, after: 62, color: '#16A34A' },
    { label: 'المهارات الاجتماعية', before: 50, after: 72, color: '#F59E0B' },
  ]
  return (
    <div style={{ background: 'white', fontFamily: 'inherit' }} dir="rtl">
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg,#1A1A2E,#2D2B55)', padding: '12px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <AcademyLogo size={24} />
          <div>
            <div style={{ color: 'white', fontWeight: 900, fontSize: 10 }}>تقرير الجلسة — أمير</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8 }}>الجلسة ٨ · الشهر الثالث</div>
          </div>
        </div>
        <div style={{ background: '#16A34A20', border: '1px solid #16A34A50', borderRadius: 10, padding: '4px 10px', display: 'flex', alignItems: 'center', gap: 4 }}>
          <CheckCircle size={10} style={{ color: '#4ADE80' }} />
          <span style={{ color: '#4ADE80', fontSize: 8, fontWeight: 700 }}>مكتمل · A+</span>
        </div>
      </div>
      {/* AI summary */}
      <div style={{ background: '#F8F5FF', borderBottom: '1px solid #EDE9FE', padding: '10px 14px', display: 'flex', gap: 8 }}>
        <div style={{ width: 28, height: 28, borderRadius: 9, background: '#6B46F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <span style={{ fontSize: 14 }}>🤖</span>
        </div>
        <div>
          <div style={{ fontWeight: 900, fontSize: 9, color: '#6B46F0', marginBottom: 3 }}>تحليل الأخصائي</div>
          <p style={{ margin: 0, fontSize: 8.5, color: '#374151', lineHeight: 1.6 }}>
            أمير أتمّ ٦ من ٨ تمارين بدقة ٧٦٪. <strong style={{ color: '#6B46F0' }}>الانتباه تضاعف من ٣ إلى ٨ دقائق</strong> مقارنةً بالجلسة الأولى. أنصح بتركيز الجلسة القادمة على Zone of Regulation.
          </p>
        </div>
      </div>
      {/* Skills progress */}
      <div style={{ padding: '10px 14px' }}>
        <div style={{ fontWeight: 900, fontSize: 9, color: '#374151', marginBottom: 8 }}>التطور منذ بداية البرنامج</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {skills.map(({ label, before, after, color }) => (
            <div key={label}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 8.5, color: '#374151', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 8, fontWeight: 900, color }}>
                  {before}% <span style={{ color: '#9CA3AF' }}>→</span> {after}%
                </span>
              </div>
              {/* Before bar */}
              <div style={{ height: 5, background: '#F3F4F6', borderRadius: 4, marginBottom: 2, position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', height: '100%', width: `${before}%`, background: '#E5E7EB', borderRadius: 4 }} />
                <div style={{ position: 'absolute', height: '100%', width: `${after}%`, background: `linear-gradient(90deg,${color}80,${color})`, borderRadius: 4 }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Parent portal mockup ────────────────────────────────────────────────────────
function ParentMockup() {
  return (
    <div style={{ background: '#FFF8F0', fontFamily: 'inherit' }} dir="rtl">
      {/* Header */}
      <div style={{ background: 'white', borderBottom: '1.5px solid #F0E8FF', padding: '10px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 30, height: 30, borderRadius: 10, background: '#6B46F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AcademyLogo size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 10, color: '#6B46F0' }}>أكاديمية أمين</div>
            <div style={{ fontSize: 8, color: '#9CA3AF' }}>بوابة الأولياء</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['🏠','👥','📊','💬'].map(icon => (
            <div key={icon} style={{ width: 26, height: 26, borderRadius: 8, background: '#F3EEFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12 }}>{icon}</div>
          ))}
        </div>
      </div>
      {/* Welcome */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontWeight: 900, fontSize: 11, color: '#1F2937', marginBottom: 2 }}>مرحباً، محمد 👋</div>
        <div style={{ fontSize: 8, color: '#9CA3AF', marginBottom: 10 }}>الجلسة القادمة لأمير: اليوم 5:00 م — 60 دقيقة</div>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 6, marginBottom: 10 }}>
          {[{l:'الجلسات',v:'8',c:'#F3EEFF',tc:'#6B46F0'},{l:'التحسّن',v:'+64%',c:'#F0FDF4',tc:'#16A34A'},{l:'النقاط',v:'1,240⭐',c:'#FFFBEB',tc:'#D97706'}].map(({l,v,c,tc}) => (
            <div key={l} style={{ background: c, borderRadius: 12, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontWeight: 900, fontSize: 12, color: tc }}>{v}</div>
              <div style={{ fontSize: 7, color: '#9CA3AF', marginTop: 1 }}>{l}</div>
            </div>
          ))}
        </div>
        {/* Next session card */}
        <div style={{ background: '#1A1A2E', borderRadius: 14, padding: '10px 12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 8 }}>الجلسة القادمة</span>
            <span style={{ background: '#16A34A20', color: '#4ADE80', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 8 }}>مُؤكَّدة</span>
          </div>
          <div style={{ color: 'white', fontWeight: 900, fontSize: 10, marginBottom: 4 }}>الذاكرة والانتباه + APA حركي</div>
          <div style={{ display: 'flex', gap: 10, color: 'rgba(255,255,255,0.5)', fontSize: 8, marginBottom: 8 }}>
            <span>📅 اليوم 5:00 م</span><span>⏱ 60 دقيقة</span>
          </div>
          <div style={{ background: '#6B46F0', borderRadius: 10, padding: '7px', textAlign: 'center', color: 'white', fontSize: 9, fontWeight: 900 }}>
            ▶ انضم للجلسة الآن
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Slides ────────────────────────────────────────────────────────────────────
interface Slide {
  tag: string
  title: string
  sub: string
  accent: string
  color: string
  url?: string
  mockup?: React.ReactNode
  isHero?: boolean
}

const SLIDES: Slide[] = [
  {
    isHero: true,
    tag: '🌟 قطر • تونس • العالم العربي',
    title: 'أكاديمية أمين الدولية',
    sub: 'المنصة العربية الأولى التي تجمع الرياضة المعدّلة (APA) + تعديل السلوك (ABA) + التدريب المعرفي (CBT) في جلسات تفاعلية مباشرة لأطفال ADHD وطيف التوحد.',
    accent: '#A78BFA', color: '#6B46F0',
  },
  {
    tag: '① جلسة علاج حية',
    title: 'ليست مجرد مكالمة',
    sub: 'جلسة تفاعلية بالكامل — تمارين معرفية وحركية، صعوبة تكيفية تلقائية، ونظام تنبيهات يُطلع الأخصائي لحظياً على مستوى تركيز الطفل',
    accent: '#A78BFA', color: '#7C3AED',
    url: 'amine-academy.vercel.app/session/…',
    mockup: <SessionMockup />,
  },
  {
    tag: '② مكتبة التمارين',
    title: '67 تمريناً تفاعلياً',
    sub: 'تركيز، ذاكرة، قراءة، مشاعر، استرخاء، APA حركي — مُقسَّمة حسب الاضطراب والعمر والصعوبة، تُشغَّل مباشرة داخل الجلسة',
    accent: '#818CF8', color: '#4F46E5',
    url: 'amine-academy.vercel.app/exercises',
    mockup: <ExercisesMockup />,
  },
  {
    tag: '③ خريطة التقدّم',
    title: 'نجوم تضيء بعد كل جلسة',
    sub: 'خريطة بصرية يرى فيها الطفل تقدّمه بنجوم تُضاء بعد كل تمرين — يُحفّز الاستمرار ويُقلّل مقاومة الجلسة',
    accent: '#FBBF24', color: '#D97706',
    url: 'amine-academy.vercel.app/session/progress',
    mockup: <ProgressMapMockup />,
  },
  {
    tag: '④ لوحة الأخصائي',
    title: 'إدارة كاملة بمكان واحد',
    sub: 'قائمة المشتركين مع تشخيصاتهم، جدول المواعيد، البرامج الأسبوعية، التقارير السريرية، ولوحة تحليلات — جميعها بلوحة واحدة',
    accent: '#6EE7B7', color: '#059669',
    url: 'amine-academy.vercel.app/dashboard',
    mockup: <SpecialistMockup />,
  },
  {
    tag: '⑤ تقارير ذكية',
    title: 'تقرير سريري بعد كل جلسة',
    sub: 'تقرير سريري مفصّل لأداء الطفل، تطور المهارات مقارنةً بالجلسة الأولى، وتوصية للجلسة القادمة — يُرسَل تلقائياً لولي الأمر',
    accent: '#FCA5A5', color: '#EF4444',
    url: 'amine-academy.vercel.app/reports',
    mockup: <ReportMockup />,
  },
  {
    tag: '⑥ بوابة الأولياء',
    title: 'ولي الأمر مُشارك دائماً',
    sub: 'تطبيق ويب مخصص لأولياء الأمور — متابعة تقدم الطفل، مراسلة الأخصائي، الانضمام للجلسة بنقرة، وتمارين منزلية بين الجلسات',
    accent: '#93C5FD', color: '#2563EB',
    url: 'amine-academy.vercel.app/parent/dashboard',
    mockup: <ParentMockup />,
  },
]

// ─── Demo page ─────────────────────────────────────────────────────────────────
export default function DemoPage() {
  const [idx, setIdx]         = useState(0)
  const [playing, setPlaying] = useState(true)
  const [muted, setMuted]     = useState(true)
  const [progress, setProgress] = useState(0)
  const [animKey, setAnimKey] = useState(0)
  const [animDir, setAnimDir] = useState<'next' | 'prev'>('next')
  const [isMobile, setIsMobile] = useState(false)

  const audioCtxRef  = useRef<AudioContext | null>(null)
  const stopMusicRef = useRef<(() => void) | null>(null)
  const touchStartX  = useRef<number | null>(null)

  const navigate = useCallback((dir: 'next' | 'prev') => {
    setAnimDir(dir); setProgress(0); setAnimKey(k => k + 1)
    setIdx(i => dir === 'next' ? (i + 1) % SLIDES.length : (i - 1 + SLIDES.length) % SLIDES.length)
  }, [])

  const goNext = useCallback(() => navigate('next'), [navigate])
  const goPrev = useCallback(() => navigate('prev'), [navigate])
  const goTo   = useCallback((t: number) => { setAnimDir('next'); setProgress(0); setAnimKey(k => k + 1); setIdx(t) }, [])

  useEffect(() => {
    if (!playing) return
    const start = Date.now()
    const tick  = setInterval(() => setProgress(Math.min(((Date.now() - start) / SLIDE_DURATION) * 100, 100)), 30)
    const timer = setTimeout(goNext, SLIDE_DURATION)
    return () => { clearInterval(tick); clearTimeout(timer) }
  }, [playing, idx, goNext])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.code === 'Space') { e.preventDefault(); setPlaying(p => !p) }
      if (e.code === 'ArrowLeft') goNext()
      if (e.code === 'ArrowRight') goPrev()
    }
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [goNext, goPrev])

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) < 40) return
    // RTL: swipe right → prev, swipe left → next
    if (dx > 0) goPrev(); else goNext()
  }

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

  useEffect(() => () => { stopMusicRef.current?.(); setTimeout(() => audioCtxRef.current?.close(), 2000) }, [])

  // Mobile detection
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const slide    = SLIDES[idx]
  const hasVisual = slide.isHero || !!(slide.mockup && slide.url)
  const slideAnim = animDir === 'next' ? 'dslideNext 0.42s cubic-bezier(0.22,1,0.36,1) both' : 'dslidePrev 0.42s cubic-bezier(0.22,1,0.36,1) both'

  return (
    <div
      dir="rtl"
      style={{ height: '100dvh', background: 'linear-gradient(160deg,#F9F7FF 0%,#F3F0FF 50%,#EEF2FF 100%)', color: '#1E293B', display: 'flex', flexDirection: 'column', fontFamily: 'inherit', overflow: 'hidden' }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <style>{`
        @keyframes dfloat    { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-9px)} }
        @keyframes dspin     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes dpulse    { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes dslideNext{ from{opacity:0;transform:translateX(-28px)} to{opacity:1;transform:translateX(0)} }
        @keyframes dslidePrev{ from{opacity:0;transform:translateX(28px)}  to{opacity:1;transform:translateX(0)} }
      `}</style>

      {/* ── Global progress bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: 3, zIndex: 100, background: 'rgba(124,92,252,0.1)' }}>
        <div style={{
          height: '100%', background: `linear-gradient(90deg,${slide.color},${slide.accent})`,
          width: '100%',
          transform: `scaleX(${((idx / SLIDES.length) * 100 + progress / SLIDES.length) / 100})`,
          transformOrigin: 'right', transition: 'transform 0.03s linear', borderRadius: '2px 0 0 2px',
        }} />
      </div>

      {/* ── Header ── */}
      <header style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: isMobile ? '10px 14px' : '12px 24px', borderBottom: '1px solid rgba(124,92,252,0.1)', marginTop: 3, background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(16px)' }}>
        <Link href="/" style={{ color: '#94A3B8', fontSize: 12, fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
          <ChevronRight size={14} />{isMobile ? '' : 'الرئيسية'}
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <AcademyLogo size={isMobile ? 26 : 30} />
          <div>
            <div style={{ fontWeight: 900, fontSize: isMobile ? 12 : 13, color: '#1E293B', lineHeight: 1 }}>أكاديمية أمين</div>
            {!isMobile && <div style={{ fontSize: 9, color: '#94A3B8' }}>الجولة التجريبية</div>}
          </div>
        </div>
        <Link href="/#plans" style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', fontWeight: 900, fontSize: isMobile ? 11 : 12, padding: isMobile ? '7px 13px' : '8px 18px', borderRadius: 11, textDecoration: 'none', boxShadow: '0 4px 18px rgba(107,70,240,.28)' }}>
          {isMobile ? 'سجّل ←' : 'سجّل مجاناً ←'}
        </Link>
      </header>

      {/* ── Slide ── */}
      <main style={{ flex: 1, display: 'flex', alignItems: 'center', overflow: 'hidden', padding: isMobile ? '0 18px' : '0 32px' }}>
        <div
          key={animKey}
          style={{
            width: '100%', maxWidth: 960, margin: '0 auto',
            display: 'grid',
            gridTemplateColumns: (!isMobile && hasVisual) ? '1fr 1fr' : '1fr',
            gap: isMobile ? 0 : 48,
            alignItems: 'center',
            animation: slideAnim,
          }}
        >
          {/* ── Text column (right in RTL) ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? 14 : 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: slide.color, letterSpacing: 1.5, textTransform: 'uppercase', background: `${slide.color}10`, border: `1px solid ${slide.color}28`, padding: '5px 16px', borderRadius: 20, alignSelf: 'flex-start' }}>
              {slide.tag}
            </div>

            <h1 style={{ fontSize: isMobile ? 'clamp(24px,7vw,32px)' : 'clamp(26px,3.2vw,46px)', fontWeight: 900, margin: 0, lineHeight: 1.15, color: '#1E293B' }}>
              {slide.title}
            </h1>

            <p style={{ fontSize: isMobile ? 14 : 'clamp(13px,1.4vw,15px)', color: '#64748B', margin: 0, lineHeight: 1.8 }}>
              {slide.sub}
            </p>

            {slide.isHero && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {['ADHD', 'طيف التوحد', 'عسر القراءة', 'اضطراب التركيز'].map(t => (
                  <span key={t} style={{ background: 'rgba(107,70,240,0.07)', border: '1px solid rgba(107,70,240,0.15)', color: '#6B46F0', fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20 }}>{t}</span>
                ))}
              </div>
            )}

            {slide.isHero && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 6 }}>
                <Link href="/#plans" style={{ background: 'linear-gradient(135deg,#6B46F0,#9A7BFD)', color: 'white', fontWeight: 900, fontSize: 14, padding: '12px 24px', borderRadius: 14, textDecoration: 'none', boxShadow: '0 6px 24px rgba(107,70,240,.32)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  ابدأ مجاناً ←
                </Link>
                <button onClick={goNext} style={{ background: 'rgba(107,70,240,0.06)', border: '1.5px solid rgba(107,70,240,0.18)', color: '#6B46F0', fontWeight: 800, fontSize: 13, padding: '12px 20px', borderRadius: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Play size={14} fill="#6B46F0" /> شاهد الجلسة
                </button>
              </div>
            )}
          </div>

          {/* ── Visual column (left in RTL) — hidden on mobile ── */}
          {hasVisual && !isMobile && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {slide.isHero
                ? <HeroVisual />
                : <Frame url={slide.url!} color={slide.color}>{slide.mockup}</Frame>
              }
            </div>
          )}
        </div>
      </main>

      {/* ── Controls ── */}
      <footer style={{ flexShrink: 0, background: 'rgba(255,255,255,0.93)', backdropFilter: 'blur(16px)', borderTop: '1px solid rgba(124,92,252,0.1)', padding: isMobile ? '8px 16px 12px' : '10px 24px 14px' }}>
        {isMobile && (
          <div style={{ textAlign: 'center', color: '#CBD5E1', fontSize: 10, fontWeight: 600, marginBottom: 6, letterSpacing: 0.5 }}>
            ← اسحب للتنقل →
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 5, marginBottom: 9 }}>
          {SLIDES.map((s, i) => (
            <button
              key={i}
              onClick={() => goTo(i)}
              style={{
                height: 6,
                width: i === idx ? 28 : 6,
                borderRadius: 3,
                background: i === idx ? s.color : 'rgba(124,92,252,0.18)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.34,1.56,0.64,1)',
                padding: 0,
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <button onClick={goPrev} style={CB}><ChevronLeft size={16} /></button>

          <button
            onClick={() => setPlaying(p => !p)}
            style={{ ...CB, width: 44, height: 44, borderRadius: 13, background: `${slide.color}14`, border: `1.5px solid ${slide.color}38`, color: slide.color }}
          >
            {playing ? <Pause size={17} /> : <Play size={17} fill={slide.color} />}
          </button>

          <button onClick={goNext} style={CB}><ChevronRight size={16} /></button>

          <div style={{ width: 1, height: 22, background: 'rgba(124,92,252,0.12)', margin: '0 2px' }} />

          <button onClick={toggleMusic} style={{ ...CB, color: muted ? '#CBD5E1' : slide.color }} title={muted ? 'تشغيل الموسيقى' : 'كتم'}>
            <span style={{ fontSize: 14 }}>{muted ? '🔇' : '🔊'}</span>
          </button>

          <div dir="ltr" style={{ color: '#94A3B8', fontSize: 11, fontWeight: 700, fontFamily: 'monospace', minWidth: 28, textAlign: 'center' }}>
            {idx + 1}/{SLIDES.length}
          </div>
        </div>
      </footer>
    </div>
  )
}

const CB: React.CSSProperties = {
  width: 38, height: 38, borderRadius: 11,
  background: 'rgba(124,92,252,0.06)',
  border: '1px solid rgba(124,92,252,0.11)',
  color: '#64748B',
  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
  flexShrink: 0,
}
