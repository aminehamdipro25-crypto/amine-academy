'use client'
import { useCallback, useEffect } from 'react'
import { speakArabic, cancelSpeech } from '@/lib/speech'

export function useVoiceInstruction() {
  useEffect(() => () => { cancelSpeech() }, [])

  const speak = useCallback((text: string, rate = 0.85) => {
    speakArabic(text, rate)
  }, [])

  const stop = useCallback(() => {
    cancelSpeech()
  }, [])

  return { speak, stop }
}
