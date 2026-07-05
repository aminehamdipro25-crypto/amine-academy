'use client'
import { useCallback, useEffect, useRef } from 'react'

export function useVoiceInstruction() {
  const synthRef = useRef<SpeechSynthesis | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      synthRef.current = window.speechSynthesis
    }
    return () => { synthRef.current?.cancel() }
  }, [])

  const speak = useCallback((text: string, rate = 0.85) => {
    const synth = synthRef.current
    if (!synth) return
    synth.cancel()
    const utt = new SpeechSynthesisUtterance(text)
    utt.lang  = 'ar-SA'
    utt.rate  = rate
    utt.pitch = 1.05
    // prefer Arabic voice if available
    const voices = synth.getVoices()
    const arVoice = voices.find(v => v.lang.startsWith('ar'))
    if (arVoice) utt.voice = arVoice
    synth.speak(utt)
  }, [])

  const stop = useCallback(() => {
    synthRef.current?.cancel()
  }, [])

  return { speak, stop }
}
