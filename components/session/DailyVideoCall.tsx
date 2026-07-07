'use client'
// Embedded Daily.co call using the JS SDK (call-object mode) — NO iframe.
// Camera/mic are requested by OUR origin, so Chrome never shows the
// cross-origin "camera blocked" wall, and there is no Daily.co UI
// (no banner, no Leave button) covering the video.
import { useEffect, useRef, useState, useCallback } from 'react'
import Daily, { type DailyCall } from '@daily-co/daily-js'
import { Mic, MicOff, Video, VideoOff } from 'lucide-react'

interface Props {
  url: string
  userName: string
  /** Compact mode for the kid page: smaller controls, remote video fills the box */
  compact?: boolean
}

export default function DailyVideoCall({ url, userName, compact = false }: Props) {
  const callRef        = useRef<DailyCall | null>(null)
  const localVideoRef  = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const remoteAudioRef = useRef<HTMLAudioElement>(null)
  const [joined, setJoined]               = useState(false)
  const [camOn, setCamOn]                 = useState(true)
  const [micOn, setMicOn]                 = useState(true)
  const [remotePresent, setRemotePresent] = useState(false)
  const [error, setError]                 = useState('')

  useEffect(() => {
    let cancelled = false
    // Reuse an existing instance (Daily allows one per page; React strict
    // mode double-mounts effects in dev)
    const call: DailyCall = Daily.getCallInstance() ?? Daily.createCallObject()
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

    const evs = ['joined-meeting', 'participant-joined', 'participant-updated', 'participant-left', 'track-started', 'track-stopped'] as const
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    evs.forEach(ev => call.on(ev as any, updateTracks))
    const onJoined = () => { if (!cancelled) { setJoined(true); updateTracks() } }
    const onError  = () => { if (!cancelled) setError('تعذر الاتصال بالمكالمة') }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call.on('joined-meeting', onJoined as any)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    call.on('error', onError as any)

    if (call.meetingState() === 'new') {
      call.join({ url, userName }).catch(() => { if (!cancelled) setError('تعذر الاتصال بالمكالمة') })
    } else {
      updateTracks()
      setJoined(true)
    }

    return () => {
      cancelled = true
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      evs.forEach(ev => call.off(ev as any, updateTracks))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.off('joined-meeting', onJoined as any)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      call.off('error', onError as any)
      call.leave().catch(() => {}).finally(() => { call.destroy().catch(() => {}) })
      callRef.current = null
    }
  }, [url, userName])

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
    const next = !micOn
    call.setLocalAudio(next)
    setMicOn(next)
  }, [micOn])

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
            <span style={{ fontSize: compact ? 11 : 13, fontWeight: 700, color: '#F87171' }}>{error}</span>
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
          title={micOn ? 'كتم الصوت' : 'تشغيل الصوت'}
          style={{
            width: btnSize, height: btnSize, borderRadius: '50%', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: micOn ? 'rgba(255,255,255,0.15)' : '#DC2626', color: '#fff',
          }}
        >
          {micOn ? <Mic className={iconCls} /> : <MicOff className={iconCls} />}
        </button>
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
      </div>
    </div>
  )
}
