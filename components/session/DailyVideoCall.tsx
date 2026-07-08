'use client'
// Embedded Daily.co call using the JS SDK (call-object mode) — NO iframe.
// Camera/mic are requested by OUR origin, so Chrome never shows the
// cross-origin "camera blocked" wall, and there is no Daily.co UI
// (no banner, no Leave button) covering the video.
import { useEffect, useRef, useState, useCallback } from 'react'
import Daily, { type DailyCall } from '@daily-co/daily-js'
import { Mic, MicOff, Video, VideoOff, RefreshCw } from 'lucide-react'

interface Props {
  url: string
  userName: string
  /** Compact mode for the kid page: smaller controls, remote video fills the box */
  compact?: boolean
  /** 'specialist' can remotely mute the 'kid'. 'kid' obeys mute commands. */
  role?: 'specialist' | 'kid'
}

// App-message payload the specialist sends to control the kid's mic
type MicCmd = { t: 'kid-mic'; on: boolean }

const JOIN_TIMEOUT_MS = 15000

export default function DailyVideoCall({ url, userName, compact = false, role = 'specialist' }: Props) {
  const callRef        = useRef<DailyCall | null>(null)
  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const [joined, setJoined]               = useState(false)
  const [camOn, setCamOn]                 = useState(true)
  const [micOn, setMicOn]                 = useState(true)
  const [remotePresent, setRemotePresent] = useState(false)
  const [error, setError]                 = useState('')
  const [retryNonce, setRetryNonce]       = useState(0)
  // Specialist: whether the kid is currently muted-by-me. Kept in a ref so the
  // participant-joined handler can re-assert it after the kid (re)connects.
  const [kidMuted, setKidMuted]           = useState(false)
  const kidMutedRef                       = useRef(false)
  // Kid: whether the specialist has forced my mic off (locks my own button)
  const [micLocked, setMicLocked]         = useState(false)

  const reconnect = useCallback(() => {
    setError('')
    setJoined(false)
    setRemotePresent(false)
    setRetryNonce(n => n + 1)
  }, [])

  useEffect(() => {
    let cancelled = false
    let joinTimeoutId: ReturnType<typeof setTimeout> | null = null

    const evs = ['joined-meeting', 'participant-joined', 'participant-updated', 'participant-left', 'track-started', 'track-stopped'] as const

    async function init() {
      // Always start from a guaranteed-clean instance. Reusing whatever
      // Daily.getCallInstance() happens to return risks inheriting a call
      // object left in a broken/stuck state by a previous failed attempt on
      // this page (e.g. a prior join that errored, or a leftover from
      // navigating away and back without a full reload) — every mount of
      // this component destroys any stale instance first, then creates a
      // fresh one, so a broken previous attempt can never carry over.
      const existing = Daily.getCallInstance()
      if (existing) {
        try { await existing.destroy() } catch { /* already gone / never joined */ }
      }
      if (cancelled) return

      const call = Daily.createCallObject()
      callRef.current = call

      const updateTracks = () => {
        if (cancelled) return
        const parts = call.participants()
        const local = parts.local
        const lv = local?.tracks?.video
        if (localVideoRef.current && lv?.persistentTrack) {
          localVideoRef.current.srcObject = new MediaStream([lv.persistentTrack])
        }
        const remote = Object.values(parts).find(p => !p.local)
        setRemotePresent(!!remote)
        if (remote) {
          const rv = remote.tracks?.video
          if (remoteVideoRef.current && rv?.persistentTrack) {
            remoteVideoRef.current.srcObject = new MediaStream([rv.persistentTrack])
          }
          const ra = remote.tracks?.audio
          if (remoteAudioRef.current && ra?.persistentTrack) {
            remoteAudioRef.current.srcObject = new MediaStream([ra.persistentTrack])
          }
        }
      }

      const clearJoinTimeout = () => {
        if (joinTimeoutId) { clearTimeout(joinTimeoutId); joinTimeoutId = null }
      }

      const onJoined = () => {
        clearJoinTimeout()
        if (!cancelled) { setJoined(true); setError(''); updateTracks() }
      }

      // Specialist: when the kid (re)joins, re-assert the current mute state so a
      // reconnecting child doesn't come back un-muted against the specialist's wish
      const onParticipantJoined = () => {
        if (cancelled || role !== 'specialist') return
        if (kidMutedRef.current) {
          try { call.sendAppMessage({ t: 'kid-mic', on: false } as MicCmd, '*') } catch { /* ignore */ }
        }
      }
      // Kid: obey the specialist's mic commands
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onAppMessage = (e: any) => {
        if (cancelled || role !== 'kid') return
        const data = e?.data as MicCmd | undefined
        if (data?.t !== 'kid-mic') return
        call.setLocalAudio(data.on)
        setMicOn(data.on)
        setMicLocked(!data.on)
      }
      // Surface the REAL Daily error so we can diagnose (camera-in-use, expired
      // room, blocked script, etc.) instead of a generic message.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const onError = (e: any) => {
        clearJoinTimeout()
        // Camera/mic permission problems are non-fatal — the call still connects
        // with the other person's video, so don't treat them as a hard failure.
        const t = e?.errorMsg || e?.error?.type || ''
        if (/permission|not-allowed|cam-in-use|mic-in-use|devices/i.test(String(t))) return
        if (!cancelled) setError(`تعذر الاتصال: ${e?.errorMsg || 'خطأ غير معروف'}`)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      evs.forEach(ev => call.on(ev as any, updateTracks))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('joined-meeting', onJoined as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.on('error', onError as any)
      if (role === 'specialist') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on('participant-joined', onParticipantJoined as any)
      }
      if (role === 'kid') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.on('app-message', onAppMessage as any)
      }

      // Hard timeout — if Daily's join() never resolves (network stall, a
      // hung signaling connection), don't leave the UI stuck on "جارٍ
      // الاتصال..." forever with no way out.
      joinTimeoutId = setTimeout(() => {
        if (!cancelled && call.meetingState() !== 'joined-meeting') {
          setError('تعذر الاتصال: انتهت المهلة — تحقق من الاتصال بالإنترنت')
        }
      }, JOIN_TIMEOUT_MS)

      call.join({ url, userName }).catch((err: unknown) => {
        clearJoinTimeout()
        if (!cancelled) setError(`تعذر الاتصال: ${err instanceof Error ? err.message : 'خطأ في الانضمام'}`)
      })

      // Store cleanup handlers for the outer effect's return function
      cleanupRef.current = () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        evs.forEach(ev => call.off(ev as any, updateTracks))
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('joined-meeting', onJoined as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('error', onError as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('participant-joined', onParticipantJoined as any)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        call.off('app-message', onAppMessage as any)
        call.leave().catch(() => {}).finally(() => { call.destroy().catch(() => {}) })
      }
    }

    const cleanupRef = { current: null as (() => void) | null }
    init()

    return () => {
      cancelled = true
      if (joinTimeoutId) clearTimeout(joinTimeoutId)
      cleanupRef.current?.()
      callRef.current = null
    }
  }, [url, userName, role, retryNonce])

  // Specialist: toggle the kid's microphone remotely via app message
  const toggleKidMic = useCallback(() => {
    const call = callRef.current
    if (!call) return
    const nextMuted = !kidMutedRef.current
    kidMutedRef.current = nextMuted
    setKidMuted(nextMuted)
    try { call.sendAppMessage({ t: 'kid-mic', on: !nextMuted } as MicCmd, '*') } catch { /* ignore */ }
  }, [])

  const toggleCam = useCallback(() => {
    const call = callRef.current
    if (!call) return
    const next = !camOn
    call.setLocalVideo(next)
    setCamOn(next)
  }, [camOn])

  const toggleMic = useCallback(() => {
    const call = callRef.current
    if (!call) return
    // Kid can't unmute themselves while the specialist has locked their mic
    if (role === 'kid' && micLocked) return
    const next = !micOn
    call.setLocalAudio(next)
    setMicOn(next)
  }, [micOn, role, micLocked])

  const btnSize = compact ? 28 : 36
  const iconCls = compact ? 'w-3.5 h-3.5' : 'w-4 h-4'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#111827', overflow: 'hidden' }} dir="rtl">
      {/* Remote video — fills the container */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: remotePresent ? 'block' : 'none' }}
      />
      <audio ref={remoteAudioRef} autoPlay />

      {/* Waiting state */}
      {!remotePresent && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(255,255,255,0.6)',
        }}>
          {error ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, padding: 8, textAlign: 'center' }}>
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
          ) : (
            <>
              <div style={{
                width: compact ? 24 : 36, height: compact ? 24 : 36, borderRadius: '50%',
                border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#7C5CFC',
                animation: 'dvc-spin 0.9s linear infinite',
              }} />
              <span style={{ fontSize: compact ? 10 : 12, fontWeight: 700 }}>
                {joined ? 'في انتظار الطرف الآخر...' : 'جارٍ الاتصال...'}
              </span>
            </>
          )}
          <style>{`@keyframes dvc-spin { to { transform: rotate(360deg) } }`}</style>
        </div>
      )}

      {/* Local self-view — small corner */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{
          position: 'absolute', top: compact ? 4 : 8, left: compact ? 4 : 8,
          width: compact ? '30%' : '26%', aspectRatio: '4/3', objectFit: 'cover',
          borderRadius: compact ? 6 : 10, border: '1.5px solid rgba(255,255,255,0.25)',
          background: '#000', display: camOn ? 'block' : 'none',
        }}
      />

      {/* Controls */}
      <div style={{
        position: 'absolute', bottom: compact ? 4 : 8, left: 0, right: 0,
        display: 'flex', justifyContent: 'center', gap: compact ? 6 : 10,
      }}>
        <button
          onClick={toggleMic}
          title={role === 'kid' && micLocked ? 'الأستاذ كتم صوتك' : micOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: 'none',
            cursor: role === 'kid' && micLocked ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: micOn ? 'rgba(255,255,255,0.15)' : '#DC2626', color: '#fff',
            opacity: role === 'kid' && micLocked ? 0.7 : 1,
          }}
        >
          {micOn ? <Mic className={iconCls} /> : <MicOff className={iconCls} />}
        </button>

        {/* Specialist only: remotely mute/unmute the child's microphone */}
        {role === 'specialist' && (
          <button
            onClick={toggleKidMic}
            title={kidMuted ? 'إلغاء كتم مايك الطفل' : 'كتم مايك الطفل'}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              height: btnSize, padding: '0 12px', borderRadius: btnSize / 2, border: 'none', cursor: 'pointer',
              background: kidMuted ? '#DC2626' : 'rgba(255,255,255,0.15)', color: '#fff',
              fontSize: compact ? 10 : 12, fontWeight: 900, whiteSpace: 'nowrap',
            }}
          >
            {kidMuted ? <MicOff className={iconCls} /> : <Mic className={iconCls} />}
            {kidMuted ? 'صوت الطفل مكتوم' : 'كتم الطفل'}
          </button>
        )}

        <button
          onClick={toggleCam}
          title={camOn ? 'إيقاف الكاميرا' : 'تشغيل الكاميرا'}
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: camOn ? 'rgba(255,255,255,0.15)' : '#DC2626', color: '#fff',
          }}
        >
          {camOn ? <Video className={iconCls} /> : <VideoOff className={iconCls} />}
        </button>
        {/* Reconnect — recover from a transient network drop without reloading */}
        <button
          onClick={reconnect}
          title="إعادة الاتصال"
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.15)', color: '#fff',
          }}
        >
          <RefreshCw className={iconCls} />
        </button>
      </div>
    </div>
  )
}
