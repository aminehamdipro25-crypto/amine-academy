'use client'
import { useRef, useState, useEffect, useCallback } from 'react'
import { Trash2, Minus, Circle } from 'lucide-react'

interface Props {
  onClose: () => void
  /** When set, every stroke is broadcast to /api/sessions/{sessionId}/whiteboard
      so the kid/parent page mirrors the board in near-real-time. */
  sessionId?: string
}

const COLORS = [
  '#FFFFFF', '#EF4444', '#3B82F6', '#22C55E',
  '#EAB308', '#A855F7', '#F97316', '#000000',
]

const SIZES = [
  { label: 'S', value: 3 },
  { label: 'M', value: 8 },
  { label: 'L', value: 18 },
]

export default function Whiteboard({ onClose, sessionId }: Props) {
  const canvasRef   = useRef<HTMLCanvasElement>(null)
  const drawing     = useRef(false)
  const lastPos     = useRef<{ x: number; y: number } | null>(null)
  const strokePts   = useRef<number[]>([])   // normalized flat [x1,y1,x2,y2,...] of the stroke in progress
  const [color, setColor]     = useState('#FFFFFF')
  const [sizeIdx, setSizeIdx] = useState(1)
  const [eraser, setEraser]   = useState(false)
  const [history, setHistory] = useState<ImageData[]>([])

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null

  // Current canvas aspect ratio (w/h) — sent so the kid can letterbox its own
  // canvas to match and replay strokes without stretching.
  const canvasAR = () => {
    const c = canvasRef.current
    return c && c.height ? c.width / c.height : 4 / 3
  }

  // Broadcast a whiteboard mutation so the kid page can mirror it. The current
  // aspect ratio rides along on every message.
  const syncPost = useCallback((payload: Record<string, unknown>) => {
    if (!sessionId) return
    fetch(`/api/sessions/${sessionId}/whiteboard`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...payload, ar: canvasAR() }),
    }).catch(() => {})
  }, [sessionId])

  // Mark board open/closed for the kid page
  useEffect(() => {
    syncPost({ action: 'open' })
    return () => syncPost({ action: 'close' })
  }, [syncPost])

  // Save state for undo
  function saveState() {
    const ctx = getCtx()
    const c = canvasRef.current
    if (!ctx || !c) return
    setHistory(h => [...h.slice(-19), ctx.getImageData(0, 0, c.width, c.height)])
  }

  function undo() {
    const ctx = getCtx()
    if (!ctx || history.length === 0) return
    const prev = history[history.length - 1]
    ctx.putImageData(prev, 0, 0)
    setHistory(h => h.slice(0, -1))
    syncPost({ action: 'undo' })
  }

  function clear() {
    const ctx = getCtx()
    const c = canvasRef.current
    if (!ctx || !c) return
    saveState()
    ctx.fillStyle = '#1F2937'
    ctx.fillRect(0, 0, c.width, c.height)
    syncPost({ action: 'clear' })
  }

  // Resize canvas to fill container
  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const resize = () => {
      const ctx = c.getContext('2d')
      const saved = ctx?.getImageData(0, 0, c.width, c.height)
      c.width  = c.offsetWidth
      c.height = c.offsetHeight
      const ctx2 = c.getContext('2d')
      if (!ctx2) return
      ctx2.fillStyle = '#1F2937'
      ctx2.fillRect(0, 0, c.width, c.height)
      if (saved) ctx2.putImageData(saved, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(c)
    return () => ro.disconnect()
  }, [])

  function getPos(e: React.MouseEvent | React.TouchEvent): { x: number; y: number } | null {
    const c = canvasRef.current
    if (!c) return null
    const rect = c.getBoundingClientRect()
    if ('touches' in e) {
      const t = e.touches[0]
      return { x: t.clientX - rect.left, y: t.clientY - rect.top }
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top }
  }

  function drawLine(from: { x: number; y: number }, to: { x: number; y: number }) {
    const ctx = getCtx()
    if (!ctx) return
    ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
    ctx.strokeStyle = eraser ? 'rgba(0,0,0,1)' : color
    ctx.lineWidth   = SIZES[sizeIdx].value * (eraser ? 3 : 1)
    ctx.lineCap     = 'round'
    ctx.lineJoin    = 'round'
    ctx.beginPath()
    ctx.moveTo(from.x, from.y)
    ctx.lineTo(to.x, to.y)
    ctx.stroke()
  }

  // Normalize a canvas position to 0..1 so the kid canvas (any size) can replay it
  function pushNormPoint(pos: { x: number; y: number }) {
    const c = canvasRef.current
    if (!c || c.width === 0 || c.height === 0) return
    strokePts.current.push(pos.x / c.width, pos.y / c.height)
  }

  const onStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    saveState()
    drawing.current = true
    const pos = getPos(e)
    lastPos.current = pos
    strokePts.current = []
    // Draw a dot on click
    if (pos) {
      pushNormPoint(pos)
      const ctx = getCtx()
      if (ctx) {
        ctx.globalCompositeOperation = eraser ? 'destination-out' : 'source-over'
        ctx.fillStyle = eraser ? 'rgba(0,0,0,1)' : color
        ctx.beginPath()
        ctx.arc(pos.x, pos.y, (SIZES[sizeIdx].value * (eraser ? 3 : 1)) / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, eraser, sizeIdx])

  const onMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    if (!drawing.current) return
    const pos = getPos(e)
    if (pos && lastPos.current) drawLine(lastPos.current, pos)
    if (pos) pushNormPoint(pos)
    lastPos.current = pos
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [color, eraser, sizeIdx])

  const onEnd = useCallback(() => {
    if (drawing.current && strokePts.current.length >= 2) {
      // Round to 4 decimals to keep the payload small
      const p = strokePts.current.map(v => Math.round(v * 10000) / 10000)
      syncPost({ action: 'stroke', stroke: { c: color, s: SIZES[sizeIdx].value * (eraser ? 3 : 1), e: eraser, p } })
    }
    drawing.current = false
    lastPos.current = null
    strokePts.current = []
  }, [color, eraser, sizeIdx, syncPost])

  return (
    <div className="flex flex-col h-full" dir="rtl">
      {/* Toolbar */}
      <div
        className="flex items-center gap-3 px-4 py-2.5 flex-wrap flex-shrink-0"
        style={{ background: '#111827', borderBottom: '1px solid rgba(255,255,255,0.08)' }}
      >
        {/* Colors */}
        <div className="flex gap-1.5 items-center">
          {COLORS.map(c => (
            <button
              key={c}
              onClick={() => { setColor(c); setEraser(false) }}
              className="rounded-full transition-transform active:scale-90"
              style={{
                width: 22,
                height: 22,
                background: c,
                border: color === c && !eraser
                  ? '2.5px solid #7C5CFC'
                  : c === '#FFFFFF' ? '1.5px solid rgba(255,255,255,0.3)' : '1.5px solid transparent',
                boxShadow: color === c && !eraser ? `0 0 0 1px ${c}` : 'none',
                transform: color === c && !eraser ? 'scale(1.25)' : 'scale(1)',
              }}
            />
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Brush sizes */}
        <div className="flex gap-1 items-center">
          {SIZES.map((s, i) => (
            <button
              key={s.label}
              onClick={() => { setSizeIdx(i); setEraser(false) }}
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all text-xs font-black"
              style={{
                background: sizeIdx === i && !eraser ? '#7C5CFC' : 'rgba(255,255,255,0.08)',
                color: sizeIdx === i && !eraser ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="w-px h-5 bg-white/10 flex-shrink-0" />

        {/* Eraser */}
        <button
          onClick={() => setEraser(e => !e)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: eraser ? '#7C5CFC' : 'rgba(255,255,255,0.08)',
            color: eraser ? '#FFFFFF' : 'rgba(255,255,255,0.5)',
          }}
        >
          <Minus className="w-3.5 h-3.5" />
          ممحاة
        </button>

        {/* Undo */}
        <button
          onClick={undo}
          disabled={history.length === 0}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{
            background: 'rgba(255,255,255,0.08)',
            color: history.length > 0 ? 'rgba(255,255,255,0.7)' : 'rgba(255,255,255,0.2)',
          }}
        >
          ↩ تراجع
        </button>

        {/* Clear */}
        <button
          onClick={clear}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all"
          style={{ background: 'rgba(239,68,68,0.15)', color: '#EF4444' }}
        >
          <Trash2 className="w-3.5 h-3.5" />
          مسح
        </button>

        {/* Current color preview */}
        <div className="flex items-center gap-2 mr-auto">
          <div
            className="w-6 h-6 rounded-full border-2 border-white/20 flex-shrink-0"
            style={{ background: eraser ? 'transparent' : color, borderStyle: eraser ? 'dashed' : 'solid' }}
          />
          <Circle className="w-3.5 h-3.5 text-white/30" style={{ width: SIZES[sizeIdx].value, height: SIZES[sizeIdx].value }} />
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="text-white/40 hover:text-white text-lg font-bold px-2 transition-colors mr-1"
        >
          ✕
        </button>
      </div>

      {/* Hint */}
      <div
        className="text-center py-1 flex-shrink-0 text-[10px] text-white/20 font-bold"
        style={{ background: '#0F172A' }}
      >
        {sessionId ? '✨ الطفل يرى السبورة مباشرةً على جهازه' : 'شارك شاشتك مع الطالب ليرى السبورة'}
      </div>

      {/* Canvas */}
      <div className="flex-1 relative overflow-hidden" style={{ background: '#1F2937' }}>
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full cursor-crosshair touch-none"
          onMouseDown={onStart}
          onMouseMove={onMove}
          onMouseUp={onEnd}
          onMouseLeave={onEnd}
          onTouchStart={onStart}
          onTouchMove={onMove}
          onTouchEnd={onEnd}
        />
      </div>
    </div>
  )
}
