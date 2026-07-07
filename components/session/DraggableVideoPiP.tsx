'use client'
import { useRef, useState, useCallback, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface Props {
  children: React.ReactNode
  initialBottom?: number
  initialLeft?: number
  onClose: () => void
  label?: string
  minWidth?: number
  minHeight?: number
}

export default function DraggableVideoPiP({
  children,
  initialBottom = 20,
  initialLeft = 20,
  onClose,
  label = '📹 مقابلة',
  minWidth = 280,
  minHeight = 210,
}: Props) {
  const posRef       = useRef<{ x: number; y: number } | null>(null)
  const [, forceUpdate] = useState(0)
  const dragging     = useRef(false)
  const resizing     = useRef(false)
  const dragOffset   = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [size, setSize] = useState({ w: minWidth, h: minHeight })
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  /* ── Drag ── */
  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, [data-resize]')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragging.current = true
    const el = containerRef.current
    if (el) {
      const rect = el.getBoundingClientRect()
      dragOffset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top }
      posRef.current = { x: rect.left, y: rect.top }
    }
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return
    const el = containerRef.current
    if (dragging.current) {
      const x = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - dragOffset.current.x))
      const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - dragOffset.current.y))
      el.style.left   = `${x}px`
      el.style.top    = `${y}px`
      el.style.bottom = 'auto'
      posRef.current  = { x, y }
    } else if (resizing.current) {
      const rect = el.getBoundingClientRect()
      const newW = Math.max(minWidth,  e.clientX - rect.left)
      const newH = Math.max(minHeight, e.clientY - rect.top)
      setSize({ w: newW, h: newH })
    }
  }, [minWidth, minHeight])

  const onPointerUp = useCallback(() => {
    if (dragging.current) { dragging.current = false; forceUpdate(n => n + 1) }
    resizing.current = false
  }, [])

  /* ── Resize handle ── */
  const onResizeDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizing.current = true
  }, [])

  const posStyle: React.CSSProperties = posRef.current
    ? { left: posRef.current.x, top: posRef.current.y, bottom: 'auto' }
    : { bottom: initialBottom, left: initialLeft }

  const pip = (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed flex flex-col overflow-hidden rounded-2xl shadow-2xl select-none"
      style={{
        ...posStyle,
        width:  size.w,
        height: collapsed ? 36 : size.h,
        zIndex: 9999,
        background: '#111827',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: dragging.current ? 'grabbing' : 'grab',
        touchAction: 'none',
        willChange: 'left, top',
        transition: collapsed ? 'height 0.2s ease' : undefined,
      }}
    >
      {/* Title bar */}
      <div
        className="flex items-center justify-between px-2 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', minHeight: 28 }}
      >
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-white text-[10px] font-black">{label}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={() => setCollapsed(c => !c)}
            className="text-white/60 hover:text-white text-xs w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
            title={collapsed ? 'توسيع' : 'تصغير'}
          >
            {collapsed ? '▲' : '▼'}
          </button>
          <button
            onPointerDown={e => e.stopPropagation()}
            onClick={onClose}
            className="text-white/60 hover:text-red-400 text-xs w-5 h-5 flex items-center justify-center rounded transition-colors hover:bg-white/10"
            title="إغلاق"
          >
            ✕
          </button>
        </div>
      </div>

      {/* Content */}
      {!collapsed && (
        <div className="flex-1 relative overflow-hidden">
          {children}
          {/* Resize handle — bottom-right corner */}
          <div
            data-resize
            onPointerDown={onResizeDown}
            style={{
              position: 'absolute', bottom: 0, right: 0,
              width: 18, height: 18, cursor: 'se-resize', zIndex: 10,
              background: 'linear-gradient(135deg, transparent 50%, rgba(255,255,255,0.25) 50%)',
              borderRadius: '0 0 8px 0',
            }}
          />
        </div>
      )}
    </div>
  )

  if (!mounted) return null
  return createPortal(pip, document.body)
}
