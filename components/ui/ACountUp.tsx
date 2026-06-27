'use client'
import { useEffect, useRef, useState } from 'react'

interface ACountUpProps {
  value: number
  duration?: number // ms
  decimals?: number
  className?: string
  prefix?: string
  suffix?: string
}

// Animates from the previous rendered value to the new one on every change —
// gives stat numbers a "live" feel instead of snapping when fresh data lands.
export default function ACountUp({ value, duration = 900, decimals = 0, className = '', prefix = '', suffix = '' }: ACountUpProps) {
  const [display, setDisplay] = useState(value)
  const prevValue = useRef(value)

  useEffect(() => {
    const from = prevValue.current
    const to = value
    if (from === to) return
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setDisplay(from + (to - from) * eased)
      if (t < 1) {
        raf = requestAnimationFrame(tick)
      } else {
        setDisplay(to)
        prevValue.current = to
      }
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value, duration])

  const shown = decimals === 0 ? Math.round(display) : Number(display.toFixed(decimals))

  return (
    <span className={`ltr-num ${className}`}>
      {prefix}{shown}{suffix}
    </span>
  )
}
