'use client'
import { Component, type ReactNode } from 'react'
import { reportError } from '@/lib/client-error-monitor'

// If a single exercise throws mid-session, React unmounts the WHOLE tree —
// the specialist or (worse) the child is left staring at a blank screen with
// no way out. This boundary catches that: it shows a friendly, on-brand
// fallback with a retry, so one buggy exercise can never take down a live
// therapy session. It also surfaces the error so it isn't swallowed silently
// (a hook can forward it to an error monitor once one is configured).

interface Props {
  children: ReactNode
  /** 'kid' softens the message + hides technical detail for the child. */
  audience?: 'specialist' | 'kid'
  /** Remount key — changing it (e.g. the exercise id) resets the boundary. */
  resetKey?: string | number
  onError?: (error: Error) => void
}

interface State {
  error: Error | null
  attempt: number
}

export default class ExerciseErrorBoundary extends Component<Props, State> {
  state: State = { error: null, attempt: 0 }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error }
  }

  componentDidUpdate(prev: Props) {
    // A new exercise (resetKey changed) clears a prior crash automatically.
    if (prev.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null })
    }
  }

  componentDidCatch(error: Error) {
    // Not swallowed: log it AND report it to the in-app error monitor
    // (مراقبة الأخطاء) — React boundaries stop the error before window.onerror
    // sees it, so without this an exercise crash would never appear there.
    // eslint-disable-next-line no-console
    console.error('[exercise-error-boundary]', error)
    reportError(error, { source: 'exercise', audience: this.props.audience ?? 'specialist', exercise: String(this.props.resetKey ?? '') })
    this.props.onError?.(error)
  }

  render() {
    if (!this.state.error) return this.props.children

    const isKid = this.props.audience === 'kid'
    return (
      <div
        dir="rtl"
        style={{
          minHeight: '60vh', width: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24, textAlign: 'center',
        }}
      >
        <div style={{ fontSize: 56, lineHeight: 1 }}>{isKid ? '🌈' : '⚠️'}</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: isKid ? '#6D28D9' : '#F87171' }}>
          {isKid ? 'لحظة صغيرة…' : 'تعذّر تحميل هذا التمرين'}
        </div>
        <div style={{ fontSize: 14, color: isKid ? '#7C3AED' : '#9CA3AF', maxWidth: 320, opacity: 0.85 }}>
          {isKid
            ? 'سنعود بعد لحظة! ابقَ معنا 💜'
            : 'حدث خطأ غير متوقع في هذا التمرين. جرّب إعادة تحميله أو اختر تمريناً آخر — الجلسة لم تتأثر.'}
        </div>
        <button
          onClick={() => this.setState(s => ({ error: null, attempt: s.attempt + 1 }))}
          style={{
            display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer',
            background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 12,
            padding: '10px 20px', fontSize: 14, fontWeight: 900,
          }}
        >
          🔄 {isKid ? 'إعادة' : 'إعادة المحاولة'}
        </button>
      </div>
    )
  }
}
