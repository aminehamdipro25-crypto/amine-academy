'use client'
// Embedded Daily.co call using the PREBUILT IFRAME (DailyIframe.createFrame).
//
// Why prebuilt and not call-object mode: call-object fetches Daily's call
// engine bundle from *.dailywebrtc.net into OUR page, so it only works if our
// CSP perfectly allows that third-party origin — which caused days of
// "Failed to load call object bundle: ... TypeError: Failed to fetch". With
// the prebuilt iframe, Daily's engine runs INSIDE the iframe on Daily's own
// origin, governed by Daily's CSP, not ours. Our CSP only needs frame-src
// (which we have), so this whole class of failure disappears. Camera works
// via our Permissions-Policy (camera=* on /session/*) plus the allow=
// attribute daily-js sets on its iframe automatically.
import { useEffect, useRef, useState, useCallback } from 'react'
import DailyIframe, { type DailyCall } from '@daily-co/daily-js'
import { Mic, MicOff, RefreshCw } from 'lucide-react'

interface Props {
  url: string
  userName: string
  compact?: boolean
  /** 'specialist' can remotely mute the 'kid'. 'kid' obeys mute commands. */
  role?: 'specialist' | 'kid'
}

type MicCmd = { t: 'kid-mic'; on: boolean }

export default function DailyVideoCall({ url, userName, compact = false, role = 'specialist' }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const callRef      = useRef<DailyCall | null>(null)
  const [error, setError]           = useState('')
  const [retryNonce, setRetryNonce] = useState(0)
  const [kidMuted, setKidMuted]     = useState(false)
  const kidMutedRef                 = useRef(false)

  const reconnect = useCallback(() => {
    setError('')
    setRetryNonce(n => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    let cleanup: (() => void) | null = null

    async function init() {
      const container = containerRef.current
      if (!container) return

      // Prebuilt allows only one instance per page — destroy any leftover
      // (from a prior failed attempt or a remount) before creating a new one.
      const existing = DailyIframe.getCallInstance()
      if (existing) {
        try { await existing.destroy() } catch { /* already gone */ }
      }
      if (cancelled) return

      let call: DailyCall
      try {
        call = DailyIframe.createFrame(container, {
          showLeaveButton: false,
          showFullscreenButton: false,
          showUserNameChangeUI: false,
          showParticipantsBar: false,
          // Kid: hide their own tile + use active-speaker mode so the
          // SPECIALIST fills the whole box (the child's #1 need is to see the
          // teacher, not a small grid dominated by Daily's mic banner).
          // Specialist: keep the grid so they see both themselves and the kid.
          showLocalVideo: role !== 'kid',
          activeSpeakerMode: role === 'kid',
          iframeStyle: {
            position: 'absolute', top: '0', left: '0',
            width: '100%', height: '100%', border: '0',
          },
          theme: {
            colors: {
              accent: '#7C5CFC', accentText: '#FFFFFF',
              background: '#111827', backgroundAccent: '#1F2937',
              baseText: '#FFFFFF', border: '#374151',
              mainAreaBg: '#111827', mainAreaBgAccent: '#1F2937',
              mainAreaText: '#FFFFFF', supportiveText: '#9CA3AF',
            },
          },
        })
      } catch (e) {
        if (!cancelled) setError(`تعذر تهيئة المكالمة: ${e instanceof Error ? e.message : ''}`)
        return
      }
      callRef.current = call

      // Kid: obey the specialist's remote mute command
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onAppMessage = (e: any) => {
        if (cancelled || role !== 'kid') return
        const data = e?.data as MicCmd | undefined
        if (data?.t !== 'kid-mic') return
        call.setLocalAudio(data.on)
      }
      // Specialist: re-assert current mute whenever the kid (re)joins
      const onParticipantJoined = () => {
        if (cancelled || role !== 'specialist') return
        if (kidMutedRef.current) {
          try { call.sendAppMessage({ t: 'kid-mic', on: false } as MicCmd, '*') } catch { /* ignore */ }
        }
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onError = (e: any) => {
        if (cancelled) return
        const msg = e?.errorMsg || e?.error?.msg || e?.error?.type || ''
        // Ignore benign device/permission notices — the call still connects.
        if (/permission|not-allowed|cam-in-use|mic-in-use|devices/i.test(String(msg))) return
        setError(`تعذر الاتصال: ${msg || 'خطأ غير معروف'}`)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('app-message', onAppMessage as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('participant-joined', onParticipantJoined as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('error', onError as any)

      call.join({ url, userName }).catch((err: unknown) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const anyErr = err as any
        const detail = (err instanceof Error && err.message) || anyErr?.errorMsg || 'خطأ في الانضمام'
        if (!cancelled) setError(`تعذر الاتصال: ${detail}`)
      })

      cleanup = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('app-message', onAppMessage as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('participant-joined', onParticipantJoined as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('error', onError as any)
        call.destroy().catch(() => {})
      }
    }

    init()
    return () => {
      cancelled = true
      cleanup?.()
      callRef.current = null
    }
  }, [url, userName, role, retryNonce])

  const toggleKidMic = useCallback(() => {
    const call = callRef.current
    if (!call) return
    const next = !kidMutedRef.current
    kidMutedRef.current = next
    setKidMuted(next)
    try { call.sendAppMessage({ t: 'kid-mic', on: !next } as MicCmd, '*') } catch { /* ignore */ }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111827', overflow: 'hidden' }} dir="rtl">
      {/* Daily's prebuilt iframe mounts inside this container */}
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />

      {/* Error overlay + reconnect (only shown on a hard failure) */}
      {error && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 10, padding: 12, textAlign: 'center',
          background: 'rgba(17,24,39,0.96)',
        }}>
          <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: '#F87171' }}>{error}</span>
          <button
            onClick={reconnect}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              background: '#7C5CFC', color: '#fff', border: 'none', borderRadius: 10,
              padding: compact ? '5px 12px' : '7px 16px', fontSize: compact ? 11 : 13, fontWeight: 900,
            }}
          >
            <RefreshCw className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            إعادة الاتصال
          </button>
        </div>
      )}

      {/* Specialist-only: remotely mute/unmute the child, overlaid on Daily's UI */}
      {role === 'specialist' && !error && (
        <button
          onClick={toggleKidMic}
          title={kidMuted ? 'إلغاء كتم مايك الطفل' : 'كتم مايك الطفل'}
          style={{
            position: 'absolute', top: 8, right: 8, zIndex: 6,
            display: 'flex', alignItems: 'center', gap: 5,
            height: compact ? 26 : 30, padding: '0 10px', borderRadius: 15, border: 'none', cursor: 'pointer',
            background: kidMuted ? '#DC2626' : 'rgba(0,0,0,0.55)', color: '#fff',
            fontSize: compact ? 10 : 11, fontWeight: 900, whiteSpace: 'nowrap',
            backdropFilter: 'blur(4px)',
          }}
        >
          {kidMuted ? <MicOff className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> : <Mic className={compact ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
          {kidMuted ? 'صوت الطفل مكتوم' : 'كتم الطفل'}
        </button>
      )}
    </div>
  )
}
