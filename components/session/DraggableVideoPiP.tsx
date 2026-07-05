'use client'
import { useRef, useState, useCallback } from 'react'

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
  // posRef — single source of truth during and after drag (avoids React re-render fighting DOM)
  const posRef   = useRef<{ x: number; y: number } | null>(null)
  const [, forceUpdate] = useState(0)
  const dragging  = useRef(false)
  const dragOffset = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)
  const [collapsed, setCollapsed] = useState(false)

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return
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
    if (!dragging.current || !containerRef.current) return
    const el = containerRef.current
    const x = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  e.clientX - dragOffset.current.x))
    const y = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, e.clientY - dragOffset.current.y))
    el.style.left   = `${x}px`
    el.style.top    = `${y}px`
    el.style.bottom = 'auto'
    posRef.current  = { x, y }
  }, [])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    if (posRef.current) forceUpdate(n => n + 1)
  }, [])

  const posStyle: React.CSSProperties = posRef.current
    ? { left: posRef.current.x, top: posRef.current.y, bottom: 'auto' }
    : { bottom: initialBottom, left: initialLeft }

  return (
    <div
      ref={containerRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      className="fixed z-[80] flex flex-col overflow-hidden rounded-2xl shadow-2xl select-none"
      style={{
        ...posStyle,
        width:  minWidth,
        height: collapsed ? 36 : minHeight,
        background: '#111827',
        border: '2px solid rgba(255,255,255,0.15)',
        cursor: 'grab',
        touchAction: 'none',
        willChange: 'left, top',
        transition: 'height 0.2s ease',
      }}
    >
      {/* Drag handle / title bar */}
      <div
        className="flex items-center justify-between px-2 py-1 flex-shrink-0"
        style={{ background: 'rgba(0,0,0,0.6)', minHeight: 32 }}
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
        </div>
      )}
    </div>
  )
}
